import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  UserInfo,
  LoginParams,
  RegisterParams,
  SmsLoginParams,
  WechatLoginParams,
  WechatPhoneLoginParams,
} from '@/interface';
import { ADMIN_ROLE_ID, ROLE, ROLE_LEVEL } from '@/constants/permission';
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from '@/utils/auth-token';
import { encryptPassword } from '@/utils/crypto';
import { useAddressStore } from './address';
import { useFavoriteStore } from './favorite';
import { useFeedbackStore } from './feedback';
import { useNotificationStore } from './notification';
import { useOrderStore } from './order';
import { useShareStore } from './share';
import {
  loginWithPhone,
  loginWithSms,
  loginWithWechat,
  loginWithWechatPhone,
  loginWithAlipay,
  registerWithPhone,
  sendSmsCode as apiSendSmsCode,
  getCurrentUser,
  updateCurrentUser,
  changePassword as apiChangePassword,
  resetPasswordByPhone as apiResetPasswordByPhone,
  logout as apiLogout,
  deleteCurrentUser,
  refreshToken as apiRefreshToken,
  isTransientError,
  type User,
  type AuthUpdateDto,
  type AuthDeleteAccountDto,
  AuthSendCodeDtoType,
  AuthWechatLoginDtoType,
} from '@/api';

// 重新导出类型，保持向后兼容
export type { UserInfo, LoginParams, RegisterParams, SmsLoginParams, WechatLoginParams, WechatPhoneLoginParams };

/**
 * 将后端 User 类型转换为前端 UserInfo 类型
 */
