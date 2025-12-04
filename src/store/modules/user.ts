import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 用户信息接口
 */
export interface UserInfo {
  id?: number;
  username?: string;
  avatar?: string;
  phone?: string;
}

/**
 * 登录参数接口
 */
export interface LoginParams {
  phone: string;
  password: string;
}

/**
 * 注册参数接口
 */
export interface RegisterParams {
  phone: string;
  password: string;
}

/**
 * 验证码登录参数接口
 */
export interface SmsLoginParams {
  phone: string;
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
 * 用户状态管理 Store
 * 管理用户登录状态、token、用户信息等
 */
export const useUserStore = defineStore(
  'user',
  () => {
    // ==================== State ====================
    /** 用户 Token */
    const token = ref<string>('');
    /** 用户信息 */
    const userInfo = ref<UserInfo | null>(null);

    // ==================== Getters ====================
    /** 是否已登录 */
    const isLoggedIn = computed(() => !!token.value);

    // ==================== Actions ====================
    /**
     * 设置 Token
     * @param tokenValue Token 字符串
     */
    function setToken(tokenValue: string) {
      token.value = tokenValue;
    }

    /**
     * 设置用户信息
     * @param info 用户信息
     */
    function setUserInfo(info: UserInfo | null) {
      userInfo.value = info;
    }

    /**
     * 登录（手机号+密码）
     * @param params 登录参数
     */
    async function login(params: LoginParams): Promise<string> {
      try {
        // TODO: 调用实际的登录 API
        // const response = await postAuthLogin(params);

        // 模拟登录成功
        const mockToken = 'mock_token_' + Date.now();
        const mockUserInfo: UserInfo = {
          id: 1,
          username: params.phone,
          avatar: '',
          phone: params.phone,
        };

        setToken(mockToken);
        setUserInfo(mockUserInfo);

        return mockToken;
      } catch (error) {
        return Promise.reject(error);
      }
    }

    /**
     * 注册（手机号+密码）
     * @param params 注册参数
     */
    async function register(params: RegisterParams): Promise<string> {
      try {
        // TODO: 调用实际的注册 API
        // const response = await postAuthRegister(params);

        // 模拟注册成功，注册后自动登录
        const mockToken = 'mock_token_' + Date.now();
        const mockUserInfo: UserInfo = {
          id: Date.now(),
          username: params.phone,
          avatar: '',
          phone: params.phone,
        };

        setToken(mockToken);
        setUserInfo(mockUserInfo);

        return mockToken;
      } catch (error) {
        return Promise.reject(error);
      }
    }

    /**
     * 验证码登录
     * @param params 验证码登录参数
     */
    async function smsLogin(params: SmsLoginParams): Promise<string> {
      try {
        // TODO: 调用实际的验证码登录 API
        // const response = await postAuthSmsLogin(params);

        // 模拟验证码登录成功
        const mockToken = 'mock_sms_token_' + Date.now();
        const mockUserInfo: UserInfo = {
          id: Date.now(),
          username: params.phone,
          avatar: '',
          phone: params.phone,
        };

        setToken(mockToken);
        setUserInfo(mockUserInfo);

        return mockToken;
      } catch (error) {
        return Promise.reject(error);
      }
    }

    /**
     * 发送验证码
     * @param phone 手机号
     */
    async function sendSmsCode(phone: string): Promise<void> {
      try {
        // TODO: 调用实际的发送验证码 API
        // await postAuthSendSmsCode({ phone });

        // 模拟发送成功
        console.log('验证码已发送到:', phone);
      } catch (error) {
        return Promise.reject(error);
      }
    }

    /**
     * 微信登录
     * @param params 微信登录参数
     */
    async function wechatLogin(params: WechatLoginParams): Promise<string> {
      try {
        // TODO: 调用实际的微信登录 API
        // const response = await postAuthWechatLogin(params);
        console.log('wechatLogin params:', params);

        // 模拟微信登录成功
        const mockToken = 'mock_wechat_token_' + Date.now();
        const mockUserInfo: UserInfo = {
          id: Date.now(),
          username: '微信用户',
          avatar: '',
          phone: '',
        };

        setToken(mockToken);
        setUserInfo(mockUserInfo);

        return mockToken;
      } catch (error) {
        return Promise.reject(error);
      }
    }

    /**
     * 获取用户信息
     */
    async function getUserInfo(): Promise<UserInfo | null> {
      if (!token.value) {
        return null;
      }

      try {
        // TODO: 调用实际的获取用户信息 API
        // const response = await getAuthUserInfo();
        // setUserInfo(response);
        // return response;

        // 模拟获取用户信息
        return userInfo.value;
      } catch (error) {
        return Promise.reject(error);
      }
    }

    /**
     * 退出登录
     */
    async function logout(): Promise<void> {
      try {
        // TODO: 调用实际的退出登录 API
        // await postAuthLogout();
      } catch {
        // 即使接口调用失败，也要清除本地状态
      } finally {
        token.value = '';
        userInfo.value = null;
      }
    }

    return {
      // State
      token,
      userInfo,
      // Getters
      isLoggedIn,
      // Actions
      setToken,
      setUserInfo,
      login,
      register,
      smsLogin,
      sendSmsCode,
      wechatLogin,
      getUserInfo,
      logout,
    };
  },
  {
    persist: {
      pick: ['token', 'userInfo'],
      storage: {
        getItem: (key: string) => uni.getStorageSync(key),
        setItem: (key: string, value: string) => uni.setStorageSync(key, value),
      },
    },
  },
);
