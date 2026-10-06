import { describe, expect, it } from 'vitest';
import { defineStore, setActivePinia } from 'pinia';
import { createApp, nextTick, ref } from 'vue';
import { createPersistedPinia } from '@/store/plugins/persist';
import { useUserStore } from '@/store/modules/user';

const useDemoStore = defineStore(
  'persist-demo',
  () => {
    const kept = ref('');
    const dropped = ref('');
    return { kept, dropped };
  },
  { persist: { pick: ['kept'] } },
);

function createStore() {
  const pinia = createPersistedPinia();
  createApp({}).use(pinia);
  setActivePinia(pinia);
  return useDemoStore();
}

describe('Pinia 持久化', () => {
  it('按 pick 写入 uni 存储，并在新的 Pinia 实例中恢复', async () => {
    const store = createStore();
    store.kept = 'value';
    store.dropped = 'value';
    await nextTick();

    expect(JSON.parse(uni.getStorageSync('persist-demo'))).toEqual({ kept: 'value' });

    const restored = createStore();
    expect(restored.kept).toBe('value');
    expect(restored.dropped).toBe('');
  });

  it('resetUserState 后持久化的 userInfo 为空，新实例不恢复用户信息', async () => {
    createStore();
    const store = useUserStore();
    store.userInfo = { id: 1 } as NonNullable<typeof store.userInfo>;
    await nextTick();
    expect(JSON.parse(uni.getStorageSync('user'))).toEqual({ userInfo: { id: 1 } });

    store.resetUserState();
    await nextTick();

    expect(JSON.parse(uni.getStorageSync('user'))).toEqual({ userInfo: null });
    createStore();
    expect(useUserStore().userInfo).toBeNull();
  });
});
