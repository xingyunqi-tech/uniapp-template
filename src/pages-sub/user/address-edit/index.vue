<template>
  <view class="address-edit-page" :class="globalStore.themeClass">
    <ULoading v-if="detailLoading" visible />
    <!-- 表单区域 -->
    <view class="form-section">
      <UMenuGroup>
        <UFormItem label="收货人" required>
          <input v-model="formData.name" placeholder="请输入收货人姓名" :maxlength="20" />
        </UFormItem>

        <UFormItem label="手机号" required>
          <input v-model="formData.phone" type="number" placeholder="请输入手机号" :maxlength="11" />
        </UFormItem>

        <!-- 统一使用 uni-data-picker，各平台使用相同的 API 数据 -->
        <!-- @vue-ignore: uni-data-picker 类型定义不完整，实际支持数组值 -->
        <uni-data-picker
          :localdata="regionStore.regionTree"
          popup-title="请选择所在地区"
          :value="regionPickerValue"
          @change="handleRegionChange"
        >
          <UFormItem label="所在地区" required :value="regionText" placeholder="请选择省市区" show-arrow />
        </uni-data-picker>

        <UFormItem label="详细地址" required :border="false">
          <textarea
            v-model="formData.address"
            class="form-textarea"
            placeholder="请输入详细地址，如街道、门牌号等"
            :maxlength="100"
            :auto-height="true"
          />
        </UFormItem>
      </UMenuGroup>
    </view>

    <!-- 设为默认 -->
    <view class="default-section">
      <UMenuGroup>
        <UMenuItem
          title="设为默认地址"
          :border="false"
          show-switch
          :switch-checked="formData.isDefault"
          @switch-change="handleDefaultChange"
        />
      </UMenuGroup>
    </view>

    <!-- 删除地址按钮 -->
    <view v-if="isEdit" class="delete-section">
      <button class="delete-btn" @click="handleDelete">删除地址</button>
    </view>

    <!-- 保存按钮 -->
    <UFixedButton text="保存" loading-text="保存中..." :loading="saveAction.loading.value" @click="handleSave" />
  </view>
</template>

<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '编辑地址',
  },
});

import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useAsyncAction, useSafeBack } from '@/composables';
import { useGlobalStore } from '@/store/modules/global';
import { useAddressStore } from '@/store/modules/address';
import { useRegionStore } from '@/store/modules/region';
import { PAGES } from '@/constants';

const globalStore = useGlobalStore();
const addressStore = useAddressStore();
const goBack = useSafeBack(PAGES.ADDRESS);
const regionStore = useRegionStore();

// 表单数据（province/city/district 存储行政区划代码）
const formData = reactive({
  id: 0,
  name: '',
  phone: '',
  province: '', // 省级代码
  city: '', // 市级代码
  district: '', // 区级代码
  address: '',
  isDefault: false,
});

// 是否编辑模式
const isEdit = ref(false);

// 编辑模式下地址详情加载中，加载完成前遮挡表单
const detailLoading = ref(false);

// 地区文本（将编码转换为名称显示）
const regionText = computed(() => {
  if (formData.province && formData.city && formData.district) {
    const names = regionStore.codesToNamesSync(formData.province, formData.city, formData.district);
    return `${names.province} ${names.city} ${names.district}`;
  }
  return '';
});

// 地区选择器值 (uni-data-picker 使用编码数组)
const regionPickerValue = computed((): UniDataPickerValueArray => {
  if (formData.province && formData.city && formData.district) {
    return [formData.province, formData.city, formData.district];
  }
  return [];
});

onLoad(async options => {
  if (options?.id) {
    isEdit.value = true;
    formData.id = Number(options.id);
    uni.setNavigationBarTitle({ title: '编辑地址' });
  } else {
    uni.setNavigationBarTitle({ title: '新增地址' });
  }

  const loadRegionTree = regionStore.fetchRegionTree().catch(error => {
    console.error('加载地区数据失败:', error);
  });
  await Promise.all([loadRegionTree, isEdit.value ? loadAddressDetail(formData.id) : undefined]);
});

