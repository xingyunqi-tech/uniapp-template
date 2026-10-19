/**
 * 站点信息 Store：后台配置的站点信息与本地默认值合并，持久化后启动即可读取上次的值
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getAppProfile, type AppProfile } from '@/api';
import { DEFAULT_SITE_PROFILE, type SiteProfile } from '@/constants/system';

/** 站点信息过期时长（毫秒） */
export const APP_PROFILE_MAX_AGE = 30 * 60 * 1000;

const PROFILE_KEYS = Object.keys(DEFAULT_SITE_PROFILE) as Array<keyof SiteProfile>;

/** 取出已配置（去除首尾空白后非空）的字段 */
function pickConfigured(source: Partial<AppProfile> | null | undefined): Partial<SiteProfile> {
  const result: Partial<SiteProfile> = {};
  if (!source || typeof source !== 'object') return result;
  for (const key of PROFILE_KEYS) {
    const value = source[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) result[key] = trimmed;
  }
  return result;
}

export const useAppProfileStore = defineStore(
  'appProfile',
  () => {
    // ==================== State ====================
    /** 后台已配置的字段 */
    const remote = ref<Partial<SiteProfile>>({});
    /** 进行中的请求 */
    let inflight: Promise<void> | null = null;
    /** 本次启动最近一次拉取成功的时间戳，未成功时为 0 */
    let loadedAt = 0;

    // ==================== Getters ====================
    /** 合并默认值后的站点信息 */
    const profile = computed<Readonly<SiteProfile>>(() => ({
      ...DEFAULT_SITE_PROFILE,
      ...pickConfigured(remote.value),
    }));

    /** 分享标题，未配置时使用产品名称 */
    const shareTitle = computed(() => profile.value.shareTitle || profile.value.appName);

    // ==================== Actions ====================
    /**
     * 拉取站点信息，失败时保留上次缓存，不提示错误，不会 reject
     */
    function load(): Promise<void> {
      if (inflight) return inflight;
      inflight = getAppProfile({ showError: false, skipAuthHandling: true })
        .then(data => {
          remote.value = pickConfigured(data);
          loadedAt = Date.now();
        })
        .catch(() => {})
        .finally(() => {
          inflight = null;
        });
      return inflight;
    }

    /**
     * 距上次拉取成功超过 APP_PROFILE_MAX_AGE（或从未成功）时重新拉取
     */
    function refreshIfStale(): Promise<void> {
      if (loadedAt && Date.now() - loadedAt <= APP_PROFILE_MAX_AGE) return Promise.resolve();
      return load();
    }

    return {
      remote,
      profile,
      shareTitle,
      load,
      refreshIfStale,
    };
  },
  {
    persist: {
      pick: ['remote'],
    },
  },
);
