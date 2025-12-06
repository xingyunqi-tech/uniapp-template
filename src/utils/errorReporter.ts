/**
 * 错误上报工具
 * 统一管理应用的错误收集和上报
 */

// ==================== 类型定义 ====================

/** 错误级别 */
export type ErrorLevel = 'error' | 'warn' | 'info';

/** 错误类型 */
export type ErrorType = 'js' | 'api' | 'resource' | 'promise' | 'vue' | 'custom';

/** 错误上报用设备信息 (简化版) */
export interface ErrorDeviceInfo {
  /** 平台 */
  platform: string;
  /** 系统版本 */
  system: string;
  /** 应用版本 */
  appVersion: string;
  /** 品牌 */
  brand?: string;
  /** 型号 */
  model?: string;
  /** 网络类型 */
  networkType?: string;
}

/** 错误信息接口 */
export interface ErrorInfo {
  /** 错误类型 */
  type: ErrorType;
  /** 错误级别 */
  level: ErrorLevel;
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 发生时间 */
  timestamp: number;
  /** 页面路径 */
  page?: string;
  /** 额外信息 */
  extra?: Record<string, unknown>;
  /** 用户 ID */
  userId?: string | number;
  /** 设备信息 */
  deviceInfo?: ErrorDeviceInfo;
}

/** 错误上报配置 */
export interface ErrorReporterOptions {
  /** 上报地址 */
  reportUrl?: string;
  /** 是否启用上报 */
  enabled?: boolean;
  /** 是否在控制台打印 */
  consoleLog?: boolean;
  /** 采样率 (0-1) */
  sampleRate?: number;
  /** 最大缓存数量 */
  maxCacheSize?: number;
  /** 上报间隔 (ms) */
  reportInterval?: number;
  /** 获取用户 ID 的函数 */
  getUserId?: () => string | number | undefined;
  /** 自定义上报函数 */
  customReport?: (errors: ErrorInfo[]) => Promise<void>;
}

// ==================== 全局状态 ====================

/** 错误缓存队列 */
const errorQueue: ErrorInfo[] = [];

/** 是否已初始化 */
let isInitialized = false;

/** 全局配置 */
let globalOptions: Required<ErrorReporterOptions> = {
  reportUrl: '',
  enabled: import.meta.env.PROD, // 生产环境默认启用
  consoleLog: import.meta.env.DEV, // 开发环境默认打印
  sampleRate: 1, // 默认全量上报
  maxCacheSize: 50,
  reportInterval: 5000,
  getUserId: () => undefined,
  customReport: async () => {},
};

/** 上报定时器 */
let reportTimer: ReturnType<typeof setTimeout> | null = null;

/** 设备信息缓存 */
let cachedDeviceInfo: ErrorDeviceInfo | null = null;

// ==================== 内部方法 ====================

/**
 * 获取错误上报用设备信息
 */
function getErrorDeviceInfo(): ErrorDeviceInfo {
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  try {
    const systemInfo = uni.getSystemInfoSync();
    cachedDeviceInfo = {
      platform: systemInfo.platform || 'unknown',
      system: systemInfo.system || 'unknown',
      appVersion: systemInfo.appVersion || '1.0.0',
      brand: systemInfo.brand,
      model: systemInfo.model,
    };
  } catch {
    cachedDeviceInfo = {
      platform: 'unknown',
      system: 'unknown',
      appVersion: '1.0.0',
    };
  }

  return cachedDeviceInfo;
}

/**
 * 获取当前页面路径
 */
