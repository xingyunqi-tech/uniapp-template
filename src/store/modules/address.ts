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
  type GetAddressesParams,
} from '@/api';

/**
 * 地址状态管理 Store
 * 管理用户收货地址
 */
export const useAddressStore = defineStore('address', () => {
  // ==================== State ====================
  /** 地址列表 */
  const addressList = ref<Address[]>([]);
  /** 默认地址 */
  const defaultAddress = ref<Address | null>(null);
  /** 当前选中的地址 */
  const selectedAddress = ref<Address | null>(null);
  /** 是否正在加载 */
  const loading = ref(false);
  /** 是否还有更多数据 */
  const hasMore = ref(true);
  /** 已加载到的页码，0 表示尚未加载 */
  const currentPage = ref(0);

  // ==================== Getters ====================
  /** 地址数量 */
  const addressCount = computed(() => addressList.value.length);

  /** 是否有默认地址 */
  const hasDefaultAddress = computed(() => !!defaultAddress.value);

  // ==================== Actions ====================
  /** 最近一次列表请求的序号，新请求发出后旧请求的结果被丢弃 */
  let listRequestId = 0;

  /**
   * 获取地址列表
   * @param refresh 是否刷新（从第一页开始）
   */
  async function fetchAddressList(refresh = false): Promise<Address[]> {
    if (refresh) {
      currentPage.value = 0;
      hasMore.value = true;
    }

    if (!refresh && (loading.value || !hasMore.value)) {
      return addressList.value;
    }

    const id = ++listRequestId;
    const page = currentPage.value + 1;
    loading.value = true;
    try {
      const params: GetAddressesParams = {
        page,
        limit: 20,
      };

      const response = await getAddresses(params);
      if (id !== listRequestId) return addressList.value;
      const newList = response.list || [];

      addressList.value = page === 1 ? newList : [...addressList.value, ...newList];
      hasMore.value = page < response.totalPages;
      currentPage.value = page;

      return addressList.value;
    } catch (error) {
      if (id !== listRequestId) return addressList.value;
      throw error;
    } finally {
      if (id === listRequestId) loading.value = false;
    }
  }

  /**
   * 获取地址详情
   */
  async function fetchAddress(id: number): Promise<Address> {
    return await getAddress(String(id));
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
    const address = await updateAddress(String(id), data);

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
    await deleteAddress(String(id));

    // 从列表中移除
    const index = addressList.value.findIndex(item => item.id === id);
    if (index !== -1) {
      const removed = addressList.value[index];
      addressList.value.splice(index, 1);

      // 如果删除的是默认地址，清除默认地址引用
      if (removed.isDefault) {
        // 如果还有其他地址，设置第一个为默认
        if (addressList.value.length > 0) {
          await setDefault(addressList.value[0].id);
        } else {
          defaultAddress.value = null;
        }
      }
    }
  }

  /**
   * 设置默认地址
   */
  async function setDefault(id: number): Promise<Address> {
    const address = await setDefaultAddress(String(id));

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
    listRequestId++;
    addressList.value = [];
    defaultAddress.value = null;
    selectedAddress.value = null;
    loading.value = false;
    hasMore.value = true;
    currentPage.value = 0;
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