function mapUserToUserInfo(user: User): UserInfo {
  return {
    id: user.id ? Number(user.id) : undefined, // User.id 是 string，UserInfo.id 是 number
    username: user.nickname || user.firstName || user.phone,
    avatar: user.photo?.path || '',
    phone: user.phone,
    email: user.email,
    nickname: user.nickname,
    gender: user.gender as 0 | 1 | 2,
    birthday: user.birthday,
    role: user.role?.id === ADMIN_ROLE_ID ? ROLE.ADMIN : ROLE.USER,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * 用户状态管理 Store
 * 管理用户登录状态、token、用户信息等
 */
export const useUserStore = defineStore(
  'user',
  () => {
    // ==================== State ====================
    // 登录凭证以本地存储为准（见 utils/auth-token），以下为响应式副本
    const storedTokens = getAuthTokens();
    /** 用户 Token */
    const token = ref<string>(storedTokens.token);
    /** Refresh Token */
    const refreshTokenValue = ref<string>(storedTokens.refreshToken);
    /** Token 过期时间戳 (毫秒) */
    const tokenExpires = ref<number>(storedTokens.tokenExpires);
    /** 用户信息 - 由 Pinia persist 管理 */
    const userInfo = ref<UserInfo | null>(null);

    // ==================== Getters ====================
    /** 是否已登录 */
    const isLoggedIn = computed(() => !!token.value);

    /** 当前用户角色 */
    const role = computed(() => userInfo.value?.role || ROLE.GUEST);

    /** 是否为管理员 */
    const isAdmin = computed(() => role.value === ROLE.ADMIN);

    /** 当前角色层级 */
    const roleLevel = computed(() => ROLE_LEVEL[role.value] || 0);

    // ==================== Actions ====================
    /**
     * 设置 Token
     * @param tokenValue Token 字符串
     */
    function setToken(tokenValue: string) {
      token.value = tokenValue;
      saveAuthTokens({ token: tokenValue });
    }

    /**
     * 设置 Refresh Token
     */
    function setRefreshToken(value: string, expires?: number) {
      refreshTokenValue.value = value;
      if (!value) {
        tokenExpires.value = 0;
        saveAuthTokens({ refreshToken: '', tokenExpires: 0 });
        return;
      }
      if (expires) tokenExpires.value = expires;
      saveAuthTokens(expires ? { refreshToken: value, tokenExpires: expires } : { refreshToken: value });
    }

    /**
     * 设置用户信息
     * @param info 用户信息
     */
    function setUserInfo(info: UserInfo | null) {
      userInfo.value = info;
    }

    /**
     * 处理登录成功响应
     */
    function handleLoginResponse(response: { token: string; refreshToken: string; tokenExpires: number; user: User }) {
      setToken(response.token);
      setRefreshToken(response.refreshToken, response.tokenExpires);
      setUserInfo(mapUserToUserInfo(response.user));
    }

    /**
     * 登录（手机号+密码）
     * @param params 登录参数
     */
    async function login(params: LoginParams): Promise<string> {
      const response = await loginWithPhone({
        phone: params.phone,
        password: params.password,
      });
      handleLoginResponse(response);
      return response.token;
    }

    /**
     * 注册（手机号+密码）
     * @param params 注册参数
     */
    async function register(params: RegisterParams): Promise<string> {
      const response = await registerWithPhone({
        phone: params.phone,
        password: params.password,
        code: params.code,
      });
      handleLoginResponse(response);
      return response.token;
    }

    /**
     * 验证码登录
     * @param params 验证码登录参数
     */
    async function smsLogin(params: SmsLoginParams): Promise<string> {
      const response = await loginWithSms({
        phone: params.phone,
        code: params.code,
      });
      handleLoginResponse(response);
      return response.token;
    }

    /**
     * 发送验证码
     * @param phone 手机号
     * @param type 验证码类型
     */
    async function sendSmsCode(phone: string, type: AuthSendCodeDtoType = AuthSendCodeDtoType.login): Promise<void> {
      await apiSendSmsCode({ phone, type });
    }

    /**
     * 微信登录
     * @param params 微信登录参数
     */
    async function wechatLogin(params: WechatLoginParams): Promise<string> {
      const response = await loginWithWechat({
        code: params.code,
        type: AuthWechatLoginDtoType.mini_app, // 小程序登录
      });
      handleLoginResponse(response);
      return response.token;
    }

    /**
     * 微信手机号快捷登录（小程序）
     * @param params 微信登录 code 与手机号授权 code
     */
    async function wechatPhoneLogin(params: WechatPhoneLoginParams): Promise<string> {
      const response = await loginWithWechatPhone({
        loginCode: params.loginCode,
        phoneCode: params.phoneCode,
      });
      handleLoginResponse(response);
      return response.token;
    }

    /**
     * 支付宝登录（小程序）
     * @param authCode my.getAuthCode 返回的授权码
     */
    async function alipayLogin(authCode: string): Promise<string> {
      const response = await loginWithAlipay({ authCode });
      handleLoginResponse(response);
      return response.token;
    }

    /**
     * 获取用户信息
     */
    async function getUserInfo(): Promise<UserInfo | null> {
      if (!token.value) {
        return null;
      }

      const user = await getCurrentUser();
      const info = mapUserToUserInfo(user);
      setUserInfo(info);
      return info;
    }

    /**
     * 更新用户信息
     */
    async function updateUserInfo(params: {
      nickname?: string;
      firstName?: string;
      lastName?: string;
      photo?: { id: string } | null;
      gender?: number;
      birthday?: string;
    }): Promise<UserInfo | null> {
      // photo 传 null 时后端清除头像，OpenAPI 文档未标注 nullable
      const user = await updateCurrentUser(params as AuthUpdateDto);
      const info = mapUserToUserInfo(user);
      setUserInfo(info);
      return info;
    }

    /**
     * 修改密码
     */
    async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
      await apiChangePassword({
        oldPassword: encryptPassword(oldPassword),
        newPassword: encryptPassword(newPassword),
      });
    }

    /**
     * 通过手机验证码重置密码
     */
    async function resetPasswordByPhone(phone: string, code: string, newPassword: string): Promise<void> {
      await apiResetPasswordByPhone({
        phone,
        code,
        password: encryptPassword(newPassword),
      });
    }

    /**
     * 刷新 Token：凭证失效返回 null（登录态由请求拦截器统一清理），网络错误或服务端 5xx 时抛出
     */
    async function refreshToken(): Promise<string | null> {
      // H5 多标签页共享存储，其他标签页可能已轮换凭证，以存储中的值为准
      const stored = getAuthTokens();
      if (stored.refreshToken !== refreshTokenValue.value) {
        token.value = stored.token;
        refreshTokenValue.value = stored.refreshToken;
        tokenExpires.value = stored.tokenExpires;
      }

      if (!refreshTokenValue.value) {
        return null;
      }

      const usedRefreshToken = refreshTokenValue.value;
      let response: Awaited<ReturnType<typeof apiRefreshToken>>;
      try {
        response = await apiRefreshToken(usedRefreshToken);
      } catch (error) {
        if (refreshTokenValue.value !== usedRefreshToken) return token.value || null;
        if (isTransientError(error)) throw error;
        return null;
      }

      // 刷新期间已登出或重新登录：丢弃本次结果，沿用当前登录态
      if (refreshTokenValue.value !== usedRefreshToken) {
        return token.value || null;
      }

      setToken(response.token);
      setRefreshToken(response.refreshToken, response.tokenExpires);
      return response.token;
    }

    /**
     * 清除本地登录态（不调用登出接口），包括其他 Store 的用户相关数据
     */
    function resetUserState(): void {
      // 清除用户状态
      token.value = '';
      refreshTokenValue.value = '';
      tokenExpires.value = 0;
      userInfo.value = null;

      clearAuthTokens();

      // 重置其他 Store 的用户相关数据
      useAddressStore().reset();
      useOrderStore().reset();
      useFavoriteStore().reset();
      useNotificationStore().reset();
      useShareStore().clearState();
      useFeedbackStore().reset();
    }

    /**
     * 退出登录：调用登出接口后清除本地登录态，接口失败也会清除
     */
    async function logout(): Promise<void> {
      try {
        if (token.value) {
          await apiLogout();
        }
      } catch {
        // 即使接口调用失败，也要清除本地状态
      } finally {
        resetUserState();
      }
    }

    /**
     * 注销账号：有密码的用户传当前密码（MD5），没有密码的用户传 verify_identity 短信验证码；接口成功后清除本地登录态
     */
    async function deleteAccount(credentials: AuthDeleteAccountDto): Promise<void> {
      await deleteCurrentUser(credentials);
      resetUserState();
    }

    // ==================== 权限检查方法 ====================
    /**
     * 检查是否拥有指定角色
     * @param requiredRole 要求的角色
     */
    function hasRole(requiredRole: ROLE): boolean {
      return role.value === requiredRole;
    }

    /**
     * 检查是否拥有指定角色或更高权限
     * @param requiredRole 要求的最低角色
     */
    function hasRoleOrAbove(requiredRole: ROLE): boolean {
      const requiredLevel = ROLE_LEVEL[requiredRole] || 0;
      return roleLevel.value >= requiredLevel;
    }

    /**
     * 检查是否拥有指定权限
     * @param permission 权限标识
     */
    function hasPermission(permission: string): boolean {
      // 管理员拥有所有权限
      if (isAdmin.value) return true;
      return userInfo.value?.permissions?.includes(permission) ?? false;
    }

    /**
     * 检查是否拥有任一权限
     * @param permissions 权限标识数组
     */
    function hasAnyPermission(permissions: string[]): boolean {
      if (isAdmin.value) return true;
      return permissions.some(p => hasPermission(p));
    }

    /**
     * 检查是否拥有所有权限
     * @param permissions 权限标识数组
     */
    function hasAllPermissions(permissions: string[]): boolean {
      if (isAdmin.value) return true;
      return permissions.every(p => hasPermission(p));
    }

    return {
      // State
      token,
      refreshTokenValue,
      tokenExpires,
      userInfo,
      // Getters
      isLoggedIn,
      role,
      isAdmin,
      roleLevel,
      // Actions
      setToken,
      setRefreshToken,
      setUserInfo,
      login,
      register,
      smsLogin,
      sendSmsCode,
      wechatLogin,
      wechatPhoneLogin,
      alipayLogin,
      getUserInfo,
      updateUserInfo,
      changePassword,
      resetPasswordByPhone,
      refreshToken,
      resetUserState,
      logout,
      deleteAccount,
      // 权限检查
      hasRole,
      hasRoleOrAbove,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    };
  },
  {
    persist: {
      // Token 使用 storage 独立存储，只持久化 userInfo
      pick: ['userInfo'],
    },
  },
);
