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
      <view class="form-group">
        <view class="form-item">
          <text class="form-label required">收货人</text>
          <input v-model="formData.name" class="form-input" placeholder="请输入收货人姓名" :maxlength="20" />
        </view>

        <view class="form-item">
          <text class="form-label required">手机号</text>
          <input v-model="formData.phone" class="form-input" type="number" placeholder="请输入手机号" :maxlength="11" />
        </view>

        <view class="form-item" @click="handleChooseRegion">
          <text class="form-label required">所在地区</text>
          <view class="form-value">
            <text :class="{ placeholder: !regionText }">{{ regionText || '请选择省市区' }}</text>
            <text class="i-carbon-chevron-right" />
          </view>
        </view>

        <view class="form-item form-item-textarea">
          <text class="form-label required">详细地址</text>
          <textarea
            v-model="formData.detail"
            class="form-textarea"
            placeholder="请输入详细地址，如街道、门牌号等"
            :maxlength="100"
            :auto-height="true"
          />
        </view>
      </view>
    </view>

    <!-- 设为默认 -->
    <view class="default-section">
      <view class="default-item">
        <text class="default-label">设为默认地址</text>
        <switch :checked="formData.isDefault" color="#07c160" @change="handleDefaultChange" />
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="btn-section">
      <button class="save-btn" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中...' : '保存' }}
      </button>
      <button v-if="isEdit" class="delete-btn" @click="handleDelete">删除地址</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useGlobalStore } from '@/store/modules/global';

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

// 选择地区
function handleChooseRegion() {
  // #ifdef MP-WEIXIN
  uni.chooseLocation({
    success: () => {
      // 微信小程序可以使用地图选择
    },
    fail: () => {
      // 降级使用地区选择器
      showRegionPicker();
    },
  });
  // #endif

  // #ifndef MP-WEIXIN
  showRegionPicker();
  // #endif
}

// 显示地区选择器
function showRegionPicker() {
  // 使用 uni-app 内置的地区选择器
  uni.chooseLocation?.({
    success: (res: { address?: string }) => {
      // 解析地址
      if (res.address) {
        // 简单解析
        formData.province = res.address;
      }
    },
  });

  // 备用方案：使用 picker
  // 这里使用简单的三级联动模拟
  const provinces = ['广东省', '北京市', '上海市', '浙江省'];
  const cities: Record<string, string[]> = {
    广东省: ['深圳市', '广州市', '东莞市'],
    北京市: ['北京市'],
    上海市: ['上海市'],
    浙江省: ['杭州市', '宁波市', '温州市'],
  };
  const districts: Record<string, string[]> = {
    深圳市: ['南山区', '福田区', '罗湖区', '宝安区'],
    广州市: ['天河区', '越秀区', '海珠区'],
    杭州市: ['西湖区', '上城区', '滨江区'],
  };

  // 先选省
  uni.showActionSheet({
    itemList: provinces,
    success: res1 => {
      formData.province = provinces[res1.tapIndex];
      const cityList = cities[formData.province] || [];

      // 再选市
      uni.showActionSheet({
        itemList: cityList,
        success: res2 => {
          formData.city = cityList[res2.tapIndex];
          const districtList = districts[formData.city] || ['其他'];

          // 最后选区
          uni.showActionSheet({
            itemList: districtList,
            success: res3 => {
              formData.district = districtList[res3.tapIndex];
            },
          });
        },
      });
    },
  });
}

// 设置默认
function handleDefaultChange(e: { detail: { value: boolean } }) {
  formData.isDefault = e.detail.value;
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
  padding-bottom: calc($uni-safe-area-inset-bottom + 200rpx);
  background: var(--color-bg-grey);
}

// 表单区域
.form-section {
  padding: 24rpx;

  .form-group {
    overflow: hidden;
    border-radius: $uni-border-radius-lg;
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);

    .form-item {
      display: flex;
      align-items: center;
      padding: 32rpx;

      &:not(:last-child) {
        border-bottom: 1px solid var(--color-border-light);
      }

      .form-label {
        flex-shrink: 0;
        width: 160rpx;
        color: var(--color-text);
        font-size: 30rpx;

        &.required::before {
          content: '*';
          margin-right: 4rpx;
          color: var(--color-error);
        }
      }

      .form-input {
        flex: 1;
        color: var(--color-text);
        font-size: 30rpx;
      }

      .form-value {
        display: flex;
        flex: 1;
        gap: 8rpx;
        align-items: center;
        justify-content: flex-end;
        color: var(--color-text);
        font-size: 30rpx;

        .placeholder {
          color: var(--color-text-placeholder);
        }

        .i-carbon-chevron-right {
          color: var(--color-text-secondary);
          font-size: 28rpx;
        }
      }

      &.form-item-textarea {
        flex-direction: column;
        align-items: flex-start;
        gap: 16rpx;

        .form-label {
          width: auto;
        }

        .form-textarea {
          width: 100%;
          min-height: 120rpx;
          color: var(--color-text);
          font-size: 30rpx;
          line-height: 1.5;
        }
      }
    }
  }
}

// 默认地址
.default-section {
  padding: 0 24rpx;

  .default-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-radius: $uni-border-radius-lg;
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);

    .default-label {
      color: var(--color-text);
      font-size: 30rpx;
    }
  }
}

// 按钮区域
.btn-section {
  display: flex;
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  flex-direction: column;
  padding: 24rpx;
  padding-bottom: calc(24rpx + $uni-safe-area-inset-bottom);
  background: var(--color-bg);
  box-shadow: var(--shadow-light);
  gap: 16rpx;

  .save-btn {
    width: 100%;
    height: 96rpx;
    border: none;
    border-radius: $uni-border-radius-lg;
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-size: 32rpx;
    line-height: 96rpx;

    &[disabled] {
      opacity: 0.6;
    }

    &::after {
      display: none;
    }
  }

  .delete-btn {
    width: 100%;
    height: 96rpx;
    border: none;
    border-radius: $uni-border-radius-lg;
    background: var(--color-bg-grey);
    color: var(--color-error);
    font-size: 32rpx;
    line-height: 96rpx;

    &::after {
      display: none;
    }
  }
}
</style>
