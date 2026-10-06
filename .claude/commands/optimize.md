---
description: Uni-app 性能优化提示，包含组件、API调用、分包优化等最佳实践
---

# Uni-app 性能优化最佳实践

在开始优化前，请先**测量性能**，找出真正的瓶颈，避免过早优化。

## 性能测量工具

### 1. 小程序开发者工具
```bash
# 微信开发者工具
- 调试器 > Performance 面板
- 调试器 > Audits 面板（体验评分）
- 调试器 > Memory 面板（内存分析）
```

### 2. H5 调试
```bash
# Chrome DevTools
- Performance 面板：录制性能
- Lighthouse：综合评分
- Network 面板：网络请求分析
```

### 3. 构建分析
```bash
# 查看各平台构建产物大小
pnpm build:h5 && du -sh dist/build/h5
pnpm build:mp-weixin && du -sh dist/build/mp-weixin
```

---

## 优化清单

### 1. 分包优化（小程序关键）

#### 1.1 合理划分分包

- 主包 `src/pages/`：TabBar 页面 + 高频页面（控制在 2MB 以内）
- 分包 `src/pages-sub/<name>/`：页面由 `@uni-helper/vite-plugin-uni-pages` 扫描并写入 `src/pages.json`，页面配置写在各页面的 `definePage({...})` 中
- 新增分包需同时在 `pages.config.ts` 与 `vite.config.ts` 的 `UniPages({ subPackages })` 中声明

```typescript
// pages.config.ts
export default defineUniPages({
  subPackages: [
    { root: 'pages-sub/order', pages: [] },
    { root: 'pages-sub/user', pages: [] },
    { root: 'pages-sub/other', pages: [] },
  ],
});
```

#### 1.2 分包预加载

```json
// pages.config.ts 的 defineUniPages 配置
{
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["pages-sub/order"]
    },
    "pages/mine/index": {
      "network": "wifi",
      "packages": ["pages-sub/user"]
    }
  }
}
```

---

### 2. 组件优化

#### 2.1 避免不必要的重新渲染

```typescript
// ❌ 每次父组件更新都会重新渲染
<template>
  <ChildComponent :data="expensiveComputation()" />
</template>

// ✅ 使用 computed 缓存
<template>
  <ChildComponent :data="computedData" />
</template>

<script setup lang="ts">
const computedData = computed(() => expensiveComputation());
</script>
```

#### 2.2 使用 v-show 代替 v-if（频繁切换场景）

```vue
<!-- ❌ 频繁切换时性能差 -->
<view v-if="visible">内容</view>

<!-- ✅ 频繁切换时性能好 -->
<view v-show="visible">内容</view>
```

#### 2.3 长列表优化

```vue
<!-- ✅ 使用 scroll-view + 虚拟列表 -->
<scroll-view
  scroll-y
  :scroll-top="scrollTop"
  @scrolltolower="loadMore"
>
  <view
    v-for="item in visibleItems"
    :key="item.id"
    :style="{ height: itemHeight + 'rpx' }"
  >
    {{ item.name }}
  </view>
</scroll-view>

<script setup lang="ts">
// 只渲染可见区域的数据
const visibleItems = computed(() => {
  const start = Math.floor(scrollTop.value / itemHeight);
  const end = start + visibleCount;
  return items.value.slice(start, end);
});
</script>
```

#### 2.4 骨架屏提升感知性能

```vue
<template>
  <view class="page">
    <!-- 骨架屏 -->
    <USkeleton v-if="loading" type="list" :rows="5" />

    <!-- 实际内容 -->
    <view v-else>
      <!-- 内容 -->
    </view>
  </view>
</template>
```

---

### 3. 图片优化

#### 3.1 图片懒加载

```vue
<!-- ✅ 使用 lazy-load 属性 -->
<image
  src="/static/images/banner.png"
  lazy-load
  mode="aspectFill"
/>

<!-- ✅ 使用 UImage 组件（内置懒加载） -->
<UImage
  src="/static/images/banner.png"
  width="750rpx"
  height="300rpx"
/>
```

#### 3.2 图片压缩和格式

```bash
# 推荐图片格式
- WebP：比 JPEG 小 25-35%
- PNG：透明图片
- JPEG：照片类图片

# 图片尺寸
- 根据实际显示尺寸裁剪，避免过大图片
- 提供 @2x 和 @3x 版本适配高清屏
```

#### 3.3 使用 CDN

```typescript
// ✅ 图片使用 CDN 地址
const imageUrl = 'https://cdn.example.com/images/banner.webp';

// ❌ 避免将大图片打包到项目中
import banner from '@/assets/images/large-banner.png';
```

---

### 4. API 调用优化

#### 4.1 使用 Pinia Store 缓存

```typescript
// ✅ Pinia Store 自动缓存
import { useUserStore } from '@/store/modules/user';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const { userInfo, loading } = storeToRefs(userStore);

// 数据已缓存，避免重复请求
```

#### 4.2 并行请求

