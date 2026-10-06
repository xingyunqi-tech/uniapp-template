# 测试指南

## 概述

本项目使用 Vitest 进行单元测试，专注于核心逻辑层（API、Store、Utils）的测试覆盖。

## 测试技术栈

- **测试框架**: [Vitest](https://vitest.dev/) - 快速的 Vite 原生测试框架
- **Vue测试工具**: [@vue/test-utils](https://test-utils.vuejs.org/) - Vue 3 官方测试工具
- **测试环境**: [jsdom](https://github.com/jsdom/jsdom) - 浏览器环境模拟
- **覆盖率工具**: [@vitest/coverage-v8](https://vitest.dev/guide/coverage.html) - V8 覆盖率报告
- **UI界面**: [@vitest/ui](https://vitest.dev/guide/ui.html) - 可视化测试界面

## 快速开始

### 运行测试
```bash
# 运行所有测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage

# 打开可视化测试界面
pnpm test:ui
```

## 目录结构

```
tests/
├── README.md          # 测试指南文档
├── setup.ts           # 测试环境设置
├── api/               # API 层测试
├── store/             # Store 状态管理测试
└── utils/             # 工具函数测试
```

## 测试示例

### Store 测试
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/store/modules/user';

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('初始状态应该正确', () => {
    const store = useUserStore();
    expect(store.isLoggedIn).toBe(false);
    expect(store.token).toBe('');
  });
});
```

### 工具函数测试
```typescript
import { describe, it, expect } from 'vitest';
import { storage } from '@/utils/storage';

describe('storage', () => {
  it('应该能够设置和获取数据', () => {
    storage.set('test', 'value');
    expect(storage.get('test')).toBe('value');
  });
});
```

## 覆盖率配置

覆盖率目标为 80%（分支、函数、行、语句），`vitest.config.ts` 未配置强制阈值。

覆盖率报告（text/json/html）生成在 `./coverage` 目录下，`src/api/generated/` 不计入覆盖率。

## 测试最佳实践

### 1. 测试命名规范
```typescript
describe('模块名称', () => {
  describe('功能分组', () => {
    it('应该 + 期望行为', () => {
      // 测试实现
    });
  });
});
```

### 2. AAA模式
```typescript
it('应该正确计算总价', () => {
  // Arrange - 准备数据
  const items = [{ price: 10 }, { price: 20 }];

  // Act - 执行操作
  const total = calculateTotal(items);

  // Assert - 验证结果
  expect(total).toBe(30);
});
```

### 3. 测试隔离
- 每个测试用例独立运行
- 使用 `beforeEach` 重置状态
- 避免测试间的相互依赖

## 参考资源

- [Vitest 官方文档](https://vitest.dev/)
- [Vue Test Utils 文档](https://test-utils.vuejs.org/)
- [Vue 3 测试指南](https://vuejs.org/guide/scaling-up/testing.html)
