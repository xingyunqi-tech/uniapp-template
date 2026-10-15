/**
 * 错误上报工具
 * 统一管理应用的错误收集和上报
 */
import { isRouteIntercepted } from '@/utils/router';

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

/** 全局配置 (customReport 可选) */
type GlobalOptions = Omit<Required<ErrorReporterOptions>, 'customReport'> & {
  customReport?: (errors: ErrorInfo[]) => Promise<void>;
};

let globalOptions: GlobalOptions = {
  reportUrl: '',
  enabled: import.meta.env.PROD, // 生产环境默认启用
  consoleLog: import.meta.env.DEV, // 开发环境默认打印
  sampleRate: 1, // 默认全量上报
  maxCacheSize: 50,
  reportInterval: 5000,
  getUserId: () => undefined,
  customReport: undefined, // 默认不使用自定义上报
};

/** 上报定时器 */
let reportTimer: ReturnType<typeof setInterval> | null = null;

/** 设备信息缓存 */
let cachedDeviceInfo: ErrorDeviceInfo | null = null;

/** 上报失败计数器 */
let reportFailureCount = 0;

/** 最大上报失败次数 */
const MAX_REPORT_FAILURES = 3;

// ==================== 错误去重机制 ====================

/** 错误去重窗口 (ms) */
const DEDUPE_WINDOW = 5000;

/** 最近上报的错误指纹 Map<fingerprint, timestamp> */
const recentErrors = new Map<string, number>();

/**
 * 生成错误指纹
 */
function generateErrorFingerprint(errorInfo: ErrorInfo): string {
  return `${errorInfo.type}:${errorInfo.message}:${errorInfo.page || ''}`;
}

/**
 * 检查错误是否重复 (5 秒内相同错误只上报一次)
 */
function isDuplicateError(fingerprint: string): boolean {
  const now = Date.now();
  const lastTime = recentErrors.get(fingerprint);

  if (lastTime && now - lastTime < DEDUPE_WINDOW) {
    return true;
  }

  // 记录当前错误
  recentErrors.set(fingerprint, now);

  // 清理过期的指纹
  for (const [key, time] of recentErrors.entries()) {
    if (now - time > DEDUPE_WINDOW) {
      recentErrors.delete(key);
    }
  }

  return false;
}

// ==================== 内部方法 ====================

/**
 * 获取错误上报用设备信息
 */
function getErrorDeviceInfo(): ErrorDeviceInfo {
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  try {
    const deviceInfo = uni.getDeviceInfo();
    const appBaseInfo = uni.getAppBaseInfo();
    cachedDeviceInfo = {
      platform: deviceInfo.platform || 'unknown',
      system: deviceInfo.system || 'unknown',
      appVersion: appBaseInfo.appVersion || '1.0.0',
      brand: deviceInfo.brand,
      model: deviceInfo.model,
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

  // 错误去重检查 (5 秒内相同错误只上报一次)
  const fingerprint = generateErrorFingerprint(errorInfo);
  if (isDuplicateError(fingerprint)) {
    if (globalOptions.consoleLog) {
      console.log(`[ErrorReporter] 重复错误已忽略:`, errorInfo.message);
    }
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

  // 检查是否已达到最大失败次数
  if (reportFailureCount >= MAX_REPORT_FAILURES) {
    if (globalOptions.consoleLog) {
      console.warn(`[ErrorReporter] 上报失败次数过多 (${reportFailureCount}次)，本次跳过上报，队列已清空`);
    }
    // 清空队列，防止内存泄漏
    errorQueue.length = 0;
    return;
  }

  // 取出待上报的错误
  const errors = errorQueue.splice(0, errorQueue.length);

  try {
    // 优先使用自定义上报 (必须是函数才执行)
    if (typeof globalOptions.customReport === 'function') {
      await globalOptions.customReport(errors);
      // 上报成功，重置失败计数
      reportFailureCount = 0;
      return;
    }

    // 使用默认 HTTP 上报 (需要配置 reportUrl)
    if (globalOptions.reportUrl) {
      const response = await uni.request({
        url: globalOptions.reportUrl,
        method: 'POST',
        data: { errors },
        header: {
          'Content-Type': 'application/json',
        },
      });
      if (response.statusCode >= 400) {
        throw new Error(`上报接口返回 ${response.statusCode}`);
      }
      // 上报成功，重置失败计数
      reportFailureCount = 0;
    }
  } catch (err) {
    reportFailureCount++;

    if (reportFailureCount < MAX_REPORT_FAILURES) {
      // 上报失败但未达到最大次数，将错误放回队列
      errorQueue.unshift(...errors);
      console.error(`[ErrorReporter] 上报失败 (${reportFailureCount}/${MAX_REPORT_FAILURES}):`, err);
    } else {
      // 达到最大失败次数，丢弃错误
      console.error(`[ErrorReporter] 上报失败次数达到上限 (${MAX_REPORT_FAILURES})，错误已丢弃:`, err);
    }
  }
}

/**
 * 重置上报失败计数 (用于网络恢复后)
 */
export function resetReportFailureCount(): void {
  reportFailureCount = 0;
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
 * import { setupErrorReporter } from '@/utils/error-reporter';
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

// ==================== 全局错误监听 ====================

/** 是否已设置全局监听 */
let isGlobalListenersSetup = false;

/**
 * 设置 H5 环境的全局错误监听
 * - window.onerror: 捕获同步 JS 错误
 * - unhandledrejection: 捕获未处理的 Promise 拒绝
 * - error (捕获阶段): 捕获资源加载错误
 */
function setupH5GlobalListeners(): void {
  // #ifdef H5
  // 全局 JS 错误监听
  window.onerror = (message, source, lineno, colno, error) => {
    if (globalOptions.consoleLog) {
      console.error('[H5 GlobalError]', { message, source, lineno, colno, error });
    }
    reportError(error || String(message), 'js', 'error', {
      source: 'window.onerror',
      file: source,
      line: lineno,
      column: colno,
    });
    // 返回 true 阻止默认错误处理
    return true;
  };

  // 未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (isRouteIntercepted(event.reason)) {
      event.preventDefault();
      return;
    }
    if (globalOptions.consoleLog) {
      console.error('[H5 UnhandledRejection]', event.reason);
    }
    reportPromiseError(event.reason);
    // 阻止默认处理（控制台报错）
    event.preventDefault();
  });

  // 资源加载错误（图片、脚本等）
  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      const target = event.target as HTMLElement;
      // 判断是否是资源加载错误
      if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        const resourceUrl = (target as HTMLImageElement).src || (target as HTMLLinkElement).href;
        if (globalOptions.consoleLog) {
          console.error('[H5 ResourceError]', resourceUrl);
        }
        reportError(`资源加载失败: ${resourceUrl}`, 'resource', 'error', {
          source: 'window.error',
          tagName: target.tagName,
          resourceUrl,
        });
      }
    },
    true, // 使用捕获阶段
  );

  if (globalOptions.consoleLog) {
    console.log('[ErrorReporter] H5 全局错误监听已启用');
  }
  // #endif
}

