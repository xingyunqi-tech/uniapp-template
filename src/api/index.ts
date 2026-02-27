/**
 * ==================== API 模块统一导出 ====================
 *
 * 本文件仅导出公共 API，内部实现细节不对外暴露
 *
 * 导出内容：
 * - API 调用函数：postAuthLogin, getAuthUserInfo 等
 * - 自定义工具函数：uploadWithProgress, downloadFile 等
 * - 公共类型定义：LoginRequest, LoginResponse, UserInfo
 *
 * 使用指南：
 * - API 函数：import { postAuthLogin } from '@/api'
 * - 类型定义：import type { LoginRequest } from '@/api'
 */

/**
 * ==================== 导出策略 ====================
 *
 * 1. 优先导出 model 中的类型定义 (接口、枚举等)
 * 2. 导出各模块的 API 函数 (只导出函数,不导出 *Result 类型别名)
 * 3. 导出自定义扩展和工具函数
 *
 * 为什么这样做：
 * - model 中的接口 (如 UploadCertificateResult) 是后端返回的数据结构
 * - API 模块中的类型别名 (如 UploadCertificateResult) 是整个响应的类型
 * - 两者同名但不同,会导致 TypeScript 报错,因此只导出函数
 */

// 1. 从 model 目录导出所有类型定义 (优先导出)
export * from './generated/model';

// 2. 自动生成的 API 函数 (只导出函数,不导出类型)
export {
  createAddress,
  getAddresses,
  getDefaultAddress,
  getAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './generated/addresses/addresses';

export {
  alipayControllerCreateMobilePaymentV1,
  alipayControllerCreateWebPaymentV1,
  alipayControllerQueryOrderV1,
  alipayControllerRefundV1,
  alipayControllerCloseOrderV1,
  alipayControllerNotifyV1,
} from './generated/alipay/alipay';

export { simpleHealthCheck } from './generated/api/api';

export {
  loginWithEmail,
  registerWithEmail,
  confirmEmail,
  confirmNewEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
  refreshToken,
  logout,
  sendSmsCode,
  loginWithPhone,
  loginWithSms,
  registerWithPhone,
  resetPasswordByPhone,
  changePassword,
  loginWithWechat,
} from './generated/auth/auth';

export { getConfig, upsertConfig } from './generated/config/config';

export { getAppInfo } from './generated/default/default';

export {
  createFavorite,
  getFavorites,
  checkFavorite,
  toggleFavorite,
  deleteFavorite,
} from './generated/favorites/favorites';

export { createFeedback, getFeedbacks, getFeedback } from './generated/feedbacks/feedbacks';

export { uploadFile } from './generated/files/files';

export { healthCheck, livenessProbe, readinessProbe } from './generated/health/health';

export { prometheusControllerIndex } from './generated/metrics/metrics';

export {
  getNotifications,
  getUnreadCount,
  getNotificationSettings,
  updateNotificationSettings,
  getNotification,
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './generated/notifications/notifications';

export { createOrder, getOrders, getOrder, cancelOrder } from './generated/orders/orders';

export {
  getProvinces,
  getCities,
  getDistricts,
  getRegionByCode,
  getRegionTree,
  queryRegions,
} from './generated/regions/regions';

export {
  createShare,
  getShares,
  getShareByCode,
  getShareById,
  deleteShare,
  getShareStats,
  trackShare,
  getWeChatConfig,
  getAlipayConfig,
} from './generated/shares/shares';

export { createUser, getUsers, getUser, updateUser, deleteUser } from './generated/users/users';

export {
  wechatPayControllerCreateJsapiPaymentV1,
  wechatPayControllerCreateAppPaymentV1,
  wechatPayControllerQueryOrderV1,
  wechatPayControllerRefundV1,
  wechatPayControllerNotifyV1,
} from './generated/wechat/wechat';

// 3. 自定义工具函数 (自动扫描 custom 目录)
export * from './custom/external';
export * from './custom/override';
