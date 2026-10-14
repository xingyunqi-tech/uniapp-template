/**
 * 性能指标采集
 * 微信小程序通过 wx.getPerformance 采集启动、路由、首次渲染耗时，上报方式由 report 回调决定
 */

// ==================== 类型定义 ====================

/**
 * 性能指标名称
 * - appLaunch: 小程序启动耗时
 * - route: 路由处理耗时
 * - firstRender: 页面首次渲染耗时
 * - pageReady: 页面 onLoad 到首屏数据就绪的耗时 (usePageReady 上报)
 */
export type PerformanceMetricName = 'appLaunch' | 'route' | 'firstRender' | 'pageReady';

/** 性能指标 */
export interface PerformanceMetric {
  /** 指标名称 */
  name: PerformanceMetricName;
  /** 耗时 (ms，取整) */
  duration: number;
  /** 页面路径，不带开头的 / (appLaunch 为启动页) */
  path: string;
}

/** 性能采集配置 */
export interface PerformanceReporterOptions {
  /** 是否启用，默认 false */
  enabled?: boolean;
  /** 采样率 (0-1)，按启动会话采样，默认 1 */
  sampleRate?: number;
  /** 上报函数，未传入时不采集 */
  report?: (metric: PerformanceMetric) => void;
}

/** wx.getPerformance 返回的性能条目 (仅列出用到的字段) */
interface WxPerformanceEntry {
  name: string;
  duration: number;
  path?: string;
}

// ==================== 内部状态 ====================

const OBSERVED_METRICS: PerformanceMetricName[] = ['appLaunch', 'route', 'firstRender'];

let globalOptions: PerformanceReporterOptions & Required<Pick<PerformanceReporterOptions, 'enabled' | 'sampleRate'>> = {
  enabled: false,
  sampleRate: 1,
};

let sampled = false;
let isObserving = false;

// ==================== 公共 API ====================

/**
 * 初始化性能采集，在 App onLaunch 中调用
 *
 * @example
 * ```typescript
 * initPerformanceReporter({
 *   enabled: import.meta.env.PROD,
 *   sampleRate: 0.1,
 *   report: metric => wx.reportPerformance(METRIC_IDS[metric.name], metric.duration, metric.path),
 * });
 * ```
 */
export function initPerformanceReporter(options: PerformanceReporterOptions = {}): void {
  globalOptions = { ...globalOptions, ...options };
  sampled = Math.random() < globalOptions.sampleRate;

  if (!isActive() || isObserving) return;

  // #ifdef MP-WEIXIN
  observeWxPerformance();
  // #endif
}

/**
 * 上报一条性能指标，未启用、未命中采样或未传入 report 时忽略
 */
export function reportPerformanceMetric(metric: PerformanceMetric): void {
  if (!isActive()) return;

  try {
    globalOptions.report?.({ ...metric, duration: Math.round(metric.duration) });
  } catch (error) {
    console.warn('[PerformanceReporter] 上报失败:', error);
  }
}

// ==================== 内部函数 ====================

function isActive(): boolean {
  return globalOptions.enabled && sampled && typeof globalOptions.report === 'function';
}

function observeWxPerformance(): void {
  if (typeof wx === 'undefined' || typeof wx.getPerformance !== 'function') return;

  const performance = wx.getPerformance();
  const observer = performance.createObserver((entryList: { getEntries: () => WxPerformanceEntry[] }) => {
    for (const entry of entryList.getEntries()) {
      if (!OBSERVED_METRICS.includes(entry.name as PerformanceMetricName)) continue;
      reportPerformanceMetric({
        name: entry.name as PerformanceMetricName,
        duration: entry.duration,
        path: entry.path ?? '',
      });
    }
  });
  observer.observe({ entryTypes: ['navigation', 'render'] });
  isObserving = true;
}
