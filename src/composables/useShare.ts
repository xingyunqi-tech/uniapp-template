/**
 * 分享功能 Composable
 * 用于配置页面分享到朋友和朋友圈
 */
import { ref } from 'vue';
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';

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
  const basePath = path || (currentPage ? `/${currentPage.route}` : '/pages/index/index');

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
 * // 基础用法
 * useShare({
 *   defaultShare: {
 *     title: '分享标题',
 *     imageUrl: '/static/share.png'
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
  const { defaultShare = {}, friendShare = {}, timelineShare = {}, enableTimeline = true, onBeforeShare } = options;

  /** 当前分享参数（可动态修改） */
  const shareParams = ref<ShareParams>({ ...defaultShare });

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

  // 分享给朋友
  onShareAppMessage((res): UniApp.CustomShareContent => {
    const from = res.from as ShareFrom;
    const target = res.target as ShareTarget | undefined;

    // 触发分享前回调
    onBeforeShare?.(from, target);

    // 合并分享参数
    const params = { ...shareParams.value, ...friendShare };

    return {
      title: params.title || '',
      path: buildSharePath(params.path, params.query),
      imageUrl: params.imageUrl,
    };
  });

  // 分享到朋友圈（仅微信小程序支持）
  if (enableTimeline) {
    // #ifdef MP-WEIXIN
    onShareTimeline((): UniApp.CustomShareTimelineContent => {
      // 触发分享前回调
      onBeforeShare?.('menu');

      // 合并分享参数
      const params = { ...shareParams.value, ...timelineShare };

      return {
        title: params.title || '',
        query: params.query
          ? Object.entries(params.query)
              .map(([key, value]) => `${key}=${value}`)
              .join('&')
          : '',
        imageUrl: params.imageUrl,
      };
    });
    // #endif
  }

  return {
    /** 当前分享参数 */
    shareParams,
    /** 设置分享参数 */
    setShareParams,
    /** 重置分享参数 */
    resetShareParams,
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
  uni.hideShareMenu({});
}
