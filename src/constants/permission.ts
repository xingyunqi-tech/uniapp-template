/**
 * 角色权限常量
 */

/**
 * 用户角色枚举
 * 根据业务需求可以扩展
 */
export enum ROLE {
  /** 游客（未登录） */
  GUEST = 'guest',
  /** 普通用户 */
  USER = 'user',
  /** 管理员 */
  ADMIN = 'admin',
}

/**
 * 角色层级（数值越大权限越高）
 * 用于判断权限包含关系
 */
export const ROLE_LEVEL: Record<ROLE, number> = {
  [ROLE.GUEST]: 0,
  [ROLE.USER]: 10,
  [ROLE.ADMIN]: 100,
};

/**
 * 角色显示名称
 */
export const ROLE_LABELS: Record<ROLE, string> = {
  [ROLE.GUEST]: '游客',
  [ROLE.USER]: '普通用户',
  [ROLE.ADMIN]: '管理员',
};
