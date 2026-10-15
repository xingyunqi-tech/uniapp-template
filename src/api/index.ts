/**
 * ==================== API 模块统一导出 ====================
 *
 * ⚠️ 本文件由 `pnpm api:gen` 的 afterAllFilesWrite 钩子（scripts/api/update-api-exports.ts）
 * 自动生成，请勿手写：下次生成会整份覆盖。要调整导出，改那个脚本。
 *
 * 使用指南：
 * - API 函数：import { getCurrentUser } from '@/api'
 * - 类型定义：import type { User } from '@/api'
 */

/**
 * ==================== 导出策略 ====================
 *
 * 0. 先 star 导出 core（http 实例、mutator 与 alova hooks），绕过 Orval 直接发请求时从 @/api 取
 * 1. 再导出 model 里的类型定义（接口、枚举等）
 * 2. 再显式导出各 generated 模块的 API 函数（只导函数，不导 *Result 类型别名）
 * 3. 最后 star 导出 custom/ 里的自定义扩展与工具函数
 * 4. 被 custom/ 覆盖的 generated 函数不在第 2 步导出
 */

// 0. HTTP 客户端与请求工具
export * from './core';

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
  alipayControllerCreateMiniPaymentV1,
  alipayControllerCreateWebPaymentV1,
  alipayControllerQueryOrderV1,
  alipayControllerRefundV1,
  alipayControllerCloseOrderV1,
  alipayControllerNotifyV1,
} from './generated/alipay/alipay';

export { simpleHealthCheck } from './generated/api/api';

// 以下函数由 custom/ 覆盖，故不从 generated 导出：refreshToken, logout
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
  sendSmsCode,
  loginWithPhone,
  loginWithSms,
  registerWithPhone,
  resetPasswordByPhone,
  changePassword,
  loginWithWechat,
  loginWithWechatPhone,
  loginWithAlipay,
} from './generated/auth/auth';

export { getConfig, upsertConfig, getConfigAsAdmin } from './generated/config/config';

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
