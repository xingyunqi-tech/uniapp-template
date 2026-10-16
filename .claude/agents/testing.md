---
name: testing
description: 测试策略制定、测试用例编写、测试工具配置和质量保证
tools: Read, Grep, Glob, WebFetch, WebSearch
model: inherit
---

# 测试指导 Agent

## 职责
专门负责测试策略制定、测试用例编写、测试工具配置和质量保证，为AI生成高质量的测试代码提供专业指导。

## 🎯 测试策略

### 1. 测试金字塔
```
    /\
   /E2E\     <- 少量端到端测试
  /______\
 /        \
/Integration\ <- 适量集成测试
/____________\
/            \
/  Unit Tests  \ <- 大量单元测试
/________________\
```

### 2. 测试分类
- **单元测试**: 测试独立的函数、组件和模块
- **集成测试**: 测试组件间的交互和API集成
- **端到端测试**: 测试完整的用户流程
- **视觉回归测试**: 测试UI的视觉一致性

### 3. 测试原则
- **快速反馈**: 测试应该快速执行并提供即时反馈
- **可靠性**: 测试结果应该稳定可重复
- **可维护性**: 测试代码应该易于理解和维护
- **覆盖率**: 关键业务逻辑应该有充分的测试覆盖

## 🛠️ 测试工具配置

