/**
 * 分享追踪 Composable
 * 用于目标页面检测和追踪分享来源
 */
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useShareStore } from '@/store';
import { getSharePlatform } from '@/utils/platform';
import type { Share, TrackShareDtoAction } from '@/api';

/** 分享追踪配置选项 */
export interface UseShareTrackingOptions {
  /** 是否自动追踪 VIEW 行为（默认 true） */
  autoTrackView?: boolean;
  /** 追踪成功回调 */
  onTrackSuccess?: (share: Share) => void;
  /** 追踪失败回调 */
  onTrackError?: (error: unknown) => void;
}

/** 分享追踪返回值 */
export interface UseShareTrackingReturn {
  /** 分享码（从 URL 参数获取） */
  shareCode: ReturnType<typeof ref<string>>;
  /** 分享记录 */
  shareRecord: ReturnType<typeof ref<Share | null>>;
  /** 是否来自分享 */
  isFromShare: ReturnType<typeof ref<boolean>>;
  /** 是否正在加载 */
  loading: ReturnType<typeof ref<boolean>>;
  /** 手动追踪行为 */
  trackAction: (action: TrackShareDtoAction, metadata?: Record<string, unknown>) => Promise<void>;
  /** 追踪点击行为 */
  trackClick: (metadata?: Record<string, unknown>) => Promise<void>;
}

/**
 * 分享追踪
 * 在目标页面使用，自动检测和追踪分享来源
 *
 * @param options 配置选项
 *
 * @example
 * ```ts
 * // 商品详情页使用
 * const { isFromShare, shareRecord, trackClick } = useShareTracking()
 *
 * // 用户点击购买时追踪点击，转化由服务端在下单时记录
 * async function handleBuy() {
 *   await trackClick({ action: 'buy' })
 * }
 * ```
 *
 * @example
 * ```ts
 * // 自定义追踪时机
 * const { shareCode, trackAction } = useShareTracking({
 *   autoTrackView: false, // 禁用自动追踪
 *   onTrackSuccess: (share) => {
 *     console.log('来自分享:', share.title)
 *   }
 * })
 *
 * // 手动追踪
 * onMounted(() => {
 *   if (shareCode.value) {
 *     trackAction('VIEW', { customData: 'xxx' })
 *   }
 * })
 * ```
 */
export function useShareTracking(options: UseShareTrackingOptions = {}): UseShareTrackingReturn {
  const { autoTrackView = true, onTrackSuccess, onTrackError } = options;

  const shareStore = useShareStore();

  /** 分享码 */
  const shareCode = ref('');
  /** 分享记录 */
  const shareRecord = ref<Share | null>(null);
  /** 是否来自分享 */
  const isFromShare = ref(false);
  /** 加载状态 */
  const loading = ref(false);

  /**
   * 追踪分享行为
   */
  async function trackAction(action: TrackShareDtoAction, metadata?: Record<string, unknown>): Promise<void> {
    if (!shareRecord.value) {
      return;
    }

    try {
      await shareStore.trackShareAction(shareRecord.value.shareCode, action, {
        ...metadata,
        platform: getSharePlatform(),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn(`分享追踪失败 [${action}]:`, error);
    }
  }

  /**
   * 追踪点击行为
   */
  async function trackClick(metadata?: Record<string, unknown>): Promise<void> {
    await trackAction('CLICK', metadata);
  }

  /**
   * 处理分享来源
   */
  async function handleShareSource(code: string): Promise<void> {
    if (!code) {
      return;
    }

    shareCode.value = code;
    isFromShare.value = true;
    loading.value = true;

    try {
      // 获取分享信息
      const share = await shareStore.fetchShareByCode(code);
      if (share) {
        shareRecord.value = share;

        // 自动追踪 VIEW
        if (autoTrackView) {
          await trackAction('VIEW');
        }

        onTrackSuccess?.(share);
      }
    } catch (error) {
      console.error('处理分享来源失败:', error);
      onTrackError?.(error);
    } finally {
      loading.value = false;
    }
  }

  // 页面加载时检测分享参数
  onLoad(query => {
    // 支持 sc 或 shareCode 参数
    const code = query?.sc || query?.shareCode || '';
    if (code) {
      handleShareSource(code);
    }
  });

  return {
    shareCode,
    shareRecord,
    isFromShare,
    loading,
    trackAction,
    trackClick,
  };
}

/**
 * 获取当前页面的分享码
 * 用于非 setup 环境
 */
export function getShareCodeFromUrl(): string {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  if (!currentPage) {
    return '';
  }

  // @ts-expect-error - $page 是运行时属性
  const options = currentPage.options || currentPage.$page?.options || {};
  return options.sc || options.shareCode || '';
}
