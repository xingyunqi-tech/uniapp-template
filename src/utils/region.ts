/**
 * 地区编码与名称转换工具
 *
 * 基于 regionStore 实现，数据统一从后端 API 获取
 * 确保 H5、小程序、App 使用相同的地区数据
 */

import { useRegionStore } from '@/store/modules/region';

/**
 * 树形地区数据结构（兼容 uni-data-picker）
 */
export interface RegionItem {
  /** 行政区划代码 */
  value: string;
  /** 显示文本 */
  text: string;
  /** 子级数据 */
  children?: RegionItem[];
}

/**
 * 根据编码获取名称（同步，从缓存获取）
 * @param code 行政区划代码
 * @returns 地区名称，如果缓存中没有返回空字符串
 */
export function getNameByCode(code: string): string {
  const regionStore = useRegionStore();
  return regionStore.getNameByCode(code);
}

/**
 * 将省市区编码转换为名称（同步版本）
 * @param provinceCode 省级代码
 * @param cityCode 市级代码
 * @param districtCode 区级代码
 * @returns 省市区名称对象
 */
export function codesToNames(
  provinceCode: string,
  cityCode: string,
  districtCode: string,
): {
  province: string;
  city: string;
  district: string;
} {
  const regionStore = useRegionStore();
  return regionStore.codesToNamesSync(provinceCode, cityCode, districtCode);
}

/**
 * 将省市区编码转换为名称（异步版本，缓存没有会从 API 获取）
 */
export async function codesToNamesAsync(
  provinceCode: string,
  cityCode: string,
  districtCode: string,
): Promise<{ province: string; city: string; district: string }> {
  const regionStore = useRegionStore();
  return regionStore.codesToNames(provinceCode, cityCode, districtCode);
}

/**
 * 将省市区名称转换为编码（从缓存的树形数据中查找）
 * @param provinceName 省级名称
 * @param cityName 市级名称
 * @param districtName 区级名称
 * @returns 省市区编码对象
 */
export function namesToCodes(
  provinceName: string,
  cityName: string,
  districtName: string,
): {
  provinceCode: string;
  cityCode: string;
  districtCode: string;
} {
  const regionStore = useRegionStore();
  const tree = regionStore.regionTree;

  let provinceCode = '';
  let cityCode = '';
  let districtCode = '';

  // 在树形数据中查找
  for (const province of tree) {
    if (province.text === provinceName) {
      provinceCode = province.value;
      if (province.children) {
        for (const city of province.children) {
          if (city.text === cityName) {
            cityCode = city.value;
            if (city.children) {
              for (const district of city.children) {
                if (district.text === districtName) {
                  districtCode = district.value;
                  break;
                }
              }
            }
            break;
          }
        }
      }
      break;
    }
  }

  return { provinceCode, cityCode, districtCode };
}

/**
 * 格式化完整地址文本
 * @param provinceCode 省级代码
 * @param cityCode 市级代码
 * @param districtCode 区级代码
 * @param address 详细地址
 * @returns 完整地址字符串
 */
export function formatFullAddress(
  provinceCode: string,
  cityCode: string,
  districtCode: string,
  address: string,
): string {
  const names = codesToNames(provinceCode, cityCode, districtCode);
  return `${names.province} ${names.city} ${names.district} ${address}`.trim();
}

/**
 * 验证行政区划代码格式（12位数字）
 * @param code 行政区划代码
 * @returns 是否为有效格式
 */
export function isValidRegionCode(code: string): boolean {
  return /^\d{12}$/.test(code);
}
