/**
 * UniApp 按钮开放能力事件类型定义
 */

declare namespace UniApp {
  /** 获取用户手机号回调事件 */
  interface GetPhoneNumberEvent {
    detail: {
      /** 加密数据 */
      encryptedData?: string;
      /** 加密算法的初始向量 */
      iv?: string;
      /** 云函数返回的 code */
      code?: string;
      /** 错误信息 */
      errMsg: string;
    };
  }

  /** 获取用户信息回调事件 */
  interface GetUserInfoEvent {
    detail: {
      /** 用户信息对象 */
      userInfo?: {
        nickName: string;
        avatarUrl: string;
        gender: number;
        province: string;
        city: string;
        country: string;
      };
      /** 加密数据 */
      encryptedData?: string;
      /** 加密算法的初始向量 */
      iv?: string;
      /** 签名 */
      signature?: string;
      /** 原始数据 */
      rawData?: string;
      /** 错误信息 */
      errMsg: string;
    };
  }

  /** 打开设置页回调事件 */
  interface OpenSettingEvent {
    detail: {
      /** 用户授权结果 */
      authSetting: Record<string, boolean>;
      /** 错误信息 */
      errMsg: string;
    };
  }

  /** 启动 App 回调事件 */
  interface LaunchAppEvent {
    detail: {
      /** 错误信息 */
      errMsg: string;
    };
  }

  /** 通用错误事件 */
  interface ButtonErrorEvent {
    detail: {
      /** 错误信息 */
      errMsg: string;
    };
  }

  /** 页面实例类型 */
  interface PageInstance {
    /** 页面路由 */
    route?: string;
    /** 页面参数 */
    options?: Record<string, string>;
    /** 页面数据 */
    $vm?: Record<string, unknown>;
  }
}