### Vitest 配置
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/unpackage/**'],
    setupFiles: ['./tests/setup.ts'],
    server: {
      deps: {
        inline: ['@alova/adapter-uniapp'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: ['node_modules/', 'tests/', 'dist/', '**/*.d.ts', '**/*.config.*', 'scripts/', 'src/api/generated/**'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

### 测试设置文件

`tests/setup.ts` 用 `vi.stubGlobal('uni', {...})` 模拟 `uni` 全局对象（存储为内存实现，`request`、`showToast`、`showLoading`、`redirectTo` 等为 `vi.fn()`），并模拟 `window.matchMedia`，测试中按需 `mockImplementation`。

## 🧪 单元测试

### 工具函数测试
```typescript
// tests/utils/datetime.test.ts
import { describe, it, expect } from 'vitest';
import { formatDateTime, str2Date } from '@/utils/datetime';

describe('formatDateTime', () => {
  it('按格式输出日期', () => {
    const date = new Date('2023-12-25 15:30:45');
    expect(formatDateTime(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2023-12-25 15:30:45');
  });

  it('支持字符串日期', () => {
    expect(formatDateTime('2023-12-25', 'YYYY-MM-DD')).toBe('2023-12-25');
  });
});

describe('str2Date', () => {
  it('无法解析时返回 null', () => {
    expect(str2Date('invalid')).toBeNull();
  });
});
```

### Pinia Store 测试
```typescript
// tests/store/user.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/store/modules/user';
import { loginWithPhone, type User } from '@/api';

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  loginWithPhone: vi.fn(),
}));
const mockedLogin = vi.mocked(loginWithPhone);

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Uni-app 环境下清理存储
    uni.clearStorageSync();
  });

  it('应该有正确的初始状态', () => {
    const store = useUserStore();
    expect(store.token).toBe('');
    expect(store.isLoggedIn).toBe(false);
  });

  it('应该成功登录并更新状态', async () => {
    mockedLogin.mockResolvedValueOnce({
      token: 'mock-token',
      refreshToken: 'mock-refresh',
      tokenExpires: Date.now() + 3600_000,
      user: { id: 1, phone: '13800000000', nickname: 'test' } as User,
    });

    const store = useUserStore();
    await store.login({ phone: '13800000000', password: '123456' });

    expect(store.token).toBe('mock-token');
    expect(store.isLoggedIn).toBe(true);
  });

  it('应该成功登出并清理状态', async () => {
    const store = useUserStore();
    store.token = 'test-token';
    await store.logout();

    expect(store.token).toBe('');
    expect(store.isLoggedIn).toBe(false);
  });
});
```

### Vue 组件测试
```typescript
// tests/components/BaseInput.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseInput from '@/components/BaseInput/index.vue';

describe('BaseInput', () => {
  const mockProps = {
    modelValue: '',
    label: '用户名',
    placeholder: '请输入用户名',
  };

  it('应该正确渲染组件', () => {
    const wrapper = mount(BaseInput, { props: mockProps });
    expect(wrapper.find('label').text()).toBe('用户名');
    expect(wrapper.find('input').attributes('placeholder')).toBe('请输入用户名');
  });

  it('应该正确显示错误信息', () => {
    const wrapper = mount(BaseInput, {
      props: { ...mockProps, error: '用户名不能为空' },
    });
    expect(wrapper.find('.error-message').text()).toBe('用户名不能为空');
  });

  it('应该正确触发输入事件', async () => {
    const wrapper = mount(BaseInput, { props: mockProps });
    await wrapper.find('input').setValue('test-user');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test-user']);
  });
});
```

## 🔗 集成测试

### API 集成测试 (基于Orval自动生成)

**重要**: 项目使用Orval自动生成API，详细架构说明参考 [@api-development.md](api-development.md)

**核心测试策略**:
- ✅ 使用 `vi.mock` 模拟 API 模块，或模拟 `uni.request` 测试请求层（见 `tests/api/`）
- ✅ 测试从 `@/api` 导入（不直接导入 `generated/`）
- ✅ 类型定义从 `@/api` 导入

**详细说明**: 参考 [@api-development.md#测试Orval生成的API](api-development.md#测试orval生成的api)

### 测试自动生成的API (Vitest Mock)

```typescript
// tests/api/generated.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginWithPhone, getCurrentUser } from '@/api';

// ✅ 正确：Mock generated 模块
vi.mock('@/api/generated/auth/auth', () => ({
  loginWithPhone: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe('Generated API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该成功调用 loginWithPhone', async () => {
    const mockResponse = {
      token: 'test-token',
      refreshToken: 'test-refresh-token',
      tokenExpires: 0,
      user: { id: '1', phone: '13800138000' },
    };

    vi.mocked(loginWithPhone).mockResolvedValue(mockResponse);

    const result = await loginWithPhone({
      phone: '13800138000',
      password: '123',
    });

    expect(loginWithPhone).toHaveBeenCalledWith({
      phone: '13800138000',
      password: '123',
    });
    expect(result).toEqual(mockResponse);
  });
});
```

### 测试自定义API (Custom)

```typescript
// tests/api/custom.test.ts
import { describe, it, expect, vi } from 'vitest';
import { loginWithPhone as generatedLogin } from '@/api/generated/auth/auth';
import { loginWithPhone } from '@/api';

// Mock生成的API
vi.mock('@/api/generated/auth/auth');

describe('Custom Auth API', () => {
  it('应该登录并保存token', async () => {
    const mockResponse = { token: 'test-token' };
    vi.mocked(generatedLogin).mockResolvedValue(mockResponse);

    await loginWithPhone({ phone: '13800138000', password: '123' });

    expect(generatedLogin).toHaveBeenCalled();
    expect(uni.setStorageSync).toHaveBeenCalledWith(
      'token',
      'test-token'
    );
  });
});
```

### 测试 Store Actions（使用 Pinia）

```typescript
// tests/store/user.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/store/modules/user';
import * as api from '@/api';

// Mock API
vi.mock('@/api', () => ({
  loginWithPhone: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe('UserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('login 应该成功登录并保存 Token', async () => {
    const mockResponse = {
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      tokenExpires: 0,
      user: { id: '1', phone: '13800138000' },
    };

    vi.mocked(api.loginWithPhone).mockResolvedValue(mockResponse);

    const store = useUserStore();
    await store.login({ phone: '13800138000', password: '123' });

    expect(store.token).toBe('mock-token');
    expect(store.isLoggedIn).toBe(true);
  });

  it('getUserInfo 应该获取用户信息', async () => {
    const mockUser = { id: '1', phone: '13800138000', nickname: 'Test User' };

    vi.mocked(api.getCurrentUser).mockResolvedValue(mockUser);

    const store = useUserStore();
    store.setToken('mock-token');
    await store.getUserInfo();

    expect(store.userInfo?.nickname).toBe('Test User');
  });
});
```

### 组件集成测试 (使用Orval生成的API)

```typescript
// tests/integration/user-management.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import UserManagement from '@/pages-sub/user/profile/index.vue';

// ✅ Mock generated API
vi.mock('@/api/generated/auth/auth', () => ({
  getCurrentUser: vi.fn(),
  loginWithPhone: vi.fn(),
}));

import { getCurrentUser, loginWithPhone } from '@/api';

// Mock Uni-app Toast
vi.mock('@/utils/toast', () => ({
  showToast: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { showToast } from '@/utils/toast';

describe('UserManagement Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('应该正确加载和显示用户信息', async () => {
    const mockUserInfo = {
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user'],
    };

    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUserInfo);

    const wrapper = mount(UserManagement, {
      global: { plugins: [createPinia()] },
    });

    await wrapper.vm.$nextTick();

    expect(getCurrentUser).toHaveBeenCalled();
    expect(wrapper.text()).toContain('testuser');
  });

  it('应该处理登录操作', async () => {
    const mockResponse = {
      token: 'mock-token',
      userInfo: { username: 'test' },
    };

    vi.mocked(loginWithPhone).mockResolvedValueOnce(mockResponse);

    const wrapper = mount(UserManagement);

    // 模拟登录
    await wrapper.find('[data-testid="username-input"]').setValue('test');
    await wrapper.find('[data-testid="password-input"]').setValue('123');
    await wrapper.find('[data-testid="login-button"]').trigger('click');

    expect(loginWithPhone).toHaveBeenCalledWith({
      phone: 'test',
      password: '123',
    });
    expect(showToast).toHaveBeenCalledWith('登录成功');
  });
});
```
## 📊 测试覆盖率配置

覆盖率配置见上方 `vitest.config.ts` 的 `coverage` 字段（v8，排除 `src/api/generated/**` 等），阈值为语句/分支/函数/行 70/68/67/70，低于阈值时 `pnpm test:coverage` 与 CI 的 Check 失败。运行 `pnpm test:coverage` 生成报告到 `coverage/`。

## 🎯 常见测试场景

### 测试API错误处理
```typescript
describe('API Error Handling', () => {
  it('应该处理网络错误', async () => {
    mockedApi.getUserList.mockRejectedValueOnce(new Error('Network Error'));

    const result = await service.fetchUsers();

    expect(result.error).toBe('网络连接失败');
    expect(showFailToast).toHaveBeenCalled();
  });

  it('应该处理401错误并跳转登录', async () => {
    const mockRouter = { push: vi.fn() };
    mockedApi.getUserList.mockRejectedValueOnce({
      response: { status: 401 },
    });

    await service.fetchUsers();

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('应该处理500错误', async () => {
    mockedApi.getUserList.mockRejectedValueOnce({
      response: { status: 500, data: { message: '服务器错误' } },
    });

    await service.fetchUsers();

    expect(showFailToast).toHaveBeenCalledWith('服务器错误');
  });
});
```

### 测试表单验证
```typescript
describe('Form Validation', () => {
  it('应该验证必填字段', async () => {
    const wrapper = mount(UserForm);

    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('.error-message').text()).toContain('不能为空');
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  it('应该验证邮箱格式', async () => {
    const wrapper = mount(UserForm);

    await wrapper.find('[name="email"]').setValue('invalid-email');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('.error-message').text()).toContain('邮箱格式不正确');
  });

  it('应该在验证通过后提交', async () => {
    const wrapper = mount(UserForm);

    await wrapper.find('[name="username"]').setValue('testuser');
    await wrapper.find('[name="email"]').setValue('test@example.com');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('submit')).toBeTruthy();
    expect(wrapper.emitted('submit')?.[0]).toEqual([
      expect.objectContaining({
        username: 'testuser',
        email: 'test@example.com',
      }),
    ]);
  });
});
```

### 测试无限滚动加载功能
```typescript
describe('InfiniteScroll', () => {
  it('应该加载第一页数据', async () => {
    mockedApi.getUserList.mockResolvedValueOnce({
      code: 200,
      data: [{ id: '1', username: 'user1' }],
      total: 10,
      current: 1,
    });

    const wrapper = mount(UserList);
    await wrapper.vm.$nextTick();

    expect(mockedApi.getUserList).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });

  it('应该触发加载更多', async () => {
    const wrapper = mount(UserList);

    // 触发 scroll-view 的 scrolltolower 事件
    await wrapper.find('.scroll-view').trigger('scrolltolower');

    expect(mockedApi.getUserList).toHaveBeenCalledWith({ page: 2, pageSize: 20 });
  });

  it('应该触发下拉刷新', async () => {
    const wrapper = mount(UserList);

    // 触发 scroll-view 的 refresherrefresh 事件
    await wrapper.find('.scroll-view').trigger('refresherrefresh');

    expect(mockedApi.getUserList).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });
});
```

## 📋 测试最佳实践

### 测试命名规范
```typescript
// ✅ 好的测试命名
describe('UserService', () => {
  it('应该成功创建用户并返回用户信息', () => {});
  it('应该在邮箱已存在时抛出错误', () => {});
});

// ❌ 不好的测试命名
describe('UserService', () => {
  it('test1', () => {});
  it('creates user', () => {});
});
```

### 测试数据管理
```typescript
// tests/fixtures/user.ts
export const createMockUser = (overrides: Partial<IUserInfo> = {}): IUserInfo => ({
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  ...overrides,
});
```

### 异步测试和Mock
```typescript
// ✅ 异步测试
it('应该正确处理异步操作', async () => {
  const result = await getUsers({ page: 1, limit: 10 });
  expect(result.data).toBeDefined();
});

// ✅ 测试Promise拒绝
it('应该处理错误', async () => {
  vi.mocked(getUsers).mockRejectedValueOnce(new Error('错误'));
  await expect(getUsers()).rejects.toThrow('错误');
});

// ✅ Mock使用
beforeEach(() => vi.clearAllMocks());

it('应该调用API', async () => {
  mockedApi.getUserList.mockResolvedValueOnce({ code: 200, data: [] });
  await service.getUsers();
  expect(mockedApi.getUserList).toHaveBeenCalled();
});
```

---

通过遵循这些测试规范和最佳实践,可以构建出高质量、可维护的测试套件,确保代码质量和系统稳定性。
