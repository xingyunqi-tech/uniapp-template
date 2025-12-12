/**
 * 表单相关常量
 */

/**
 * 短信验证码长度
 */
export const SMS_CODE_LENGTH = 6;

/**
 * 短信验证码倒计时秒数
 */
export const SMS_COUNTDOWN_SECONDS = 60;

/**
 * 密码最小长度
 */
export const PASSWORD_MIN_LENGTH = 6;

/**
 * 密码最大长度
 */
export const PASSWORD_MAX_LENGTH = 20;

/**
 * 密码规则配置
 */
export const PASSWORD_RULES = {
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: PASSWORD_MAX_LENGTH,
  requireLetter: true,
  requireNumber: true,
  requireSpecialChar: false,
} as const;

/**
 * 手机号长度
 */
export const PHONE_LENGTH = 11;

/**
 * 昵称最大长度
 */
export const NICKNAME_MAX_LENGTH = 20;

/**
 * 反馈类型
 */
export const FEEDBACK_TYPES = [
  { label: '功能建议', value: 'suggestion' },
  { label: 'BUG反馈', value: 'bug' },
  { label: '投诉建议', value: 'complaint' },
  { label: '其他', value: 'other' },
] as const;

/**
 * 反馈内容最小长度
 */
export const FEEDBACK_CONTENT_MIN_LENGTH = 10;

/**
 * 反馈内容最大长度
 */
export const FEEDBACK_CONTENT_MAX_LENGTH = 500;

/**
 * 反馈图片最大数量
 */
export const FEEDBACK_IMAGE_MAX_COUNT = 3;

/**
 * 性别选项
 */
export const GENDER_OPTIONS = [
  { label: '男', value: 1 },
  { label: '女', value: 2 },
] as const;

/**
 * 延迟时间配置
 */
export const DELAY_TIMES = {
  /** 短延迟 - Toast 后快速操作 */
  SHORT: 800,
  /** 中等延迟 - 标准提示后操作 */
  MEDIUM: 1000,
  /** 长延迟 - 成功后导航跳转 */
  LONG: 1500,
} as const;

/**
 * 客服信息
 */
export const CUSTOMER_SERVICE = {
  /** 客服电话 */
  PHONE: '400-123-4567',
  /** 服务时间 */
  SERVICE_TIME: '工作日 9:00-18:00',
  /** 在线时间 */
  ONLINE_TIME: '9:00-18:00',
} as const;
