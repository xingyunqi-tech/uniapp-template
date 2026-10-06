<template>
  <view class="address-edit-page" :class="globalStore.themeClass">
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
    <UFixedButton text="保存" loading-text="保存中..." :loading="saving" @click="handleSave" />
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
import { useGlobalStore } from '@/store/modules/global';
import { useAddressStore } from '@/store/modules/address';
import { useRegionStore } from '@/store/modules/region';

const globalStore = useGlobalStore();
const addressStore = useAddressStore();
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

// 保存状态
const saving = ref(false);

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
  // 预加载地区树形数据（所有平台统一）
  await regionStore.fetchRegionTree();

  if (options?.id) {
    isEdit.value = true;
    loadAddressDetail(Number(options.id));
    uni.setNavigationBarTitle({ title: '编辑地址' });
  } else {
    uni.setNavigationBarTitle({ title: '新增地址' });
  }
});

// 加载地址详情
async function loadAddressDetail(id: number) {
  try {
    const address = await addressStore.fetchAddress(id);
    if (address) {
      formData.id = address.id;
      formData.name = address.name;
      formData.phone = address.phone;
      // 优先使用区划代码，兼容旧数据使用名称
      formData.province = address.provinceCode || address.province;
      formData.city = address.cityCode || address.city;
      formData.district = address.districtCode || address.district;
      formData.address = address.address;
      formData.isDefault = address.isDefault;

      // 如果使用了区划代码，预加载对应的名称到缓存
      if (address.provinceCode && address.cityCode && address.districtCode) {
        await regionStore.codesToNames(address.provinceCode, address.cityCode, address.districtCode);
      }
    }
  } catch (error) {
    console.error('加载地址详情失败:', error);
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

// 保存地址
async function handleSave() {
  if (!validateForm()) return;

  saving.value = true;

  try {
    // 使用区划代码保存，后端会自动填充名称
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

    uni.showToast({
      title: '保存成功',
      icon: 'success',
    });

    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    console.error('保存地址失败:', error);
  } finally {
    saving.value = false;
  }
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
            uni.navigateBack();
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
