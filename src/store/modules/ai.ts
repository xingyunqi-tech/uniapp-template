/**
 * AI 助教 Store：总开关、今日额度，以及讲题会话对应的练习会话（发送消息时携带 sessionId）
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getAiQuota, type AiQuotaDto } from '@/api';
import { AI_ENABLED_CONFIG_KEY, AI_SESSION_MEMORY_LIMIT } from '@/constants/ai';
import { useConfigStore } from './config';

export const useAiStore = defineStore(
  'ai',
  () => {
    const configStore = useConfigStore();

    // ==================== State ====================
    /** 今日讲题额度，未取得时为 null */
    const quota = ref<AiQuotaDto | null>(null);
    /** 讲题会话 id → 发起时的练习会话 id，按写入顺序保留最近的若干条 */
    const conversationSessions = ref<Record<string, string>>({});

    // ==================== Getters ====================
    /** AI 总开关，未取得配置时视为开启 */
    const enabled = computed(() => configStore.get<unknown>(AI_ENABLED_CONFIG_KEY, true) !== false);

    // ==================== Actions ====================

    let enabledLoading: Promise<boolean> | null = null;

    /** 拉取 AI 总开关 */
    function loadEnabled(): Promise<boolean> {
      enabledLoading = configStore.load([AI_ENABLED_CONFIG_KEY]).then(() => enabled.value);
      return enabledLoading;
    }

    /** 本次启动尚未拉取过总开关时拉取 */
    function ensureEnabled(): Promise<boolean> {
      return enabledLoading ?? loadEnabled();
    }

    /** 拉取今日额度，失败时保留上次结果 */
    async function fetchQuota(): Promise<AiQuotaDto | null> {
      try {
        quota.value = await getAiQuota({ showError: false });
      } catch (error) {
        console.error('获取 AI 额度失败:', error);
      }
      return quota.value;
    }

    function rememberSession(conversationId: string, sessionId: string | null | undefined): void {
      const rest = { ...conversationSessions.value };
      delete rest[conversationId];
      if (!sessionId) {
        conversationSessions.value = rest;
        return;
      }
      const entries = [...Object.entries(rest), [conversationId, sessionId] as const];
      conversationSessions.value = Object.fromEntries(entries.slice(-AI_SESSION_MEMORY_LIMIT));
    }

    function sessionOf(conversationId: string): string | undefined {
      return conversationSessions.value[conversationId];
    }

    function forgetSession(conversationId: string): void {
      rememberSession(conversationId, null);
    }

    function clear(): void {
      quota.value = null;
      conversationSessions.value = {};
    }

    return {
      quota,
      conversationSessions,
      enabled,
      loadEnabled,
      ensureEnabled,
      fetchQuota,
      rememberSession,
      sessionOf,
      forgetSession,
      clear,
    };
  },
  {
    persist: {
      pick: ['conversationSessions'],
    },
  },
);
