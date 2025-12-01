/**
 * 通用接口类型定义
 */

/**
 * 分页请求参数
 */
export interface PageParams {
  page?: number;
  pageSize?: number;
}

/**
 * 分页响应数据
 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 通用列表项
 */
export interface ListItem {
  id: string | number;
  name: string;
  /** 描述信息 */
  description?: string;
  /** 图标 */
  icon?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 扩展数据 */
  extra?: Record<string, string | number | boolean | null | undefined>;
}