```typescript
// ❌ 串行请求（慢）
const user = await getUserInfo();
const orders = await getOrderList();
const favorites = await getFavoriteList();

// ✅ 并行请求（快）
const [user, orders, favorites] = await Promise.all([
  getUserInfo(),
  getOrderList(),
  getFavoriteList(),
]);
```

#### 4.3 请求去重

```typescript
// ✅ Orval mutator 自动去重（已配置）
// 用户快速点击两次，第二次会复用第一次的请求
```

#### 4.4 数据预加载

```typescript
// ✅ 页面跳转前预加载数据
const goToDetail = async (id: string) => {
  // 先预加载数据到 Store
  await detailStore.prefetch(id);
  // 再跳转页面
  uni.navigateTo({ url: `/pages-sub/detail/index?id=${id}` });
};
```

---

### 5. 代码分割

#### 5.1 异步组件

```typescript
// ✅ 动态导入大组件
import { defineAsyncComponent } from 'vue';

const HeavyChart = defineAsyncComponent(() =>
  import('@/components/HeavyChart/index.vue')
);
```

#### 5.2 按需导入

```typescript
// ✅ 按需导入（推荐）
import { debounce } from 'lodash-es';

// ❌ 全量导入（避免）
import _ from 'lodash';
```

---

### 6. 运行时优化

#### 6.1 防抖和节流

```typescript
import { useDebounce, useThrottle } from '@/composables';

// 搜索输入防抖
const { debouncedFn: debouncedSearch } = useDebounce(search, 300);

// 滚动事件节流
const { throttledFn: throttledScroll } = useThrottle(handleScroll, 100);
```

#### 6.2 避免频繁 setData（小程序）

```typescript
// ❌ 频繁更新数据
items.value.forEach((item, index) => {
  items.value[index].checked = true;
});

// ✅ 批量更新
const newItems = items.value.map(item => ({
  ...item,
  checked: true,
}));
items.value = newItems;
```

#### 6.3 使用 Object.freeze 冻结静态数据

```typescript
// ✅ 冻结大数组/对象，避免响应式开销
const staticData = Object.freeze([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  // ... 大量静态数据
]);
```

---

### 7. 小程序特有优化

#### 7.1 减少 setData 数据量

```typescript
// ❌ 传输整个列表
items.value = newList;

// ✅ 只更新变化的数据
items.value[index] = newItem;
```

#### 7.2 合理使用 WXS（仅微信小程序）

```vue
<!-- 复杂的数据处理放到 WXS 中，减少逻辑层和视图层通信 -->
<wxs module="utils">
module.exports = {
  formatPrice: function(price) {
    return (price / 100).toFixed(2);
  }
}
</wxs>

<template>
  <text>{{ utils.formatPrice(price) }}</text>
</template>
```

#### 7.3 使用自定义组件

```vue
<!-- ✅ 使用自定义组件隔离更新范围 -->
<template>
  <view class="page">
    <Header />  <!-- 独立组件，不受列表更新影响 -->
    <List :items="items" />
    <Footer />  <!-- 独立组件，不受列表更新影响 -->
  </view>
</template>
```

---

## 性能目标

### 小程序性能指标

| 指标 | 目标 | 说明 |
|------|------|------|
| **主包大小** | < 2 MB | 影响启动速度 |
| **分包大小** | < 2 MB | 单个分包限制 |
| **总包大小** | < 20 MB | 所有包总大小 |
| **首屏时间** | < 3 s | 用户感知 |
| **setData 大小** | < 1 MB | 单次传输限制 |

### H5 性能指标

| 指标 | 目标 | 说明 |
|------|------|------|
| **FCP** | < 1.5 s | 首次内容绘制 |
| **LCP** | < 2.5 s | 最大内容绘制 |
| **TTI** | < 3.5 s | 可交互时间 |
| **JS 大小** | < 500 KB | Gzip 后 |
| **CSS 大小** | < 100 KB | Gzip 后 |

---

## 常见性能问题

### 问题 1: 首屏加载慢

**解决方案:**
- [ ] 分包加载
- [ ] 预加载分包
- [ ] 骨架屏
- [ ] 图片懒加载
- [ ] 精简主包

### 问题 2: 列表滚动卡顿

**解决方案:**
- [ ] 虚拟滚动
- [ ] 减少 DOM 节点
- [ ] 图片懒加载
- [ ] 避免复杂计算

### 问题 3: 页面切换慢

**解决方案:**
- [ ] 预加载分包
- [ ] 预加载数据
- [ ] 页面缓存（keep-alive）

### 问题 4: 内存泄漏

**解决方案:**
- [ ] 清理定时器（onUnload）
- [ ] 清理事件监听
- [ ] 避免循环引用

---

## 相关文档

- `@component-development` - 组件开发规范
- `@common-patterns` - 通用开发模式
- `@project-structure` - 项目结构

---

**记住：过早优化是万恶之源。先测量，再优化，最后验证效果。**
