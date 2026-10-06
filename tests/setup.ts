/**
 * Vitest 测试环境设置文件
 * @description 配置测试环境的全局设置和Mock
 */

import { vi, afterEach } from 'vitest';
import { config } from '@vue/test-utils';

// 配置Vue Test Utils全局设置
config.global.stubs = {
  // 全局组件存根
};

// Mock uni 全局对象：存储为内存实现，交互与网络 API 打桩，单个测试按需 mockImplementation
const uniStorage = new Map<string, unknown>();

vi.stubGlobal('uni', {
  getStorageSync: vi.fn((key: string) => (uniStorage.has(key) ? uniStorage.get(key) : '')),
  setStorageSync: vi.fn((key: string, value: unknown) => {
    uniStorage.set(key, value);
  }),
  removeStorageSync: vi.fn((key: string) => {
    uniStorage.delete(key);
  }),
  request: vi.fn(),
  showToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  redirectTo: vi.fn(),
  navigateTo: vi.fn(),
  addInterceptor: vi.fn(),
  getDeviceInfo: vi.fn(() => ({})),
  getAppBaseInfo: vi.fn(() => ({})),
});

vi.stubGlobal(
  'getCurrentPages',
  vi.fn(() => []),
);

// Mock全局对象
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock CSS变量
Object.defineProperty(document.documentElement, 'style', {
  value: {
    setProperty: vi.fn(),
    getPropertyValue: vi.fn(() => ''),
    removeProperty: vi.fn(),
  },
});

// Mock localStorage with actual implementation
const createStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 全局测试工具函数
declare global {
  var mockFetch: typeof vi.fn;
  var mockLocalStorage: typeof localStorageMock;
}

globalThis.mockFetch = fetch as unknown as typeof vi.fn;
globalThis.mockLocalStorage = localStorageMock;

/**
 * ==================== 全局错误处理 ====================
 * 处理测试中预期的unhandled rejection
 */

// 存储原始的unhandledrejection处理器
const originalUnhandledRejection = process.listeners('unhandledRejection')[0];

// 添加自定义处理器来过滤预期的401错误
process.on('unhandledRejection', (reason: unknown) => {
  // 检查是否是预期的 401 错误（测试中故意触发的）
  if (reason && typeof reason === 'object' && 'status' in reason && reason.status === 401) {
    // 忽略预期的401错误 - 这些是测试中故意触发的
    return;
  }

  // 对于其他错误，使用原始处理器或默认行为
  if (originalUnhandledRejection) {
    (originalUnhandledRejection as any)(reason);
  } else {
    console.error('Unhandled Rejection:', reason);
  }
});

// 每个测试后清理 localStorage
afterEach(() => {
  // 清理 localStorage
  localStorageMock.clear();
  uniStorage.clear();
});
