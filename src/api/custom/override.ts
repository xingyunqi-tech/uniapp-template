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
import { compressImage, type CompressImageOptions } from '@/utils/image';

export interface UploadFileOptions {
  /** 上传前压缩图片，默认开启；非图片文件不压缩 */
  compress?: boolean | CompressImageOptions;
}

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
 * @param options.compress 图片压缩配置，false 关闭压缩
 * @returns 上传后的文件信息（包含 id 和 path）
 *
 * @example
 * ```typescript
 * import { uploadFileByPath } from '@/api';
 *
 * const res = await uni.chooseImage({ count: 1 });
 * const file = await uploadFileByPath(res.tempFilePaths[0]);
 * console.log('上传成功:', file.id, file.path);
 *
 * await uploadFileByPath(path, { compress: { maxSide: 1080 } });
 * await uploadFileByPath(path, { compress: false });
 * ```
 */
export const uploadFileByPath = async (sourcePath: string, options: UploadFileOptions = {}): Promise<FileType> => {
  const { compress = true } = options;
  const filePath =
    compress === false ? sourcePath : await compressImage(sourcePath, compress === true ? undefined : compress);
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

/** 批量上传的最大并发数 */
export const UPLOAD_CONCURRENCY = 3;

/**
 * 批量上传文件，最多 UPLOAD_CONCURRENCY 个同时进行，每个文件先压缩再上传
 *
 * 任一文件失败即 reject 该错误，其后的文件不开始，已开始的文件继续完成
 *
 * @param filePaths 文件临时路径数组
 * @param options 同 uploadFileByPath
 * @returns 上传后的文件信息数组，顺序与 filePaths 一致
 */
export const uploadFilesByPath = async (filePaths: string[], options?: UploadFileOptions): Promise<FileType[]> => {
  const results = new Array<FileType>(filePaths.length);
  let next = 0;
  let failed = false;
  const worker = async () => {
    while (!failed && next < filePaths.length) {
      const index = next++;
      try {
        results[index] = await uploadFileByPath(filePaths[index], options);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  const workerCount = Math.min(UPLOAD_CONCURRENCY, filePaths.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
};
