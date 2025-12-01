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
 *
 * 当前状态：
 * - 登录逻辑已移至 User Store（teacherLoginAction / studentLoginAction）
 * - 此文件保留作为示例和未来扩展用
 */

// 示例：如果需要覆盖某个 API，可以这样做：
//
// import { someApi as generatedSomeApi } from '../generated/some-module/some-module';
// import type { SomeRequest, SomeResponse } from '../generated/model';
//
// export const someApi = async (data: SomeRequest): Promise<SomeResponse> => {
//   const response = await generatedSomeApi(data);
//   // 添加额外的业务逻辑
//   return response;
// };

// 空导出，确保模块可被识别
export {};
