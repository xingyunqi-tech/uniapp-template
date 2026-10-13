import { beforeEach, describe, expect, it } from 'vitest';
import { storage, STORAGE_KEYS } from '@/utils/storage';

describe('业务缓存', () => {
  beforeEach(() => {
    storage.remove(STORAGE_KEYS.SEARCH_HISTORY);
    storage.remove(STORAGE_KEYS.DRAFT);
    storage.remove(STORAGE_KEYS.TOKEN);
  });

  it('按 UTF-8 字节数统计业务缓存大小', () => {
    storage.set(STORAGE_KEYS.SEARCH_HISTORY, ['手机']);
    storage.set(STORAGE_KEYS.DRAFT, 'ab');

    expect(storage.getCacheSize()).toBe(JSON.stringify(['手机']).length + 4 + 2);
  });

  it('清除业务缓存时保留登录 Token', () => {
    storage.set(STORAGE_KEYS.SEARCH_HISTORY, ['a']);
    storage.set(STORAGE_KEYS.TOKEN, 'token');

    storage.clearCache();

    expect(storage.get(STORAGE_KEYS.SEARCH_HISTORY)).toBeNull();
    expect(storage.get(STORAGE_KEYS.TOKEN)).toBe('token');
    expect(storage.getCacheSize()).toBe(0);
  });
});
