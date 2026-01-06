<route lang="json5">
{
  style: {
    navigationBarTitleText: '编辑地址',
  },
}
</route>

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

        <!-- #ifdef MP-WEIXIN || MP-ALIPAY || APP -->
        <picker mode="region" :value="regionValue" @change="handleRegionChange">
          <UFormItem label="所在地区" required :value="regionText" placeholder="请选择省市区" show-arrow />
        </picker>
        <!-- #endif -->

        <!-- #ifdef H5 -->
        <!-- @vue-ignore: uni-data-picker 类型定义不完整，实际支持数组值 -->
        <uni-data-picker
          :localdata="regionData"
          popup-title="请选择所在地区"
          :value="regionPickerValue"
          @change="handleDataPickerChange"
        >
          <UFormItem label="所在地区" required :value="regionText" placeholder="请选择省市区" show-arrow />
        </uni-data-picker>
        <!-- #endif -->

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
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/modules/global';
import { useAddressStore } from '@/store/modules/address';
// #ifdef H5
import { regionData } from '@/constants';
// #endif

const globalStore = useGlobalStore();
const addressStore = useAddressStore();

// 表单数据
const formData = reactive({
  id: 0,
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  isDefault: false,
});

// 是否编辑模式
const isEdit = ref(false);

// 保存状态
const saving = ref(false);

// 地区文本
const regionText = computed(() => {
  if (formData.province && formData.city && formData.district) {
    return `${formData.province} ${formData.city} ${formData.district}`;
  }
  return '';
});

// 地区选择器值 (小程序用)
const regionValue = computed(() => {
  if (formData.province && formData.city && formData.district) {
    return [formData.province, formData.city, formData.district];
  }
  return [];
});

// #ifdef H5
// 地区选择器值 (H5 用 uni-data-picker)
const regionPickerValue = computed((): UniDataPickerValueArray => {
  if (formData.province && formData.city && formData.district) {
    return [formData.province, formData.city, formData.district];
  }
  return [];
});
// #endif

onLoad(options => {
  if (options?.id) {
    isEdit.value = true;
    loadAddressDetail(Number(options.id));
    // 动态设置页面标题
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
      formData.province = address.province;
      formData.city = address.city;
      formData.district = address.district;
      formData.address = address.address;
      formData.isDefault = address.isDefault;
    }
  } catch (error) {
    console.error('加载地址详情失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  }
}

// 地区选择变更 (小程序用)
function handleRegionChange(e: { detail: { value: string[] } }) {
  const [province, city, district] = e.detail.value;
  formData.province = province;
  formData.city = city;
  formData.district = district;
}

// #ifdef H5
// 地区选择变更 (H5 用 uni-data-picker)
interface DataPickerChangeEvent {
  detail: {
    value: Array<{ value: string; text: string }>;
  };
}
function handleDataPickerChange(e: DataPickerChangeEvent) {
  const values = e.detail.value;
  if (values && values.length >= 3) {
    // 正常三级：省/市/区
    formData.province = values[0].text;
    formData.city = values[1].text;
    formData.district = values[2].text;
  }
}
// #endif

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
    const addressData = {
      name: formData.name,
      phone: formData.phone,
      province: formData.province,
      city: formData.city,
      district: formData.district,
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
    uni.showToast({
      title: '保存失败',
      icon: 'none',
    });
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
          uni.showToast({
            title: '删除失败',
            icon: 'none',
          });
        }
      }
    },
  });
}
</script>

<style scoped lang="scss">
.address-edit-page {
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