function getCurrentPage(): string {
  try {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    return currentPage ? `/${currentPage.route}` : 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * 是否应该采样上报
 */
function shouldSample(): boolean {
  return Math.random() < globalOptions.sampleRate;
}

/**
 * 格式化错误为 ErrorInfo
 */
function formatError(
  error: Error | string,
  type: ErrorType = 'js',
  level: ErrorLevel = 'error',
  extra?: Record<string, unknown>,
): ErrorInfo {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  return {
    type,
    level,
    message,
    stack,
    timestamp: Date.now(),
    page: getCurrentPage(),
    extra,
    userId: globalOptions.getUserId?.(),
    deviceInfo: getErrorDeviceInfo(),
  };
}

/**
 * 添加错误到队列
 */
function addToQueue(errorInfo: ErrorInfo): void {
  // 采样检查
  if (!shouldSample()) {
    return;
  }

  // 队列满时移除最早的错误
  if (errorQueue.length >= globalOptions.maxCacheSize) {
    errorQueue.shift();
  }

  errorQueue.push(errorInfo);

  // 控制台打印
  if (globalOptions.consoleLog) {
    const logMethod =
      errorInfo.level === 'error' ? console.error : errorInfo.level === 'warn' ? console.warn : console.log;
    logMethod(`[ErrorReporter] ${errorInfo.type}:`, errorInfo.message, errorInfo);
  }
}

/**
 * 执行上报
 */
async function doReport(): Promise<void> {
  if (errorQueue.length === 0) {
    return;
  }

  // 取出待上报的错误
  const errors = errorQueue.splice(0, errorQueue.length);

  try {
    // 优先使用自定义上报
    if (globalOptions.customReport) {
      await globalOptions.customReport(errors);
      return;
    }

    // 使用默认 HTTP 上报
    if (globalOptions.reportUrl) {
      await uni.request({
        url: globalOptions.reportUrl,
        method: 'POST',
        data: { errors },
        header: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (err) {
    // 上报失败，将错误放回队列
    errorQueue.unshift(...errors);
    console.error('[ErrorReporter] 上报失败:', err);
  }
}

/**
 * 启动定时上报
 */
function startReportTimer(): void {
  if (reportTimer) {
    return;
  }

  reportTimer = setInterval(() => {
    if (globalOptions.enabled) {
      doReport();
    }
  }, globalOptions.reportInterval);
}

/**
 * 停止定时上报
 */
function stopReportTimer(): void {
  if (reportTimer) {
    clearInterval(reportTimer);
    reportTimer = null;
  }
}

// ==================== 公共 API ====================

/**
 * 初始化错误上报
 * 应在 App.vue 的 onLaunch 中调用
 *
 * @example
 * ```ts
 * // App.vue
 * import { setupErrorReporter } from '@/utils/errorReporter';
 * import { useUserStore } from '@/store/modules/user';
 *
 * onLaunch(() => {
 *   setupErrorReporter({
 *     reportUrl: 'https://api.example.com/error/report',
 *     getUserId: () => useUserStore().userInfo?.id,
 *   });
 * });
 * ```
 */
export function setupErrorReporter(options: ErrorReporterOptions = {}): void {
  if (isInitialized) {
    console.warn('[ErrorReporter] 已初始化，请勿重复调用');
    return;
  }

  isInitialized = true;
  globalOptions = { ...globalOptions, ...options };

  // 启动定时上报
  if (globalOptions.enabled) {
    startReportTimer();
  }
}

/**
 * 手动上报错误
 *
 * @example
 * ```ts
 * // 上报 JS 错误
 * reportError(new Error('Something went wrong'));
 *
 * // 上报 API 错误
 * reportError('API 请求失败', 'api', 'error', { url: '/api/users', status: 500 });
 *
 * // 上报警告
 * reportError('用户操作异常', 'custom', 'warn', { action: 'click' });
 * ```
 */
export function reportError(
  error: Error | string,
  type: ErrorType = 'js',
  level: ErrorLevel = 'error',
  extra?: Record<string, unknown>,
): void {
  if (!globalOptions.enabled) {
    return;
  }

  const errorInfo = formatError(error, type, level, extra);
  addToQueue(errorInfo);
}

/**
 * 上报 Vue 组件错误
 * 用于 Vue 的 errorHandler
 *
 * @example
 * ```ts
 * // main.ts
 * app.config.errorHandler = (err, instance, info) => {
 *   reportVueError(err, info, instance?.$options?.name);
 * };
 * ```
 */
export function reportVueError(error: unknown, info: string, componentName?: string): void {
  if (!globalOptions.enabled) {
    return;
  }

  const errorInfo = formatError(error instanceof Error ? error : String(error), 'vue', 'error', {
    info,
    componentName,
  });
  addToQueue(errorInfo);
}

/**
 * 上报 Promise 未处理异常
 * 用于 unhandledrejection 事件
 *
 * @example
 * ```ts
 * // H5 环境
 * window.addEventListener('unhandledrejection', event => {
 *   reportPromiseError(event.reason);
 * });
 * ```
 */
export function reportPromiseError(reason: unknown): void {
  if (!globalOptions.enabled) {
    return;
  }

  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;

  const errorInfo: ErrorInfo = {
    type: 'promise',
    level: 'error',
    message: `Unhandled Promise Rejection: ${message}`,
    stack,
    timestamp: Date.now(),
    page: getCurrentPage(),
    userId: globalOptions.getUserId?.(),
    deviceInfo: getErrorDeviceInfo(),
  };

  addToQueue(errorInfo);
}

/**
 * 上报 API 错误
 *
 * @example
 * ```ts
 * // 在请求拦截器中使用
 * try {
 *   await request.get('/api/users');
 * } catch (error) {
 *   reportApiError('/api/users', 'GET', error, 500);
 * }
 * ```
 */
export function reportApiError(url: string, method: string, error: unknown, statusCode?: number): void {
  if (!globalOptions.enabled) {
    return;
  }

  const message = error instanceof Error ? error.message : String(error);

  const errorInfo = formatError(message, 'api', 'error', {
    url,
    method,
    statusCode,
  });

  addToQueue(errorInfo);
}

/**
 * 立即上报所有缓存的错误
 *
 * @example
 * ```ts
 * // 在应用退出前调用
 * onHide(() => {
 *   flushErrors();
 * });
 * ```
 */
export async function flushErrors(): Promise<void> {
  await doReport();
}

/**
 * 更新配置
 */
export function updateErrorReporterOptions(options: Partial<ErrorReporterOptions>): void {
  globalOptions = { ...globalOptions, ...options };

  // 根据 enabled 状态控制定时器
  if (globalOptions.enabled) {
    startReportTimer();
  } else {
    stopReportTimer();
  }
}

/**
 * 获取当前错误队列长度
 */
export function getErrorQueueSize(): number {
  return errorQueue.length;
}
