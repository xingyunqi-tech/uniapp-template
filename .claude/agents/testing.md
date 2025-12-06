---
name: testing
description: 测试策略制定、测试用例编写、测试工具配置和质量保证
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
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'coverage'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: { branches: 80, functions: 80, lines: 80, statements: 80 },
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### 测试设置文件
```typescript
// tests/setup.ts
import { beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/vue';
import '@testing-library/jest-dom/vitest';

beforeAll(() => {
  // Mock全局对象
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

  // Mock Observer APIs
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

## 🧪 单元测试

### 工具函数测试
```typescript
// tests/utils/date.test.ts
import { describe, it, expect } from 'vitest';
import { DateUtils } from '@/utils/date';

describe('DateUtils', () => {
  describe('format', () => {
    it('应该正确格式化日期', () => {
      const date = new Date('2023-12-25 15:30:45');
      expect(DateUtils.format(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2023-12-25 15:30:45');
    });

    it('应该处理字符串日期和时间戳', () => {
      expect(DateUtils.format('2023-12-25', 'YYYY-MM-DD')).toBe('2023-12-25');
    });
  });

  describe('isToday', () => {
    it('应该正确判断今天', () => {
      expect(DateUtils.isToday(new Date())).toBe(true);
    });
  });
});
```

### Pinia Store 测试
```typescript
// tests/store/user.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/store/modules/user';
import { UserApi } from '@/api/modules/user';

vi.mock('@/api/modules/user');
const mockedUserApi = vi.mocked(UserApi);

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
    mockedUserApi.login.mockResolvedValueOnce({
      code: 200,
      data: { token: 'mock-token', userInfo: {}, permissions: [] },
    });

    const store = useUserStore();
    await store.login({ username: 'test', password: '123' });

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
- ✅ 使用MSW (Mock Service Worker) 模拟API响应
- ✅ 测试从 `@/api` 导入（不直接导入 `generated/`）
- ✅ 类型定义从 `@/api` 导入

**详细说明**: 参考 [@api-development.md#测试Orval生成的API](api-development.md#测试orval生成的api)

**完整测试示例**:
```typescript
// tests/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { postAuthLogin, getConfigValues } from '@/api';
import type { UserInfo } from '@/api';

// 设置MSW服务器 (详细配置见完整示例)
const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    // Mock登录逻辑
    return res(ctx.json({ token: 'mock-token', userInfo: {...} }));
  })
);

describe('API Integration Tests', () => {
  beforeAll(() => server.listen());
  afterAll(() => server.close());

  describe('Auth API (Orval Generated)', () => {
    it('应该成功登录', async () => {
      const result = await postAuthLogin({
        username: 'testuser',
        password: 'password123',
      });
      expect(result.token).toBe('mock-token-123');
    });
  });
});
```

**完整MSW配置**: 参考上述代码或查看 [testing.md 完整版本](testing.md#api-集成测试)

### 测试自动生成的API (Vitest Mock)

```typescript
// tests/api/generated.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postAuthLogin, getAuthUserInfo } from '@/api';

// ✅ 正确：Mock generated 模块
vi.mock('@/api/generated/auth/auth', () => ({
  postAuthLogin: vi.fn(),
  getAuthUserInfo: vi.fn(),
}));

describe('Generated API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该成功调用 postAuthLogin', async () => {
    const mockResponse = {
      token: 'test-token',
      userInfo: { username: 'test' },
    };

    vi.mocked(postAuthLogin).mockResolvedValue(mockResponse);

    const result = await postAuthLogin({
      username: 'test',
      password: '123',
    });

    expect(postAuthLogin).toHaveBeenCalledWith({
      username: 'test',
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
import { postAuthLogin as generatedLogin } from '@/api/generated/auth/auth';
import storage from '@/plugins/storage';

// Mock生成的API
vi.mock('@/api/generated/auth/auth');
// Mock storage
vi.mock('@/plugins/storage');

describe('Custom Auth API', () => {
  it('应该登录并保存token', async () => {
    const mockResponse = { token: 'test-token' };
    vi.mocked(generatedLogin).mockResolvedValue(mockResponse);

    await postAuthLogin({ username: 'test', password: '123' });

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
  postAuthLogin: vi.fn(),
  getAuthUserInfo: vi.fn(),
}));

describe('UserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loginAction 应该成功登录并保存用户信息', async () => {
    const mockResponse = {
      token: 'mock-token',
      userInfo: { id: 1, username: 'test' },
    };

    vi.mocked(api.postAuthLogin).mockResolvedValue(mockResponse);

    const store = useUserStore();
    await store.loginAction({ username: 'test', password: '123' });

    expect(store.token).toBe('mock-token');
    expect(store.userInfo).toEqual(mockResponse.userInfo);
  });

  it('fetchUserInfo 应该获取用户信息', async () => {
    const mockUserInfo = { id: 1, username: 'test', realName: 'Test User' };

    vi.mocked(api.getAuthUserInfo).mockResolvedValue(mockUserInfo);

    const store = useUserStore();
    await store.fetchUserInfo();

    expect(store.userInfo).toEqual(mockUserInfo);
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
  getAuthUserInfo: vi.fn(),
  postAuthLogin: vi.fn(),
}));

import { getAuthUserInfo, postAuthLogin } from '@/api';

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

    vi.mocked(getAuthUserInfo).mockResolvedValueOnce(mockUserInfo);

    const wrapper = mount(UserManagement, {
      global: { plugins: [createPinia()] },
    });

    await wrapper.vm.$nextTick();

    expect(getAuthUserInfo).toHaveBeenCalled();
    expect(wrapper.text()).toContain('testuser');
  });

  it('应该处理登录操作', async () => {
    const mockResponse = {
      token: 'mock-token',
      userInfo: { username: 'test' },
    };

    vi.mocked(postAuthLogin).mockResolvedValueOnce(mockResponse);

    const wrapper = mount(UserManagement);

    // 模拟登录
    await wrapper.find('[data-testid="username-input"]').setValue('test');
    await wrapper.find('[data-testid="password-input"]').setValue('123');
    await wrapper.find('[data-testid="login-button"]').trigger('click');

    expect(postAuthLogin).toHaveBeenCalledWith({
      username: 'test',
      password: '123',
    });
    expect(showToast).toHaveBeenCalledWith('登录成功');
  });
});
```
## 📊 测试覆盖率配置

```typescript
// vitest.config.ts 中的覆盖率配置
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: { branches: 80, functions: 80, lines: 80, statements: 80 },
        'src/utils/': { branches: 90, functions: 90, lines: 90, statements: 90 },
      },
      exclude: ['coverage/**', 'dist/**', '**/*.d.ts', 'src/main.ts', '**/*.config.*'],
    },
  },
});
```

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
  const result = await UserApi.getUserList();
  expect(result.code).toBe(200);
});

// ✅ 测试Promise拒绝
it('应该处理错误', async () => {
  mockedApi.getUserList.mockRejectedValueOnce(new Error('错误'));
  await expect(UserApi.getUserList()).rejects.toThrow('错误');
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
