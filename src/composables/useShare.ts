/**
 * 分享功能 Composable
 * 用于配置页面分享到朋友和朋友圈，并对接后端 API 追踪分享数据
 */
import { ref, computed, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { useShareStore } from '@/store';
import { getSharePlatform } from '@/utils/platform';
import { PAGES } from '@/constants';
import type { ShareTargetType, Share } from '@/api';

/** 分享参数接口 */
export interface ShareParams {
  /** 分享标题 */
  title?: string;
  /** 分享路径（默认当前页面路径） */
  path?: string;
  /** 分享图片（支持本地路径或网络图片） */
  imageUrl?: string;
  /** 分享描述（仅朋友圈有效） */
  desc?: string;
  /** 自定义查询参数 */
  query?: Record<string, string | number>;
}

/** 分享来源 */
export type ShareFrom = 'button' | 'menu';

/** 分享目标信息（分享到聊天时的目标） */
export interface ShareTarget {
  /** 目标头像 */
  avatarUrl?: string;
  /** 目标昵称 */
  nickName?: string;
}

/** useShare 配置选项 */
export interface UseShareOptions {
  /** 默认分享配置 */
  defaultShare?: ShareParams;
  /** 分享到朋友的配置（覆盖默认） */
  friendShare?: ShareParams;
  /** 分享到朋友圈的配置（覆盖默认） */
  timelineShare?: ShareParams;
  /** 是否启用分享到朋友圈（部分小程序不支持） */
  enableTimeline?: boolean;
  /** 分享前回调（可用于埋点） */
  onBeforeShare?: (from: ShareFrom, target?: ShareTarget) => void;
  /** 是否启用 API 追踪（需要登录） */
  enableTracking?: boolean;
  /** 分享目标类型（启用追踪时必填） */
  targetType?: ShareTargetType;
  /** 分享目标 ID（启用追踪时必填） */
  targetId?: string;
}

/**
 * 构建分享路径
 * @param path 基础路径
 * @param query 查询参数
 */
function buildSharePath(path?: string, query?: Record<string, string | number>): string {
  // 获取当前页面路径作为默认值
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const basePath = path || (currentPage ? `/${currentPage.route}` : PAGES.HOME);

  if (!query || Object.keys(query).length === 0) {
    return basePath;
  }

  const queryString = Object.entries(query)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return `${basePath}?${queryString}`;
}

/**
 * 分享功能
 * @param options 分享配置
 *
 * @example
 * ```ts
 * // 基础用法（无追踪）
 * useShare({
 *   defaultShare: {
 *     title: '分享标题',
 *     imageUrl: '/static/share.png'
 *   }
 * })
 *
 * // 带 API 追踪的分享
 * const { shareCode, shareUrl } = useShare({
 *   enableTracking: true,
 *   targetType: 'PRODUCT',
 *   targetId: '12345',
 *   defaultShare: {
 *     title: '推荐一个好商品',
 *     imageUrl: productImage
 *   }
 * })
 *
 * // 动态分享内容
 * const { setShareParams } = useShare()
 *
 * // 根据页面数据动态设置
 * setShareParams({
 *   title: `${productName} - 快来看看`,
 *   path: `/pages/product/detail?id=${productId}`,
 *   imageUrl: productImage
 * })
 * ```
 */
export function useShare(options: UseShareOptions = {}) {
  const {
    defaultShare = {},
    friendShare = {},
    timelineShare = {},
    enableTimeline = true,
    onBeforeShare,
    enableTracking = false,
    targetType,
    targetId,
  } = options;

  const shareStore = useShareStore();

  /** 当前分享参数（可动态修改） */
  const shareParams = ref<ShareParams>({ ...defaultShare });

  /** 分享记录（仅启用追踪时有值） */
  const shareRecord = ref<Share | null>(null);

  /** 分享码 */
  const shareCode = computed(() => shareRecord.value?.shareCode || '');

  /** 分享链接（包含分享码） */
  const shareUrl = computed(() => {
    const query = { ...shareParams.value.query };
    if (shareCode.value) {
      query.sc = shareCode.value;
    }
    return buildSharePath(shareParams.value.path, query);
  });

  /** 是否正在加载 */
  const loading = computed(() => shareStore.loading);

  /**
   * 创建分享记录（获取分享码）
   */
  async function createShareRecord(): Promise<Share | null> {
    if (!enableTracking || !targetType || !targetId) {
      return null;
    }

    try {
      const share = await shareStore.createShareRecord({
        targetType,
        targetId,
        platform: getSharePlatform(),
        title: shareParams.value.title || '',
        description: shareParams.value.desc,
        image: shareParams.value.imageUrl,
        url: shareUrl.value,
      });
      shareRecord.value = share;
      return share;
    } catch (error) {
      console.error('创建分享记录失败:', error);
      return null;
    }
  }

  /**
   * 设置分享参数（用于动态更新分享内容）
   * @param params 新的分享参数
   */
  function setShareParams(params: ShareParams) {
    shareParams.value = { ...shareParams.value, ...params };
  }

  /**
   * 重置分享参数为默认值
   */
  function resetShareParams() {
    shareParams.value = { ...defaultShare };
  }

  // 启用追踪时，组件挂载后创建分享记录
  if (enableTracking && targetType && targetId) {
    onMounted(() => {
      createShareRecord();
    });
  }

  // 分享给朋友
  onShareAppMessage((res): Page.CustomShareContent => {
    const from = res.from as ShareFrom;
    const target = res.target as ShareTarget | undefined;

    // 触发分享前回调
    onBeforeShare?.(from, target);

    // 合并分享参数
    const params = { ...shareParams.value, ...friendShare };

    // 构建分享路径（包含分享码）
    const query = { ...params.query };
    if (shareCode.value) {
      query.sc = shareCode.value;
    }

    return {
      title: params.title || '',
      path: buildSharePath(params.path, query),
      imageUrl: params.imageUrl,
    };
  });

  // 分享到朋友圈（仅微信小程序支持）
  if (enableTimeline) {
    // #ifdef MP-WEIXIN
    onShareTimeline((): Page.ShareTimelineContent => {
      // 触发分享前回调
      onBeforeShare?.('menu');

      // 合并分享参数
      const params = { ...shareParams.value, ...timelineShare };

      // 构建查询参数（包含分享码）
      const query = { ...params.query };
      if (shareCode.value) {
        query.sc = shareCode.value;
      }

      return {
        title: params.title || '',
        query: Object.entries(query)
          .map(([key, value]) => `${key}=${value}`)
          .join('&'),
        imageUrl: params.imageUrl,
      };
    });
    // #endif
  }

  return {
    /** 当前分享参数 */
    shareParams,
    /** 分享记录 */
    shareRecord,
    /** 分享码 */
    shareCode,
    /** 分享链接 */
    shareUrl,
    /** 加载状态 */
    loading,
    /** 设置分享参数 */
    setShareParams,
    /** 重置分享参数 */
    resetShareParams,
    /** 创建分享记录 */
    createShareRecord,
  };
}

/**
 * 主动触发分享（需要用户点击触发）
 * 注意：小程序不支持主动调用分享，只能通过 button 组件
 *
 * @example
 * ```vue
 * <button open-type="share">分享给朋友</button>
 * ```
 */
export function showShareMenu(): void {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  });
  // #endif

  // #ifdef MP-ALIPAY || MP-BAIDU || MP-TOUTIAO
  uni.showShareMenu({});
  // #endif
}

/**
 * 隐藏分享菜单
 */
export function hideShareMenu(): void {
  // @ts-expect-error - hideShareItems 在部分平台不是必填
  uni.hideShareMenu({});
}
