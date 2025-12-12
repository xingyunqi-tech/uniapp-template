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
 * - src/api/index.ts 会优先导出 custom 中的覆盖版本
 */

import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { FileType } from '../generated/model';

/**
 * 上传文件响应结构
 * 后端返回格式：{ code: 200, data: { file: { id, path } } }
 */
interface UploadResponse {
  code: number;
  message?: string;
  data?: {
    file: FileType;
  };
}

/**
 * 上传单个文件（兼容 uni-app）
 *
 * 覆盖 Orval 生成的 uploadFile，使用 uni.uploadFile 实现
 * 因为小程序不支持 FormData，需要使用平台原生 API
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
export const uploadFileByPath = (filePath: string): Promise<FileType> => {
  return new Promise((resolve, reject) => {
    const token = storage.get<string>(STORAGE_KEYS.TOKEN);
    const baseURL = import.meta.env.VITE_API_BASE_URL || '';

    uni.uploadFile({
      url: `${baseURL}/api/v1/files/upload`,
      filePath,
      name: 'file',
      header: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      success: res => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const response = JSON.parse(res.data) as UploadResponse;
            // 兼容 ApiResponse 格式
            if ((response.code === 200 || response.code === 0) && response.data?.file) {
              resolve(response.data.file);
            } else {
              reject(new Error(response.message || '上传失败'));
            }
          } catch {
            reject(new Error('解析响应失败'));
          }
        } else {
          reject(new Error(`上传失败(${res.statusCode})`));
        }
      },
      fail: err => {
        reject(new Error(err.errMsg || '上传失败'));
      },
    });
  });
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
