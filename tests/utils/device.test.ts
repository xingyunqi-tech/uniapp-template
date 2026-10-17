import { afterEach, describe, expect, it } from 'vitest';
import { getDeviceId } from '@/utils/device';
import { storage, STORAGE_KEYS } from '@/utils/storage';

afterEach(() => {
  storage.remove(STORAGE_KEYS.DEVICE_ID);
});

describe('getDeviceId', () => {
  it('首次读取生成 UUID 格式的标识并保存到本地存储', () => {
    const deviceId = getDeviceId();

    expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(storage.get(STORAGE_KEYS.DEVICE_ID)).toBe(deviceId);
  });

  it('再次读取复用已保存的标识', () => {
    storage.set(STORAGE_KEYS.DEVICE_ID, 'saved-device');

    expect(getDeviceId()).toBe('saved-device');
    expect(getDeviceId()).toBe('saved-device');
  });

  it('清除业务缓存后标识保留', () => {
    const deviceId = getDeviceId();

    storage.clearCache();

    expect(getDeviceId()).toBe(deviceId);
  });
});