/**
 * 创建 Uni-app 生命周期错误处理器
 * 用于 onError 和 onUnhandledRejection
 */
export interface GlobalErrorHandlers {
  /** onError 处理函数 */
  onError: (error: string) => void;
  /** onUnhandledRejection 处理函数 */
  onUnhandledRejection: (event: { reason: unknown; promise: Promise<unknown> }) => void;
  /** onHide 处理函数 (应用切后台时立即上报) */
  onHide: () => void;
}

/**
 * 获取全局错误处理器
 * 返回用于 Uni-app 生命周期钩子的处理函数
 *
 * @example
 * ```ts
 * // App.vue
 * import { onError, onUnhandledRejection, onHide } from '@dcloudio/uni-app';
 * import { getGlobalErrorHandlers } from '@/utils/error-reporter';
 *
 * const handlers = getGlobalErrorHandlers();
 * onError(handlers.onError);
 * onUnhandledRejection(handlers.onUnhandledRejection);
 * onHide(handlers.onHide);
 * ```
 */
export function getGlobalErrorHandlers(): GlobalErrorHandlers {
  return {
    onError: (error: string) => {
      if (globalOptions.consoleLog) {
        console.error('[App Error]', error);
      }
      reportError(error, 'js', 'error', { source: 'onError' });
    },
    onUnhandledRejection: (event: { reason: unknown; promise: Promise<unknown> }) => {
      if (isRouteIntercepted(event.reason)) return;
      if (globalOptions.consoleLog) {
        console.error('[Unhandled Promise Rejection]', event.reason);
      }
      reportPromiseError(event.reason);
    },
    onHide: () => {
      // 应用切到后台时，立即上报缓存的错误
      flushErrors();
    },
  };
}

/**
 * 设置全局错误监听
 * 自动设置 H5 环境的 window 级别错误监听
 * 注意: Uni-app 的 onError/onUnhandledRejection 需要在 App.vue 中手动调用
 *
 * @example
 * ```ts
 * // 在 setupErrorReporter 之后调用
 * setupGlobalErrorListeners();
 * ```
 */
export function setupGlobalErrorListeners(): void {
  if (isGlobalListenersSetup) {
    console.warn('[ErrorReporter] 全局监听已设置，请勿重复调用');
    return;
  }

  isGlobalListenersSetup = true;

  // 设置 H5 特有的全局监听
  setupH5GlobalListeners();
}

/**
 * 一站式初始化错误上报系统
 * 包含：配置初始化 + 全局监听设置
 *
 * @example
 * ```ts
 * // App.vue - 简化用法
 * import { onError, onUnhandledRejection, onHide } from '@dcloudio/uni-app';
 * import { initErrorReporter } from '@/utils/error-reporter';
 *
 * onLaunch(() => {
 *   const handlers = initErrorReporter({
 *     reportUrl: 'https://api.example.com/error/report',
 *     getUserId: () => useUserStore().userInfo?.id,
 *   });
 *
 *   // 绑定 Uni-app 生命周期 (必须在 App.vue 中调用)
 *   onError(handlers.onError);
 *   onUnhandledRejection(handlers.onUnhandledRejection);
 *   onHide(handlers.onHide);
 * });
 * ```
 */
export function initErrorReporter(options: ErrorReporterOptions = {}): GlobalErrorHandlers {
  // 初始化配置
  setupErrorReporter(options);

  // 设置全局监听 (H5)
  setupGlobalErrorListeners();

  // 返回 Uni-app 生命周期处理器
  return getGlobalErrorHandlers();
}
