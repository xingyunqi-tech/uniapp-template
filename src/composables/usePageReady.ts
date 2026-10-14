import { onLoad } from '@dcloudio/uni-app';
import { getCurrentRoute } from '@/utils/router';
import { reportPerformanceMetric } from '@/utils/performance-reporter';

export interface UsePageReadyReturn {
  /** 首屏数据就绪时调用，每个页面实例只上报一次 */
  ready: () => void;
}

/**
 * 页面首屏就绪耗时
 * 记录 onLoad 到 ready() 的耗时，以 pageReady 指标上报
 *
 * @example
 * ```typescript
 * const { ready } = usePageReady();
 *
 * onLoad(async () => {
 *   await loadData();
 *   ready();
 * });
 * ```
 */
export function usePageReady(): UsePageReadyReturn {
  let startTime = 0;
  let path = '';
  let reported = false;

  onLoad(() => {
    startTime = Date.now();
    path = getCurrentRoute().replace(/^\//, '');
  });

  function ready() {
    if (!startTime) {
      if (import.meta.env.DEV) {
        console.warn('[usePageReady] ready() 在 onLoad 之前调用或在组件中使用，本次不上报');
      }
      return;
    }
    if (reported) return;
    reported = true;
    reportPerformanceMetric({ name: 'pageReady', duration: Date.now() - startTime, path });
  }

  return { ready };
}
