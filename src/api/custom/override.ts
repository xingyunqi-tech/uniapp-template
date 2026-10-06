/**
 * ==================== 覆盖生成 API 示例 ====================
 *
 * 场景：需要在 Orval 生成的 API 基础上添加额外的业务逻辑
 *
 * 使用场景：
 * - 登录成功后需要额外处理（如存储 Token、跳转页面）
 * - 在生成的 API 基础上添加缓存、重试、日志等
 *
 * ⚠️ 注意：
 * - 覆盖时保持函数名和生成的 API 一致
 * - src/api/index.ts 由 scripts/api/update-api-exports.ts 生成，会剔除 generated 中的同名导出，请勿手改
 * - 本目录不要 import Store（会形成循环依赖）
 */

import { http, type ApiResponse } from '../core/alova';
import { customMutator } from '../core/mutator';
import type { FileType, RefreshResponseDto } from '../generated/model';

/**
 * 刷新 Token：以 Refresh Token 作为 Bearer 凭证
 *
 * @param refreshTokenValue 登录时下发的 Refresh Token
 */
export const refreshToken = (refreshTokenValue: string) => {
  return customMutator<RefreshResponseDto>(
    { url: `/api/v1/auth/refresh`, method: 'POST' },
    { headers: { Authorization: `Bearer ${refreshTokenValue}` }, skipAuthHandling: true, showError: false },
  );
};

/**
 * 退出登录：Token 失效时直接抛错，不触发刷新与登录跳转
 */
export const logout = () => {
  return customMutator<void>(
    { url: `/api/v1/auth/logout`, method: 'POST' },
    { skipAuthHandling: true, showError: false },
  );
};

/**
 * 上传单个文件（兼容 uni-app）
 *
 * 小程序不支持 FormData，经 http 实例以 uni.uploadFile 上传，与普通请求共用 Token 注入和 401 刷新
 *
 * @param filePath 文件临时路径（uni.chooseImage 返回的 tempFilePath）
 * @returns 上传后的文件信息（包含 id 和 path）
 *
 * @example
 * ```typescript
 * import { uploadFileByPath } from '@/api';
 *
 * const res = await uni.chooseImage({ count: 1 });
 * const file = await uploadFileByPath(res.tempFilePaths[0]);
 * console.log('上传成功:', file.id, file.path);
 * ```
 */
export const uploadFileByPath = async (filePath: string): Promise<FileType> => {
  const response = await http.Post<ApiResponse<{ file: FileType }>>(
    '/api/v1/files/upload',
    { name: 'file', filePath },
    { requestType: 'upload', meta: { showError: false } },
  );
  if (!response.data?.file) {
    throw new Error(response.message || '上传失败');
  }
  return response.data.file;
};

/**
 * 批量上传文件
 *
 * @param filePaths 文件临时路径数组
 * @returns 上传后的文件信息数组
 */
export const uploadFilesByPath = async (filePaths: string[]): Promise<FileType[]> => {
  const results = await Promise.all(filePaths.map(path => uploadFileByPath(path)));
  return results;
};
