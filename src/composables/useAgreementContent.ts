import { ref } from 'vue';
import { ApiError, getConfig, type ConsentType } from '@/api';
import { AGREEMENT_CONTENT_CONFIG_KEYS } from '@/constants/config';
import { DEFAULT_AGREEMENT_CONTENT } from '@/constants/agreement';
import { useConsentStore } from '@/store/modules/consent';

/** 已取得的协议正文：`类型@版本` → HTML */
const contents = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function cacheKey(type: ConsentType): string {
  return `${type}@${useConsentStore().currentVersion(type) ?? ''}`;
}

function readHtml(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null;
  const html = (value as { value?: unknown }).value;
  return typeof html === 'string' && html.trim() !== '' ? html : null;
}

/**
 * 读取协议当前版本的正文：未配置（404）或内容为空时返回内置正文，其余失败时 reject
 * @param type 协议类型
 */
export function fetchAgreementContent(type: ConsentType): Promise<string> {
  const key = cacheKey(type);
  const cached = contents.get(key);
  if (cached !== undefined) return Promise.resolve(cached);
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = getConfig(AGREEMENT_CONTENT_CONFIG_KEYS[type], { showError: false, skipAuthHandling: true })
    .then(config => readHtml(config.value) ?? DEFAULT_AGREEMENT_CONTENT[type])
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) return DEFAULT_AGREEMENT_CONTENT[type];
      throw error;
    })
    .then(html => {
      if (inflight.get(key) === promise) contents.set(key, html);
      return html;
    })
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

/**
 * 清除协议各版本的已缓存正文，进行中的请求结果不再写入缓存
 * @param type 协议类型
 */
export function invalidateAgreementContent(type: ConsentType): void {
  const prefix = `${type}@`;
  [contents, inflight].forEach(map => {
    [...map.keys()].filter(key => key.startsWith(prefix)).forEach(key => map.delete(key));
  });
}

/**
 * 协议正文状态：多次 load 以最后一次为准，失败时 error 为 true，retry 重新加载最后一次的协议
 */
export function useAgreementContent() {
  const content = ref('');
  const loading = ref(false);
  const error = ref(false);
  let latest = 0;
  let lastType: ConsentType | null = null;

  async function load(type: ConsentType): Promise<void> {
    const id = ++latest;
    lastType = type;
    loading.value = true;
    error.value = false;
    try {
      const html = await fetchAgreementContent(type);
      if (id === latest) content.value = html;
    } catch {
      if (id === latest) {
        content.value = '';
        error.value = true;
      }
    } finally {
      if (id === latest) loading.value = false;
    }
  }

  function retry(): Promise<void> {
    return lastType === null ? Promise.resolve() : load(lastType);
  }

  return { content, loading, error, load, retry };
}
