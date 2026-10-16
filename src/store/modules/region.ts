/**
 * 地区数据状态管理 Store
 * 使用后端 API 获取省市区数据，确保 H5、小程序、App 数据一致
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  getProvinces,
  getCities,
  getDistricts,
  getRegionByCode,
  getRegionTree,
  type Region,
  type RegionTreeDto,
} from '@/api';

/**
 * 树形地区数据结构（兼容 uni-data-picker）
 */
export interface RegionTreeItem {
  /** 行政区划代码 */
  value: string;
  /** 显示文本 */
  text: string;
  /** 子级数据 */
  children?: RegionTreeItem[];
}

export const useRegionStore = defineStore('region', () => {
  // ==================== State ====================
  /** 省份列表 */
  const provinces = ref<Region[]>([]);
  /** 城市缓存（按省份代码） */
  const citiesCache = ref<Map<string, Region[]>>(new Map());
  /** 区县缓存（按城市代码） */
  const districtsCache = ref<Map<string, Region[]>>(new Map());
  /** 树形结构数据（用于 uni-data-picker） */
  const regionTree = ref<RegionTreeItem[]>([]);
  /** 代码到名称的映射缓存 */
  const codeToNameMap = ref<Map<string, string>>(new Map());
  /** 进行中的请求，按请求 key 复用 */
  const inflight = new Map<string, Promise<unknown>>();
  /** 进行中请求的 key */
  const loadingKeys = ref(new Set<string>());
  /** 是否有请求正在加载 */
  const loading = computed(() => loadingKeys.value.size > 0);
  /** 是否已初始化树形数据 */
  const treeInitialized = ref(false);

  // ==================== Getters ====================
  /** 是否有省份数据 */
  const hasProvinces = computed(() => provinces.value.length > 0);

  /** 是否有树形数据 */
  const hasTree = computed(() => regionTree.value.length > 0);

  // ==================== Actions ====================

  function dedupe<T>(key: string, task: () => Promise<T>): Promise<T> {
    const existing = inflight.get(key);
    if (existing) return existing as Promise<T>;

    loadingKeys.value.add(key);
    const promise = task().finally(() => {
      if (inflight.get(key) !== promise) return;
      inflight.delete(key);
      loadingKeys.value.delete(key);
    });
    inflight.set(key, promise);
    return promise;
  }

  /**
   * 获取所有省份
   */
  async function fetchProvinces(): Promise<Region[]> {
    if (provinces.value.length > 0) {
      return provinces.value;
    }

    return dedupe('provinces', async () => {
      const data = await getProvinces();
      provinces.value = data;
      data.forEach(region => {
        codeToNameMap.value.set(region.code, region.name);
      });
      return data;
    });
  }

  /**
   * 获取指定省份下的城市
   * @param provinceCode 省份代码
   */
  async function fetchCities(provinceCode: string): Promise<Region[]> {
    // 检查缓存
    if (citiesCache.value.has(provinceCode)) {
      return citiesCache.value.get(provinceCode)!;
    }

    return dedupe(`cities:${provinceCode}`, async () => {
      const data = await getCities(provinceCode);
      citiesCache.value.set(provinceCode, data);
      data.forEach(region => {
        codeToNameMap.value.set(region.code, region.name);
      });
      return data;
    });
  }

  /**
   * 获取指定城市下的区县
   * @param cityCode 城市代码
   */
  async function fetchDistricts(cityCode: string): Promise<Region[]> {
    // 检查缓存
    if (districtsCache.value.has(cityCode)) {
      return districtsCache.value.get(cityCode)!;
    }

    return dedupe(`districts:${cityCode}`, async () => {
      const data = await getDistricts(cityCode);
      districtsCache.value.set(cityCode, data);
      data.forEach(region => {
        codeToNameMap.value.set(region.code, region.name);
      });
      return data;
    });
  }

  /**
   * 获取完整的树形结构数据
   * 用于 H5 平台的 uni-data-picker
   */
  async function fetchRegionTree(): Promise<RegionTreeItem[]> {
    if (treeInitialized.value && regionTree.value.length > 0) {
      return regionTree.value;
    }

    return dedupe('tree', async () => {
      const tree = transformToTreeItems(await getRegionTree());
      regionTree.value = tree;
      treeInitialized.value = true;
      buildCodeToNameMap(tree);
      return tree;
    });
  }

  /**
   * 将 API 返回的 RegionTreeDto 数据转换为 uni-data-picker 格式
   */
  function transformToTreeItems(regions: RegionTreeDto[]): RegionTreeItem[] {
    return regions.map(region => {
      const item: RegionTreeItem = {
        value: region.code,
        text: region.name,
      };

      // 如果有子级数据，递归转换
      if (region.children && region.children.length > 0) {
        item.children = transformToTreeItems(region.children);
      }

      return item;
    });
  }

  /**
   * 从树形数据构建代码到名称的映射
   */
  function buildCodeToNameMap(items: RegionTreeItem[]) {
    items.forEach(item => {
      codeToNameMap.value.set(item.value, item.text);
      if (item.children) {
        buildCodeToNameMap(item.children);
      }
    });
  }

  /**
   * 根据代码获取地区名称
   * @param code 行政区划代码
   */
  function getNameByCode(code: string): string {
    return codeToNameMap.value.get(code) || '';
  }

  /**
   * 根据代码获取地区详情（从 API）
   * @param code 行政区划代码
   */
  async function fetchRegionByCode(code: string): Promise<Region | null> {
    if (!code) return null;
    return dedupe(`code:${code}`, async () => {
      try {
        const region = await getRegionByCode(code);
        codeToNameMap.value.set(region.code, region.name);
        return region;
      } catch {
        return null;
      }
    });
  }

  /**
   * 将省市区编码转换为名称
   * 优先从缓存获取，缓存没有则从 API 获取；空编码不请求，对应名称为空字符串
   */
  async function codesToNames(
    provinceCode: string,
    cityCode: string,
    districtCode: string,
  ): Promise<{ province: string; city: string; district: string }> {
    const result = {
      province: getNameByCode(provinceCode),
      city: getNameByCode(cityCode),
      district: getNameByCode(districtCode),
    };

    // 如果缓存中没有，从 API 获取
    const missingCodes: string[] = [];
    if (provinceCode && !result.province) missingCodes.push(provinceCode);
    if (cityCode && !result.city) missingCodes.push(cityCode);
    if (districtCode && !result.district) missingCodes.push(districtCode);

    if (missingCodes.length > 0) {
      // 并行获取缺失的地区信息
      await Promise.all(missingCodes.map(code => fetchRegionByCode(code)));

      // 重新获取名称
      result.province = getNameByCode(provinceCode);
      result.city = getNameByCode(cityCode);
      result.district = getNameByCode(districtCode);
    }

    return result;
  }

  /**
   * 同步版本的编码转名称（仅从缓存获取）
   */
  function codesToNamesSync(
    provinceCode: string,
    cityCode: string,
    districtCode: string,
  ): { province: string; city: string; district: string } {
    return {
      province: getNameByCode(provinceCode),
      city: getNameByCode(cityCode),
      district: getNameByCode(districtCode),
    };
  }

  /**
   * 预加载地区数据
   * 在应用启动时调用，确保有基础数据
   */
  async function preload() {
    // 先加载省份列表
    await fetchProvinces();

    // H5 平台预加载完整树形数据
    // #ifdef H5
    await fetchRegionTree();
    // #endif
  }

  /**
   * 清除缓存
   */
  function clearCache() {
    provinces.value = [];
    citiesCache.value.clear();
    districtsCache.value.clear();
    regionTree.value = [];
    codeToNameMap.value.clear();
    treeInitialized.value = false;
  }

  /**
   * 重置状态
   */
  function reset() {
    clearCache();
    inflight.clear();
    loadingKeys.value.clear();
  }

  return {
    // State
    provinces,
    citiesCache,
    districtsCache,
    regionTree,
    loading,
    treeInitialized,
    // Getters
    hasProvinces,
    hasTree,
    // Actions
    fetchProvinces,
    fetchCities,
    fetchDistricts,
    fetchRegionTree,
    fetchRegionByCode,
    getNameByCode,
    codesToNames,
    codesToNamesSync,
    preload,
    clearCache,
    reset,
  };
});
