import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo, LoginParams, RegisterParams, SmsLoginParams, WechatLoginParams } from '@/interface';
import { ROLE, ROLE_LEVEL } from '@/constants/permission';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { encryptPassword } from '@/utils/crypto';
import {
  loginWithPhone,
  loginWithSms,
  loginWithWechat,
  registerWithPhone,
  sendSmsCode as apiSendSmsCode,
  getCurrentUser,
  updateCurrentUser,
  changePassword as apiChangePassword,
  resetPasswordByPhone as apiResetPasswordByPhone,
  logout as apiLogout,
  refreshToken as apiRefreshToken,
  type User,
  AuthSendCodeDtoType,
  AuthWechatLoginDtoType,
} from '@/api';

// 重新导出类型，保持向后兼容
export type { UserInfo, LoginParams, RegisterParams, SmsLoginParams, WechatLoginParams };

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
    role: user.role?.name === 'admin' ? ROLE.ADMIN : ROLE.USER,
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
    /** 用户 Token - 从 storage 初始化 */
    const token = ref<string>(storage.get<string>(STORAGE_KEYS.TOKEN) || '');
    /** Refresh Token */
    const refreshTokenValue = ref<string>(storage.get<string>('refreshToken') || '');
    /** Token 过期时间 */
    const tokenExpires = ref<number>(storage.get<number>('tokenExpires') || 0);
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
      // 同步到 storage
      if (tokenValue) {
        storage.set(STORAGE_KEYS.TOKEN, tokenValue);
      } else {
        storage.remove(STORAGE_KEYS.TOKEN);
      }
    }

    /**
     * 设置 Refresh Token
     */
    function setRefreshToken(value: string, expires?: number) {
      refreshTokenValue.value = value;
      if (expires) {
        tokenExpires.value = expires;
        storage.set('tokenExpires', expires);
      }
      if (value) {
        storage.set('refreshToken', value);
      } else {
        storage.remove('refreshToken');
        storage.remove('tokenExpires');
      }
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
      photo?: { id: string };
      gender?: number;
      birthday?: string;
    }): Promise<UserInfo | null> {
      const user = await updateCurrentUser(params);
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
     * 刷新 Token，失败返回 null（登录态由请求拦截器统一清理）
     */
    async function refreshToken(): Promise<string | null> {
      if (!refreshTokenValue.value) {
        return null;
      }

      try {
        const response = await apiRefreshToken(refreshTokenValue.value);
        setToken(response.token);
        setRefreshToken(response.refreshToken, response.tokenExpires);
        return response.token;
      } catch {
        return null;
      }
    }

    /**
     * 清除本地登录态（不调用登出接口），包括其他 Store 的用户相关数据
     */
    async function resetUserState(): Promise<void> {
      // 清除用户状态
      token.value = '';
      refreshTokenValue.value = '';
      tokenExpires.value = 0;
      userInfo.value = null;

      // 清除 storage
      storage.remove(STORAGE_KEYS.TOKEN);
      storage.remove('refreshToken');
      storage.remove('tokenExpires');

      // 清除 Pinia 持久化的 userInfo (key 为 store id)
      storage.remove('user');

      // 重置其他 Store 的用户相关数据
      // 延迟导入避免循环依赖
      const { useAddressStore } = await import('./address');
      const { useOrderStore } = await import('./order');
      const { useFavoriteStore } = await import('./favorite');
      const { useNotificationStore } = await import('./notification');
      const { useShareStore } = await import('./share');
      const { useFeedbackStore } = await import('./feedback');

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
        await resetUserState();
      }
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
      getUserInfo,
      updateUserInfo,
      changePassword,
      resetPasswordByPhone,
      refreshToken,
      resetUserState,
      logout,
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
