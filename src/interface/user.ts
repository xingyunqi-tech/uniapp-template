/**
 * 用户相关类型定义
 */

/**
 * 用户信息接口
 */
export interface UserInfo {
  /** 用户 ID */
  id?: number;
  /** 用户名 */
  username?: string;
  /** 头像 URL */
  avatar?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 昵称 */
  nickname?: string;
  /** 性别 (0: 未知, 1: 男, 2: 女) */
  gender?: 0 | 1 | 2;
  /** 生日 */
  birthday?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * 登录参数接口
 */
export interface LoginParams {
  /** 手机号 */
  phone: string;
  /** 密码 */
  password: string;
}

/**
 * 注册参数接口
 */
export interface RegisterParams {
  /** 手机号 */
  phone: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword?: string;
  /** 验证码 */
  code?: string;
}

/**
 * 验证码登录参数接口
 */
export interface SmsLoginParams {
  /** 手机号 */
  phone: string;
  /** 验证码 */
  code: string;
}

/**
 * 微信登录参数接口
 */
export interface WechatLoginParams {
  /** 微信登录 code */
  code: string;
  /** 加密数据（小程序获取手机号） */
  encryptedData?: string;
  /** 加密向量（小程序获取手机号） */
  iv?: string;
}

/**
 * 修改密码参数接口
 */
export interface ChangePasswordParams {
  /** 旧密码 */
  oldPassword: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmPassword: string;
}

/**
 * 重置密码参数接口
 */
export interface ResetPasswordParams {
  /** 手机号 */
  phone: string;
  /** 验证码 */
  code: string;
  /** 新密码 */
  newPassword: string;
}

/**
 * 更新用户信息参数接口
 */
export interface UpdateUserInfoParams {
  /** 昵称 */
  nickname?: string;
  /** 头像 URL */
  avatar?: string;
  /** 性别 */
  gender?: 0 | 1 | 2;
  /** 生日 */
  birthday?: string;
}
