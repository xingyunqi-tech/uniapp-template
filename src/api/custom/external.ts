/**
 * ==================== 外部 API 调用示例 ====================
 *
 * 场景：调用第三方 API 或其他微服务（OpenAPI 文档中不存在的接口）
 *
 * 使用场景：
 * - 调用外部第三方服务（如天气 API、地图 API、支付 API）
 * - 跨微服务调用
 * - 前端直接调用非本系统 API
 */

import { http, type ApiResponse } from '../core';

/**
 * 天气 API 响应类型
 */
export interface WeatherResponse {
  city: string;
  temperature: number;
  weather: string;
  humidity: number;
}

/**
 * 调用外部天气 API
 *
 * @param city 城市名称
 * @returns 天气信息
 *
 * @example
 * ```typescript
 * import { getWeather } from '@/api';
 *
 * const weather = await getWeather('beijing');
 * console.log(`${weather.city} 当前温度: ${weather.temperature}°C`);
 * ```
 */
export const getWeather = async (city: string): Promise<WeatherResponse> => {
  // 注意：这只是示例代码，实际使用时需要替换为真实的 API 地址
  const response = await http.Get<ApiResponse<WeatherResponse>>(`https://api.weather.example.com/weather/${city}`, {
    meta: {
      showError: true,
    },
    cacheFor: 10 * 60 * 1000, // 缓存 10 分钟
  });

  return response.data as WeatherResponse;
};