// 加载地址详情
async function loadAddressDetail(id: number) {
  detailLoading.value = true;
  try {
    const address = await addressStore.fetchAddress(id);
    if (address) {
      formData.id = address.id;
      formData.name = address.name;
      formData.phone = address.phone;
      formData.address = address.address;
      formData.isDefault = address.isDefault;

      // 缺少区划代码时地区留空，需重新选择
      if (address.provinceCode && address.cityCode && address.districtCode) {
        formData.province = address.provinceCode;
        formData.city = address.cityCode;
        formData.district = address.districtCode;
        await regionStore.codesToNames(address.provinceCode, address.cityCode, address.districtCode);
      }
    }
  } catch (error) {
    console.error('加载地址详情失败:', error);
  } finally {
    detailLoading.value = false;
  }
}

// 地区选择变更 (uni-data-picker 直接返回编码)
interface DataPickerChangeEvent {
  detail: {
    value: Array<{ value: string; text: string }>;
  };
}
function handleRegionChange(e: DataPickerChangeEvent) {
  const values = e.detail.value;
  if (values && values.length >= 3) {
    formData.province = values[0].value;
    formData.city = values[1].value;
    formData.district = values[2].value;
  }
}

// 设置默认
function handleDefaultChange(checked: boolean) {
  formData.isDefault = checked;
}

// 验证表单
function validateForm(): boolean {
  if (!formData.name.trim()) {
    uni.showToast({ title: '请输入收货人姓名', icon: 'none' });
    return false;
  }
  if (!formData.phone.trim()) {
    uni.showToast({ title: '请输入手机号', icon: 'none' });
    return false;
  }
  if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return false;
  }
  if (!formData.province || !formData.city || !formData.district) {
    uni.showToast({ title: '请选择所在地区', icon: 'none' });
    return false;
  }
  if (!formData.address.trim()) {
    uni.showToast({ title: '请输入详细地址', icon: 'none' });
    return false;
  }
  return true;
}

// 保存地址，使用区划代码保存，后端会自动填充名称
const saveAction = useAsyncAction({
  action: async () => {
    const addressData = {
      name: formData.name,
      phone: formData.phone,
      provinceCode: formData.province,
      cityCode: formData.city,
      districtCode: formData.district,
      address: formData.address,
      isDefault: formData.isDefault,
    };

    if (isEdit.value) {
      await addressStore.editAddress(formData.id, addressData);
    } else {
      await addressStore.addAddress(addressData);
    }
  },
  successText: '保存成功',
  onSuccess: () => {
    goBack();
  },
});

function handleSave() {
  if (!validateForm()) return;
  saveAction.execute();
}

// 删除地址
function handleDelete() {
  uni.showModal({
    title: '提示',
    content: '确定要删除该地址吗？',
    success: async res => {
      if (res.confirm) {
        try {
          await addressStore.removeAddress(formData.id);

          uni.showToast({
            title: '删除成功',
            icon: 'success',
          });

          setTimeout(() => {
            goBack();
          }, 1500);
        } catch (error) {
          console.error('删除地址失败:', error);
        }
      }
    },
  });
}
</script>

<style scoped lang="scss">
.address-edit-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding-bottom: calc(var(--safe-area-inset-bottom) + 160rpx);
  background: var(--color-bg-grey);
}

// 表单区域
.form-section {
  padding: 24rpx;

  // 输入框样式
  input {
    flex: 1;
    height: 48rpx;
    padding: 0;
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: 48rpx;

    &::placeholder {
      color: var(--color-text-placeholder);
    }
  }

  .form-textarea {
    width: 100%;
    min-height: 120rpx;
    padding: 0;
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: 1.5;

    &::placeholder {
      color: var(--color-text-placeholder);
    }
  }
}

// 默认地址
.default-section {
  padding: 0 24rpx;
}

// 删除按钮区域
.delete-section {
  padding: 48rpx 24rpx;

  .delete-btn {
    width: 100%;
    height: 96rpx;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);
    color: var(--color-error);
    font-size: 32rpx;
    line-height: 96rpx;

    &::after {
      display: none;
    }

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
