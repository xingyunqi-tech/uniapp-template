import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  getAddresses,
  getAddress,
  getDefaultAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type Address,
  type CreateAddressDto,
  type UpdateAddressDto,
} from '@/api';
import { createPagedList } from '../helpers/paged-list';

/**
 * 地址状态管理 Store
 * 管理用户收货地址
 */
export const useAddressStore = defineStore('address', () => {
  // ==================== State ====================
  const pager = createPagedList<Address>({ fetchPage: params => getAddresses(params) });
  /** 地址列表 */
  const addressList = pager.list;
  /** 默认地址 */
  const defaultAddress = ref<Address | null>(null);
  /** 当前选中的地址 */
  const selectedAddress = ref<Address | null>(null);
  /** 是否正在加载 */
  const loading = pager.loading;
  /** 是否还有更多数据 */
  const hasMore = pager.hasMore;
  /** 已加载到的页码，0 表示尚未加载 */
  const currentPage = pager.page;

  // ==================== Getters ====================
  /** 地址数量 */
  const addressCount = computed(() => addressList.value.length);

  /** 是否有默认地址 */
  const hasDefaultAddress = computed(() => !!defaultAddress.value);

  // ==================== Actions ====================
  /**
   * 获取地址列表
   * @param refresh 是否刷新（从第一页开始）
   */
  async function fetchAddressList(refresh = false): Promise<Address[]> {
    return pager.load(undefined, refresh);
  }

  /**
   * 获取地址详情
   */
  async function fetchAddress(id: number): Promise<Address> {
    return await getAddress(id);
  }

  /**
   * 获取默认地址
   */
  async function fetchDefaultAddress(): Promise<Address | null> {
    try {
      const address = await getDefaultAddress();
      defaultAddress.value = address;
      return address;
    } catch {
      defaultAddress.value = null;
      return null;
    }
  }

  /**
   * 创建地址
   */
  async function addAddress(data: CreateAddressDto): Promise<Address> {
    const address = await createAddress(data);

    // 添加到列表头部
    addressList.value.unshift(address);

    // 如果是默认地址，更新默认地址
    if (address.isDefault) {
      // 取消其他地址的默认状态
      addressList.value.forEach(item => {
        if (item.id !== address.id) {
          item.isDefault = false;
        }
      });
      defaultAddress.value = address;
    }

    return address;
  }

  /**
   * 更新地址
   */
  async function editAddress(id: number, data: UpdateAddressDto): Promise<Address> {
    const address = await updateAddress(id, data);

    // 更新列表中的地址
    const index = addressList.value.findIndex(item => item.id === id);
    if (index !== -1) {
      addressList.value[index] = address;
    }

    // 如果是默认地址，更新默认地址引用
    if (address.isDefault) {
      defaultAddress.value = address;
    }

    return address;
  }

  /**
   * 删除地址
   */
  async function removeAddress(id: number): Promise<void> {
    await deleteAddress(id);

    // 从列表中移除
    const index = addressList.value.findIndex(item => item.id === id);
    const wasDefault = defaultAddress.value?.id === id || (index !== -1 && addressList.value[index].isDefault);
    if (index !== -1) {
      addressList.value.splice(index, 1);
    }

    // 删除默认地址后后端会另选一条作为默认，重新获取
    if (wasDefault) {
      defaultAddress.value = null;
      const address = await fetchDefaultAddress();
      addressList.value.forEach(item => {
        item.isDefault = item.id === address?.id;
      });
    }
  }

  /**
   * 设置默认地址
   */
  async function setDefault(id: number): Promise<Address> {
    const address = await setDefaultAddress(id);

    // 更新列表中所有地址的默认状态
    addressList.value.forEach(item => {
      item.isDefault = item.id === id;
    });

    // 更新列表中的地址数据
    const index = addressList.value.findIndex(item => item.id === id);
    if (index !== -1) {
      addressList.value[index] = address;
    }

    defaultAddress.value = address;
    return address;
  }

  /**
   * 选择地址（用于订单等场景）
   */
  function selectAddress(address: Address | null) {
    selectedAddress.value = address;
  }

  /**
   * 清除选择
   */
  function clearSelection() {
    selectedAddress.value = null;
  }

  /**
   * 重置状态
   */
  function reset() {
    pager.reset();
    defaultAddress.value = null;
    selectedAddress.value = null;
  }

  return {
    // State
    addressList,
    defaultAddress,
    selectedAddress,
    loading,
    hasMore,
    currentPage,
    // Getters
    addressCount,
    hasDefaultAddress,
    // Actions
    fetchAddressList,
    fetchAddress,
    fetchDefaultAddress,
    addAddress,
    editAddress,
    removeAddress,
    setDefault,
    selectAddress,
    clearSelection,
    reset,
  };
});
