/**
 * 协议同意 Store：游客按本地已同意版本判断，登录用户以服务端同意状态为准；本地同意记录在登录后上报
 */
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import {
  agreeConsent,
  ApiError,
  getMyConsents,
  type ConsentStatusDto,
  type ConsentType,
  type RequestOptions,
} from '@/api';
import { CONSENT_VERSION_CONFIG_KEYS, LAUNCH_CONSENT_TYPES } from '@/constants/config';
import { onNetworkChange } from '@/utils/network';
import { useConfigStore } from './config';
import { useUserStore } from './user';

type ConsentVersions = Partial<Record<ConsentType, string>>;

/** 待上报的同意记录，userId 为 null 表示游客同意 */
export interface PendingConsent {
  version: string;
  userId: number | null;
}

type PendingConsents = Partial<Record<ConsentType, PendingConsent>>;

const GUEST = 'guest';

const SILENT_REQUEST: RequestOptions = { showError: false, skipAuthHandling: true };

const CONSENT_CONFIG_KEYS = Object.values(CONSENT_VERSION_CONFIG_KEYS);

function isVersionNotCurrent(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 422) return false;
  const { details } = error;
  return typeof details === 'object' && details !== null && 'version' in details;
}

export const useConsentStore = defineStore(
  'consent',
  () => {
    const userStore = useUserStore();
    const configStore = useConfigStore();

    // ==================== State ====================
    /** 本机已同意的协议版本 */
    const agreedVersions = ref<ConsentVersions>({});
    /** 本机已同意、尚未上报到服务端的协议版本 */
    const pendingVersions = ref<PendingConsents>({});
    /** 当前登录用户的服务端同意状态，未登录或未取得时为 null */
    const serverStatuses = ref<ConsentStatusDto[] | null>(null);
    /** 是否已完成首次检查 */
    const checked = ref(false);
    let syncing: Promise<void> | null = null;
    let checking: { identity: string; promise: Promise<ConsentType[]> } | null = null;

    // ==================== Getters ====================

    function currentUserId(): number | null {
      return userStore.isLoggedIn ? (userStore.userInfo?.id ?? null) : null;
    }

    /** 当前身份：游客为 guest，登录用户为 userId */
    const identity = computed(() => (userStore.isLoggedIn ? `user:${userStore.userInfo?.id ?? ''}` : GUEST));

    /** 当前身份可上报的待上报记录：游客记录或当前用户的记录 */
    function uploadablePending(type: ConsentType): PendingConsent | undefined {
      const pending = pendingVersions.value[type];
      if (!pending) return undefined;
      return pending.userId === null || pending.userId === currentUserId() ? pending : undefined;
    }

    function serverStatus(type: ConsentType): ConsentStatusDto | undefined {
      return serverStatuses.value?.find(status => status.type === type);
    }

    /** 协议当前版本，未配置时为 null */
    function currentVersion(type: ConsentType): string | null {
      const status = serverStatus(type);
      if (status) return status.currentVersion;
      const value = configStore.get<unknown>(CONSENT_VERSION_CONFIG_KEYS[type], null);
      return typeof value === 'string' && value.trim() !== '' ? value : null;
    }

    /** 是否需要同意该协议的当前版本 */
    function needsConsent(type: ConsentType): boolean {
      const version = currentVersion(type);
      if (version === null) return false;
      const status = serverStatus(type);
      if (status) return status.needsConsent && uploadablePending(type)?.version !== version;
      return agreedVersions.value[type] !== version;
    }

    /** 是否为版本升级后的重新同意 */
    function isUpgrade(type: ConsentType): boolean {
      const status = serverStatus(type);
      return Boolean(status ? status.agreedVersion : agreedVersions.value[type]);
    }

    /** 启动时须同意而尚未同意的协议，首次检查完成前为空 */
    const required = computed<ConsentType[]>(() =>
      checked.value ? LAUNCH_CONSENT_TYPES.filter(type => needsConsent(type)) : [],
    );

    // ==================== Actions ====================

    function setAgreed(type: ConsentType, version: string | null): void {
      const next = { ...agreedVersions.value };
      if (version === null) delete next[type];
      else next[type] = version;
      agreedVersions.value = next;
    }

    function setPending(type: ConsentType, pending: PendingConsent | null): void {
      const next = { ...pendingVersions.value };
      if (pending === null) delete next[type];
      else next[type] = pending;
      pendingVersions.value = next;
    }

    /** 丢弃不属于当前用户的已登录用户待上报记录 */
    function dropOtherUsersPending(): void {
      const userId = currentUserId();
      pendingVersions.value = Object.fromEntries(
        Object.entries(pendingVersions.value).filter(
          ([, pending]) => pending.userId === null || pending.userId === userId,
        ),
      ) as PendingConsents;
    }

    function applyServerStatus(status: ConsentStatusDto): void {
      if (status.agreed && status.currentVersion) setAgreed(status.type, status.currentVersion);
      if (serverStatuses.value) {
        serverStatuses.value = serverStatuses.value.map(item => (item.type === status.type ? status : item));
      }
    }

    async function fetchServerStatuses(): Promise<void> {
      const requestIdentity = identity.value;
      try {
        const statuses = await getMyConsents(SILENT_REQUEST);
        if (identity.value !== requestIdentity) return;
        serverStatuses.value = statuses;
        statuses.forEach(applyServerStatus);
      } catch {
        // 取不到服务端状态时按本机记录判断
      }
    }

    async function uploadPending(): Promise<void> {
      const types = Object.keys(pendingVersions.value) as ConsentType[];
      for (const type of types) {
        const pending = uploadablePending(type);
        if (!pending) continue;
        const { version } = pending;
        try {
          applyServerStatus(await agreeConsent({ type, version }, SILENT_REQUEST));
          if (pendingVersions.value[type] === pending) setPending(type, null);
        } catch (error) {
          if (!isVersionNotCurrent(error)) continue;
          if (pendingVersions.value[type] === pending) setPending(type, null);
          if (agreedVersions.value[type] === version) setAgreed(type, null);
        }
      }
    }

    /**
     * 上报游客或当前用户的待上报记录，版本已非当前时丢弃；失败的记录保留到下次重试
     */
    function syncPending(): Promise<void> {
      const hasUploadable = (Object.keys(pendingVersions.value) as ConsentType[]).some(type => uploadablePending(type));
      if (!userStore.isLoggedIn || !hasUploadable) return Promise.resolve();
      if (!syncing) {
        syncing = uploadPending().finally(() => {
          syncing = null;
        });
      }
      return syncing;
    }

    async function runCheck(loggedIn: boolean): Promise<ConsentType[]> {
      await configStore.load(CONSENT_CONFIG_KEYS);
      if (loggedIn) {
        await syncPending();
        await fetchServerStatuses();
      } else if (!userStore.isLoggedIn) {
        serverStatuses.value = null;
      }
      checked.value = true;
      return required.value;
    }

    /**
     * 检查同意状态：拉取协议当前版本，登录用户先上报本机记录再读取服务端状态，返回启动时须同意的协议；
     * 身份不变时复用进行中的检查
     */
    function check(): Promise<ConsentType[]> {
      const currentIdentity = identity.value;
      if (checking?.identity !== currentIdentity) {
        const promise = runCheck(userStore.isLoggedIn).finally(() => {
          if (checking?.promise === promise) checking = null;
        });
        checking = { identity: currentIdentity, promise };
      }
      return checking.promise;
    }

    /**
     * 同意协议的当前版本：登录用户上报服务端，游客或上报失败时记在本机待上报；
     * 版本已更新时刷新状态并返回 false
     */
    async function agree(types: readonly ConsentType[]): Promise<boolean> {
      let outdated = false;
      for (const type of types) {
        const version = currentVersion(type);
        if (version === null) continue;
        setAgreed(type, version);
        const userId = currentUserId();
        if (!userStore.isLoggedIn) {
          setPending(type, { version, userId: null });
          continue;
        }
        try {
          applyServerStatus(await agreeConsent({ type, version }, SILENT_REQUEST));
        } catch (error) {
          if (isVersionNotCurrent(error)) {
            setAgreed(type, null);
            outdated = true;
          } else if (userId !== null) {
            setPending(type, { version, userId });
          }
        }
      }
      if (outdated) {
        serverStatuses.value = null;
        await configStore.load(CONSENT_CONFIG_KEYS);
        await fetchServerStatuses();
      }
      return !outdated;
    }

    watch(identity, () => {
      serverStatuses.value = null;
      dropOtherUsersPending();
      if (userStore.isLoggedIn) check();
    });

    onNetworkChange(isConnected => {
      if (isConnected) syncPending();
    });

    return {
      agreedVersions,
      pendingVersions,
      serverStatuses,
      required,
      currentVersion,
      needsConsent,
      isUpgrade,
      check,
      agree,
      syncPending,
    };
  },
  {
    persist: {
      pick: ['agreedVersions', 'pendingVersions'],
    },
  },
);
