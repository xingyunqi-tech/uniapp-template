import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { NotificationSetting } from '@/api';

const server = vi.hoisted(() => {
  type Pending = { body: Record<string, unknown>; resolve: (value: unknown) => void; reject: (e: unknown) => void };
  const pending: Pending[] = [];
  const handler = vi.fn(
    (body: Record<string, unknown>) =>
      new Promise((resolve, reject) => {
        pending.push({ body, resolve, reject });
      }),
  );
  return { pending, handler };
});

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  updateNotificationSettings: server.handler,
}));

const { useNotificationStore } = await import('@/store/modules/notification');

const baseSetting = {
  category: 'ORDER',
  enableInApp: true,
  enablePush: true,
  enableEmail: false,
  enableSms: false,
} as NotificationSetting;

function setup() {
  const store = useNotificationStore();
  store.settings = [{ ...baseSetting }];
  return store;
}

beforeEach(() => {
  setActivePinia(createPinia());
  server.pending.length = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('updateSettings', () => {
  it('请求发出前更新本地设置，失败后回滚', async () => {
    const store = setup();

    const pending = store.updateSettings('ORDER', false, false, false, true);
    expect(store.settings[0].enableInApp).toBe(false);

    server.pending[0].reject(new Error('network'));
    await pending;
    expect(store.settings[0].enableInApp).toBe(true);
  });

  it('连续切换时后一次请求携带前一次的修改', async () => {
    const store = setup();

    void store.updateSettings('ORDER', false, false, false, true);
    const { enableInApp, enableEmail, enableSms } = store.settings[0];
    void store.updateSettings('ORDER', enableInApp, enableEmail, enableSms, false);

    expect(server.pending[1].body).toMatchObject({ enableInApp: false, enablePush: false });
  });

  it('先发出的请求晚返回时不覆盖最近一次的设置', async () => {
    const store = setup();

    const first = store.updateSettings('ORDER', false, false, false, true);
    const second = store.updateSettings('ORDER', false, false, false, false);
    server.pending[1].resolve({ ...baseSetting, enableInApp: false, enablePush: false });
    await second;
    server.pending[0].resolve({ ...baseSetting, enableInApp: false, enablePush: true });
    await first;

    expect(store.settings[0]).toMatchObject({ enableInApp: false, enablePush: false });
  });
});
