/// <reference types="vite/client" />

/**
 * 环境变量类型定义
 */
interface ImportMetaEnv {
  /** API 基础地址（小程序端必须为完整地址） */
  readonly VITE_API_BASE_URL: string;
  /** 错误上报地址，留空则不上报 */
  readonly VITE_ERROR_REPORT_URL?: string;
  /** 微信订阅消息模板 ID：支付成功，需与后端 WECHAT_SUBSCRIBE_ORDER_PAID_TEMPLATE_ID 一致，留空则不申请 */
  readonly VITE_WX_TMPL_ORDER_PAID?: string;
  /**
   * H5 是否额外产出 legacy 包（仅构建期生效，见 vite.config.ts）
   * - `'true'` 启用；其它值或未设置 = 禁用
   */
  readonly VITE_LEGACY?: 'true' | 'false';
  /**
   * 是否生成包体积分析报告（仅构建期生效，输出 reports/analyzer.html）
   * - `'true'` 启用；其它值或未设置 = 禁用
   */
  readonly VITE_ENABLE_ANALYZER?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
