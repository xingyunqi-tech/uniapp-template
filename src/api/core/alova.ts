/**
 * HTTP 客户端实例
 * 基于 Alova.js 实现，业务代码通过 http 导出使用
 */
import { createAlova } from 'alova';
import AdapterUniapp from '@alova/adapter-uniapp';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { reportApiError } from '@/utils/errorReporter';
import { useUserStore } from '@/store/modules/user';

// ==================== 类型定义 ====================

/** API 响应格式 */
export interface ApiResponse<T = any> {
  code: number;
  data?: T;
  message: string;
  timestamp?: number;
}

/** 请求 meta 配置 */
export interface RequestMeta {
  /** 是否显示 loading */
  showLoading?: boolean;
  /** loading 提示文字 */
  loadingText?: string;
  /** 是否显示错误提示 */
  showError?: boolean;
}

// ==================== 401 防重复跳转 ====================

let isRedirectingToLogin = false;

/** 重置登录跳转状态 */
export function resetLoginRedirectState(): void {
  isRedirectingToLogin = false;
}

// ==================== 创建 Alova 实例 ====================

const alovaInstance = createAlova({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,

  // UniApp 适配器（自动配置请求适配器、存储适配器、Vue Hooks）
  ...AdapterUniapp(),

  // ==================== 请求拦截器 ====================
  beforeRequest(method) {
    // 1. 添加 Token
    const token = storage.get<string>(STORAGE_KEYS.TOKEN);
    if (token) {
      method.config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. 显示 Loading
    const meta = method.meta as RequestMeta | undefined;
    if (meta?.showLoading) {
      uni.showLoading({
        title: meta.loadingText || '加载中...',
        mask: true,
      });
    }
  },

  // ==================== 响应拦截器 ====================
  responded: {
    // 成功响应
    onSuccess: async (response, method) => {
      const { statusCode, data } = response as UniNamespace.RequestSuccessCallbackResult;
      const meta = method.meta as RequestMeta | undefined;

      // 隐藏 Loading
      if (meta?.showLoading) {
        uni.hideLoading();
      }

      // 401 未授权 - 登录过期
      if (statusCode === 401) {
        reportApiError(method.url, method.type, 'Unauthorized', 401);

        if (!isRedirectingToLogin) {
          isRedirectingToLogin = true;

          // 清除完整的登录信息（包括 token、refreshToken、userInfo）
          storage.remove(STORAGE_KEYS.TOKEN);
          const userStore = useUserStore();
          await userStore.logout();

          uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });

          setTimeout(() => {
            uni.redirectTo({
              url: '/pages/login/index',
              complete: () => {
                isRedirectingToLogin = false;
              },
            });
          }, 1500);
        }

        throw new Error('Unauthorized');
      }

      // HTTP 错误
      if (statusCode >= 400) {
        const msg = (data as ApiResponse)?.message || `请求失败(${statusCode})`;
        if (meta?.showError !== false) {
          uni.showToast({ title: msg, icon: 'none' });
        }
        reportApiError(method.url, method.type, msg, statusCode);
        throw new Error(msg);
      }

      const result = data as ApiResponse;

      // 业务错误
      if (result.code !== 200 && result.code !== 0) {
        if (meta?.showError !== false) {
          uni.showToast({ title: result.message || '请求失败', icon: 'none' });
        }
        reportApiError(method.url, method.type, result.message || '业务错误', result.code);
        throw new Error(result.message || '业务错误');
      }

      return result;
    },

    // 请求失败
    onError: (error, method) => {
      uni.hideLoading();

      const meta = method.meta as RequestMeta | undefined;
      const errorMessage = error.message || '网络请求失败';

      if (meta?.showError !== false) {
        uni.showToast({ title: errorMessage, icon: 'none' });
      }

      reportApiError(method.url, method.type, errorMessage);
      throw error;
    },
  },

  // ==================== 缓存配置 ====================
  // GET 请求默认缓存 5 分钟
  cacheFor: {
    GET: 5 * 60 * 1000,
  },
});

/** HTTP 客户端（对外导出，隐藏 alova 实现细节） */
export const http = alovaInstance;
