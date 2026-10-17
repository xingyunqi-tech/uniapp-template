import { storage, STORAGE_KEYS } from './storage';

function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

/** 读取设备标识，本地不存在时生成并保存 */
export function getDeviceId(): string {
  const saved = storage.get<string>(STORAGE_KEYS.DEVICE_ID);
  if (saved) return saved;
  const deviceId = generateDeviceId();
  storage.set(STORAGE_KEYS.DEVICE_ID, deviceId);
  return deviceId;
}
