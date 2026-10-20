/**
 * 远程配置 Store：按 key 缓存后端公开配置（公开接口，无需登录），持久化后启动即可读取上次的值
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ApiError, getConfig, type ConfigValue } from '@/api';
import { onNetworkChange } from '@/utils/network';

/** load 选项 */
export interface LoadConfigOptions {
  /** 本次 key 全部加载完成且无失败后，删除缓存中不在本次列表里的 key */
  prune?: boolean;
}

export const useConfigStore = defineStore(
  'config',
  () => {
    // ==================== State ====================
    /** 配置缓存：key → value */
    const values = ref<Record<string, ConfigValue>>({});
    /** 进行中的请求，按 key 复用 */
    const inflight = new Map<string, Promise<void>>();
    /** 加载失败（不含 404）的 key */
    const failedKeys = new Set<string>();
    /** 待剪枝时保留的 key 列表 */
    let pruneKeep: readonly string[] | null = null;
    /** 最近一次网络事件的连接状态，未收到事件时为 null */
    let lastConnected: boolean | null = null;

    // ==================== Actions ====================

    function fetchOne(key: string): Promise<void> {
      const existing = inflight.get(key);
      if (existing) return existing;

      // 公开接口：不刷新 Token，401 不跳转登录
      const promise = getConfig(key, { showError: false, skipAuthHandling: true })
        .then(config => {
          failedKeys.delete(key);
          values.value = { ...values.value, [key]: config.value };
        })
        .catch(error => {
          // 配置不存在或未公开时清除缓存，其余失败保留缓存
          if (error instanceof ApiError && error.status === 404) {
            failedKeys.delete(key);
            const rest = { ...values.value };
            delete rest[key];
            values.value = rest;
          } else {
            failedKeys.add(key);
          }
        })
        .finally(() => {
          inflight.delete(key);
        });
      inflight.set(key, promise);
      return promise;
    }

    function prunePending(): void {
      const keep = pruneKeep;
      if (!keep || keep.some(key => inflight.has(key) || failedKeys.has(key))) return;
      pruneKeep = null;
      values.value = Object.fromEntries(Object.entries(values.value).filter(([key]) => keep.includes(key)));
    }

    /**
     * 并发拉取配置，单个失败不影响其他，不提示错误，不会 reject
     * @param keys 配置 key 列表
     * @param options 加载选项
     */
    async function load(keys: readonly string[], options: LoadConfigOptions = {}): Promise<void> {
      const uniqueKeys = [...new Set(keys)];
      if (options.prune) pruneKeep = uniqueKeys;
      await Promise.all(uniqueKeys.map(fetchOne));
      prunePending();
    }

    /**
     * 重新拉取加载失败（不含 404）的配置，无失败时不发请求
     */
    function retryFailed(): Promise<void> {
      return load([...failedKeys]);
    }

    // 网络从离线恢复（或首次收到在线事件）时重试失败的配置
    onNetworkChange(isConnected => {
      const recovered = isConnected && lastConnected !== true;
      lastConnected = isConnected;
      if (recovered && failedKeys.size > 0) retryFailed();
    });

    /**
     * 同步读取配置值（配置存储结构 `{ value }` 中的 value），未加载、加载失败或缺少 value 时返回默认值
     * @param key 配置 key
     * @param defaultValue 默认值
     */
    function get<T = unknown>(key: string, defaultValue: T): T {
      const config = values.value[key];
      return config !== undefined && Object.prototype.hasOwnProperty.call(config, 'value')
        ? (config.value as T)
        : defaultValue;
    }

    return {
      values,
      load,
      retryFailed,
      get,
    };
  },
  {
    persist: {
      pick: ['values'],
    },
  },
);
