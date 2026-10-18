import { ROLE } from './permission';

/**
 * 页面路径常量
 */
export const PAGES = {
  // ========== 主包页面 ==========
  /** 首页 (TabBar) */
  HOME: '/pages/index/index',
  /** 题库 (TabBar) */
  BANK: '/pages/bank/index',
  /** AI 助教 (TabBar) */
  AI: '/pages/ai/index',
  /** 我的 (TabBar) */
  MINE: '/pages/mine/index',
  /** 登录 */
  LOGIN: '/pages/login/index',
  /** 注册 */
  REGISTER: '/pages/register/index',
  /** 忘记密码 */
  FORGOT_PASSWORD: '/pages/forgot-password/index',
  /** 404 错误页 */
  ERROR: '/pages/error/index',
  /** 协议详情 */
  AGREEMENT: '/pages/agreement/index',
  /** 403 无权限页 */
  FORBIDDEN: '/pages/error/index',

  // ========== order 分包 ==========
  /** 我的订单 */
  ORDER: '/pages-sub/order/list/index',
  /** 订单详情 */
  ORDER_DETAIL: '/pages-sub/order/detail/index',
  /** 支付结果 */
  PAYMENT_RESULT: '/pages-sub/order/payment-result/index',

  // ========== user 分包 ==========
  /** 地址管理 */
  ADDRESS: '/pages-sub/user/address/index',
  /** 编辑地址 */
  ADDRESS_EDIT: '/pages-sub/user/address-edit/index',
  /** 设置 */
  SETTINGS: '/pages-sub/user/settings/index',
  /** 编辑资料 */
  PROFILE: '/pages-sub/user/profile/index',
  /** 修改密码 */
  PASSWORD: '/pages-sub/user/password/index',
  /** 我的收藏 */
  FAVORITE: '/pages-sub/user/favorite/index',
  /** 消息通知 */
  NOTIFICATIONS: '/pages-sub/user/notifications/index',
  /** 通知设置 */
  NOTIFICATION_SETTINGS: '/pages-sub/user/notification-settings/index',

  // ========== other 分包 ==========
  /** 意见反馈 */
  FEEDBACK: '/pages-sub/other/feedback/index',
  /** 关于我们 */
  ABOUT: '/pages-sub/other/about/index',
  /** 联系客服 */
  CONTACT: '/pages-sub/other/contact/index',
  /** Webview 容器 */
  WEBVIEW: '/pages-sub/other/webview/index',
  // ========== exam 分包 ==========
  /** 选择考试 */
  EXAM_SELECT: '/pages-sub/exam/select/index',
  /** 每日一练试做 */
  EXAM_TRIAL: '/pages-sub/exam/trial/index',
  /** 答题 */
  EXAM_ANSWER: '/pages-sub/exam/answer/index',
  /** 成绩报告 */
  EXAM_REPORT: '/pages-sub/exam/report/index',
  /** 试卷详情 */
  EXAM_PAPER: '/pages-sub/exam/paper/index',
  /** 按规则组卷 */
  EXAM_PAPER_RULES: '/pages-sub/exam/paper-rules/index',
  /** 练习历史 */
  EXAM_HISTORY: '/pages-sub/exam/history/index',

  // ========== study 分包 ==========
  /** 错题本 */
  STUDY_WRONG_BOOK: '/pages-sub/study/wrong-book/index',
  /** 题目详情（错题本、收藏、笔记共用） */
  STUDY_QUESTION: '/pages-sub/study/question/index',
  /** 收藏题 */
  STUDY_FAVORITES: '/pages-sub/study/favorites/index',
  /** 我的笔记 */
  STUDY_NOTES: '/pages-sub/study/notes/index',
  /** 打卡日历 */
  STUDY_CHECKIN: '/pages-sub/study/checkin/index',

  /** 组件演示页，仅 development 模式下存在 */
  COMPONENT_DEMO: '/pages-sub/other/component-demo/index',
} as const;

/**
 * 导航栏文本颜色枚举
 * theme.json 中使用 "black"/"white" (用于 pages.json 配置)
 * uni.setNavigationBarColor 需要十六进制颜色值
 */
export enum NavTextColor {
  black = '#000000',
  white = '#ffffff',
}

/**
 * TabBar 页面列表
 */
export const TAB_BAR_PAGES = [PAGES.HOME, PAGES.BANK, PAGES.AI, PAGES.MINE] as const;

/**
 * TabBar 配置项
 * 用于动态切换 TabBar 图标和文本
 */
export const TAB_BAR_CONFIG = [
  {
    index: 0,
    text: '首页',
    iconKey: 'iconHome',
    iconActiveKey: 'iconHomeActive',
  },
  {
    index: 1,
    text: '题库',
    iconKey: 'iconBank',
    iconActiveKey: 'iconBankActive',
  },
  {
    index: 2,
    text: 'AI 助教',
    iconKey: 'iconAi',
    iconActiveKey: 'iconAiActive',
  },
  {
    index: 3,
    text: '我的',
    iconKey: 'iconMine',
    iconActiveKey: 'iconMineActive',
  },
] as const;

/**
 * TabBar 未读消息角标配置
 */
export const TAB_BAR_BADGE: {
  /** 是否开启 */
  enabled: boolean;
  /** 显示角标的 TabBar 索引 */
  index: number;
  /** count 显示未读数，dot 只显示红点 */
  type: 'count' | 'dot';
} = {
  enabled: true,
  index: 3,
  type: 'count',
};

/**
 * 白名单页面（无需登录）
 */
export const WHITE_LIST = [
  PAGES.LOGIN,
  PAGES.REGISTER,
  PAGES.FORGOT_PASSWORD,
  PAGES.HOME,
  PAGES.BANK,
  PAGES.AI,
  PAGES.MINE,
  PAGES.EXAM_SELECT,
  PAGES.EXAM_TRIAL,
  PAGES.EXAM_PAPER,
  PAGES.ERROR,
  PAGES.AGREEMENT,
  PAGES.ABOUT,
  PAGES.CONTACT,
  PAGES.SETTINGS,
  PAGES.WEBVIEW,
] as const;

/**
 * 页面权限配置
 * 配置需要特定角色才能访问的页面
 *
 * @example
 * ```ts
 * // 配置管理员专属页面
 * PAGE_ROLES['/pages-sub/admin/dashboard/index'] = [ROLE.ADMIN];
 * ```
 */
export const PAGE_ROLES: Record<string, ROLE[]> = {
  // 示例：管理员专属页面
  // '/pages-sub/admin/dashboard/index': [ROLE.ADMIN],
};
