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
            v-model="formData.detail"
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
import { UMenuGroup, UMenuItem, UFormItem, UFixedButton } from '@/components';
// #ifdef H5
import { regionData } from '@/constants';
// #endif

const globalStore = useGlobalStore();

// 表单数据
const formData = reactive({
  id: 0,
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
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
function loadAddressDetail(id: number) {
  // TODO: 调用实际的 API 获取地址详情
  // 模拟数据
  const mockData: Record<
    number,
    {
      id: number;
      name: string;
      phone: string;
      province: string;
      city: string;
      district: string;
      detail: string;
      isDefault: boolean;
    }
  > = {
    1: {
      id: 1,
      name: '张三',
      phone: '13888888888',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detail: '科技园南路88号',
      isDefault: true,
    },
    2: {
      id: 2,
      name: '李四',
      phone: '13999999999',
      province: '广东省',
      city: '深圳市',
      district: '福田区',
      detail: '福田中心区68号',
      isDefault: false,
    },
  };

  const data = mockData[id];
  if (data) {
    Object.assign(formData, data);
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
  if (!formData.detail.trim()) {
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
    // TODO: 调用实际的 API 保存地址
    // if (isEdit.value) {
    //   await updateAddress(formData);
    // } else {
    //   await createAddress(formData);
    // }

    // 模拟保存成功
    await new Promise(resolve => setTimeout(resolve, 1000));

    uni.showToast({
      title: '保存成功',
      icon: 'success',
    });

    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch {
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
          // TODO: 调用实际的 API 删除地址
          // await deleteAddress(formData.id);

          // 模拟删除成功
          await new Promise(resolve => setTimeout(resolve, 500));

          uni.showToast({
            title: '删除成功',
            icon: 'success',
          });

          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } catch {
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

  .form-textarea {
    width: 100%;
    min-height: 120rpx;
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: 1.5;
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
