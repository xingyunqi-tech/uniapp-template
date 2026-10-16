---
name: store-development
description: Uni-app Pinia状态管理开发指导，包括Store设计原则、状态组织和最佳实践
tools: Read, Grep, Glob, WebFetch, WebSearch
model: inherit
---

# Uni-app Store 状态管理规范

## 职责
专门负责 Uni-app 项目的 Pinia 状态管理开发指导，包括 Store 设计原则、状态组织、最佳实践和性能优化。

> **重要**: Uni-app 项目使用 `uni.setStorageSync` / `uni.getStorageSync` 进行存储，而非 `localStorage`。
>
> **通用模式参考**: 本文档中使用的通用开发模式详见 [common-patterns.md](common-patterns.md)，包括:
> - [Props 定义规范](common-patterns.md#props-定义规范) - TypeScript 类型定义模式
> - [错误处理模式](common-patterns.md#错误处理模式) - 异步函数错误处理

---

## 🎯 Store设计原则

### 1. 单一职责原则
- **模块化**: 每个Store负责一个业务领域
- **职责清晰**: State、Getters、Actions职责分明
- **避免冗余**: 不同Store间避免状态重复

### 2. 类型安全原则
- **完整类型**: 所有状态都有明确的TypeScript类型
- **类型推导**: 充分利用TypeScript的类型推导
- **避免any**: 不使用any类型

### 3. 性能优化原则
- **按需持久化**: 只持久化必要的状态
- **计算属性**: 使用computed缓存派生状态
- **避免深层嵌套**: State结构扁平化

## 📁 Store架构设计

### 目录结构
```
src/store/
├── index.ts                    # Store统一导出
├── plugins/                    # Store 插件
│   └── persist.ts             # 持久化插件配置
└── modules/                    # Store模块
    ├── user.ts                # 用户状态 (登录、权限)
    └── global.ts              # 全局状态 (主题、语言)
```

## 🛠️ Store开发模板

### 用户Store示例
```typescript
// store/modules/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginWithPhone, logout } from '@/api';

/**
 * 用户状态管理Store
 * 管理用户登录状态、token、角色等信息
 */
export const useUserStore = defineStore(
  'user',
  () => {
    // ==================== 状态定义 ====================
    /** 用户Token */
    const token = ref<string>('');
    /** 用户ID */
    const id = ref<string>('');
    /** 用户名 */
    const name = ref<string>('');
    /** 用户邮箱 */
    const email = ref<string>('');
    /** 用户头像 */
    const avatar = ref<string>('');
    /** 用户角色列表 */
    const roles = ref<string[]>([]);

    // ==================== 计算属性 ====================
    /** 是否已登录 */
    const isLoggedIn = computed(() => !!token.value);

    /** 是否为管理员 */
    const isAdmin = computed(() => roles.value.includes('admin'));

    // ==================== Actions ====================
    /**
     * 设置Token值
     */
    const setTokenValue = (tokenValue: string) => {
      token.value = tokenValue;
    };

    /**
     * 设置用户ID
     */
    const setId = (idValue: string) => {
      id.value = idValue;
    };

    /**
     * 设置用户名
     */
    const setName = (nameValue: string) => {
      name.value = nameValue;
    };

    /**
     * 设置用户邮箱
     */
    const setEmail = (emailValue: string) => {
      email.value = emailValue;
    };

    /**
     * 设置用户头像
     */
    const setAvatar = (avatarValue: string) => {
      avatar.value = avatarValue;
    };

    /**
     * 设置用户角色
     */
    const setRoles = (rolesValue: string[]) => {
      roles.value = rolesValue;
    };

    /**
     * 登录操作
     */
    const loginAction = async (userInfo: { phone: string; password: string }) => {
      const phone = userInfo.phone.trim();
      try {
        const response = await loginWithPhone({ phone, password: userInfo.password });
        const tokenStr = response.token;
        if (!tokenStr) {
          return Promise.reject(new Error('登录失败：未获取到token'));
        }
        setTokenValue(tokenStr);
        // ✅ Uni-app: 使用 uni.setStorageSync 保存 token
        uni.setStorageSync('token', tokenStr);
        return Promise.resolve(tokenStr);
      } catch (error) {
        return Promise.reject(error);
      }
    };

    /**
     * 获取用户信息
     */
    const getInfoAction = async () => {
      try {
        // 这里应该调用获取用户信息的接口
        const mockUserInfo = {
          id: id.value || 'user_123',
          username: name.value || '管理员',
          email: email.value || 'admin@example.com',
          roles: ['admin'],
          icon: '',
        };

        if (mockUserInfo.roles && mockUserInfo.roles.length > 0) {
          setRoles(mockUserInfo.roles);
        } else {
          throw new Error('getInfo: roles must be a non-null array!');
        }
        setId(mockUserInfo.id);
        setName(mockUserInfo.username);
        setEmail(mockUserInfo.email);
        setAvatar(mockUserInfo.icon || '');
        return Promise.resolve(mockUserInfo);
      } catch (error) {
        return Promise.reject(error);
      }
    };

    /**
     * 退出登录
     */
    const logoutAction = async () => {
      try {
        await logout();
        setTokenValue('');
        setId('');
        setName('');
        setEmail('');
        setAvatar('');
        setRoles([]);
        // ✅ Uni-app: 使用 uni.removeStorageSync 清除 token
        uni.removeStorageSync('token');
        return Promise.resolve();
      } catch {
        // 即使接口调用失败，也要清除本地状态
        setTokenValue('');
        setId('');
        setName('');
        setEmail('');
        setAvatar('');
        setRoles([]);
        uni.removeStorageSync('token');
        return Promise.resolve();
      }
    };

    return {
      // 状态
      token,
      id,
      name,
      email,
      avatar,
      roles,
      // 计算属性
      isLoggedIn,
      isAdmin,
      // Actions
      setTokenValue,
      setId,
      setName,
      setEmail,
      setAvatar,
      setRoles,
      loginAction,
      getInfoAction,
      logoutAction,
    };
  },
  {
    persist: true,
  },
);
```

### 全局Store示例
```typescript
// store/modules/global.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DEFAULT_LOCALE, DEFAULT_THEME_STYLE } from '@/constants/system';
import type { LocaleType, ThemeType } from '@/constants';

export const useGlobalStore = defineStore(
  'global',
  () => {
    // ==================== 语言相关 ====================
    const currentLocale = ref<LocaleType>(DEFAULT_LOCALE as LocaleType);

    /**
     * 切换语言
     */
    const switchLocale = (locale: LocaleType) => {
      currentLocale.value = locale;
    };

    /**
     * 初始化语言设置
     */
    const initLocale = () => {
      if (!currentLocale.value) {
        currentLocale.value = DEFAULT_LOCALE as LocaleType;
      }
    };

    // ==================== 主题相关 ====================
    const currentTheme = ref<ThemeType>(DEFAULT_THEME_STYLE as ThemeType);

    /**
     * 切换主题
     */
    const toggleTheme = () => {
      const newTheme: ThemeType = currentTheme.value === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    };

    /**
     * 设置主题
     */
    const setTheme = (theme: ThemeType) => {
      currentTheme.value = theme;
    };

    /**
     * 初始化主题
     */
    const initTheme = () => {
      if (!currentTheme.value) {
        currentTheme.value = DEFAULT_THEME_STYLE as ThemeType;
      }
    };

    // ==================== 高级模式相关 ====================
    const advanceMode = ref<boolean>(false);
    const clickCount = ref<number>(0);
    const clickTimer = ref<NodeJS.Timeout | null>(null);

    /**
     * 切换高级模式
     */
    const toggleAdvanceMode = () => {
      advanceMode.value = !advanceMode.value;
    };

    /**
     * 处理Logo连续点击逻辑
     */
    const handleLogoClick = (onAdvanceModeToggle?: (isEnabled: boolean) => void) => {
      clickCount.value++;

      if (clickTimer.value) {
        clearTimeout(clickTimer.value);
      }

      if (clickCount.value === 5) {
        toggleAdvanceMode();
        onAdvanceModeToggle?.(advanceMode.value);
        clickCount.value = 0;
        return;
      }

      clickTimer.value = setTimeout(() => {
        clickCount.value = 0;
      }, 500);
    };

    return {
      // 语言相关
      currentLocale,
      switchLocale,
      initLocale,

      // 主题相关
      currentTheme,
      toggleTheme,
      setTheme,
      initTheme,

      // 高级模式相关
      advanceMode,
      handleLogoClick,
    };
  },
  {
    persist: true,
  },
);
```

## 📖 Store开发最佳实践

### 1. 状态定义规范
```typescript
// ✅ 正确：明确的类型定义
const token = ref<string>('');
const userInfo = ref<IUserInfo | null>(null);
const roles = ref<string[]>([]);

// ❌ 错误：缺少类型定义
const token = ref('');
const userInfo = ref(null);
const roles = ref([]);
```

### 2. Computed使用规范
```typescript
// ✅ 正确：使用computed缓存派生状态
const isLoggedIn = computed(() => !!token.value);
const hasAdminRole = computed(() => roles.value.includes('admin'));

// ❌ 错误：每次调用都重新计算
const getIsLoggedIn = () => !!token.value;
```

### 3. Actions命名规范
```typescript
// ✅ 正确：清晰的Action命名
const loginAction = async (credentials: AuthPhoneLoginDto) => {
  // 登录逻辑
};

const logoutAction = async () => {
  // 登出逻辑
};

// ❌ 错误：不清晰的命名
const doLogin = async (data: any) => {
  // 登录逻辑
};
```

### 4. 状态重置规范
```typescript
// ✅ 正确：提供重置方法
const resetUserState = () => {
  token.value = '';
  id.value = '';
  name.value = '';
  email.value = '';
  avatar.value = '';
  roles.value = [];
};

// 在退出登录时调用
const logoutAction = async () => {
  try {
    await LogoutService.logout();
  } finally {
    resetUserState();
  }
};
```

### 5. 持久化配置

**核心原则**: 使用 `pinia-plugin-persistedstate` 插件，全局存储适配器为 `src/store/plugins/persist.ts` 中的 `uniStorage`（基于 `uni.setStorageSync`）

#### 5.1 基础配置
```typescript
// ✅ 配置1: 持久化所有状态（最简单）
export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('');
    const userInfo = ref<UserInfo | null>(null);
    // ... 其他状态和方法
    return { token, userInfo };
  },
  {
    persist: true, // 持久化所有返回的状态
  },
);
```

#### 5.2 选择性持久化 - pick（推荐）
```typescript
// ✅ 配置2: 只持久化指定字段（推荐）
export const useCompetitionStore = defineStore(
  'competition',
  () => {
    const competitionList = ref<CompetitionDTO[]>([]);
    const currentCompetition = ref<CompetitionDTO | null>(null);
    const total = ref<number>(0);
    const loading = ref<boolean>(false);
    // ... 其他状态和方法

    return {
      competitionList,
      currentCompetition,
      total,
      loading
    };
  },
  {
    persist: {
      pick: ['currentCompetition'], // 只持久化当前竞赛详情
      // 不持久化 competitionList（列表数据）
      // 不持久化 total（派生数据）
      // 不持久化 loading（UI 状态）
    },
  },
);
```

**使用场景**:
- ✅ 持久化: 用户选择的当前项、配置项、缓存数据
- ❌ 不持久化: 列表数据、临时状态、UI 状态（loading、error）

#### 5.3 排除式持久化 - omit
```typescript
// ✅ 配置3: 排除指定字段（适合大部分字段都需要持久化的场景）
export const useSettingsStore = defineStore(
  'settings',
  () => {
    const theme = ref<string>('light');
    const language = ref<string>('zh-CN');
    const fontSize = ref<'small' | 'normal' | 'large'>('normal');
    const showTabbar = ref<boolean>(true);
    const tempCache = ref<any>(null); // 临时缓存，不需要持久化
    const isLoading = ref<boolean>(false); // UI 状态，不需要持久化

    return {
      theme,
      language,
      fontSize,
      showTabbar,
      tempCache,
      isLoading
    };
  },
  {
    persist: {
      omit: ['tempCache', 'isLoading'], // 排除这些字段，其余都持久化
    },
  },
);
```

**使用场景**:
- 当需要持久化的字段较多，不需要持久化的字段较少时使用
- 适合配置类 Store

#### 5.4 配置对比

| 配置方式 | 语法 | 适用场景 | 示例 |
|---------|------|---------|------|
| **全部持久化** | `persist: true` | 所有状态都需要持久化 | 用户偏好设置 Store |
| **pick (选择式)** | `persist: { pick: [...] }` | 少数字段需要持久化 | 列表页 Store（只持久化当前选中项） |
| **omit (排除式)** | `persist: { omit: [...] }` | 多数字段需要持久化 | 设置类 Store（只排除临时状态） |

#### 5.5 最佳实践

```typescript
// ❌ 错误：持久化所有状态（包括列表和临时状态）
export const useAwardStore = defineStore(
  'award',
  () => {
    const awardList = ref<AwardDTO[]>([]);      // 列表数据，不应持久化
    const currentAward = ref<AwardDTO | null>(null);
    const loading = ref<boolean>(false);        // UI 状态，不应持久化
    const error = ref<Error | null>(null);      // 错误状态，不应持久化

    return { awardList, currentAward, loading, error };
  },
  {
    persist: true, // ❌ 会持久化列表和临时状态，浪费存储空间
  },
);

// ✅ 正确：只持久化必要的状态
export const useAwardStore = defineStore(
  'award',
  () => {
    const awardList = ref<AwardDTO[]>([]);
    const currentAward = ref<AwardDTO | null>(null);
    const loading = ref<boolean>(false);
    const error = ref<Error | null>(null);

    return { awardList, currentAward, loading, error };
  },
  {
    persist: {
      pick: ['currentAward'], // ✅ 只持久化当前奖项详情
    },
  },
);
```

#### 5.6 持久化策略指南

**应该持久化**:
- ✅ 用户登录 token
- ✅ 用户基本信息
- ✅ 当前选中/编辑的详情数据
- ✅ 用户配置项（主题、语言、偏好设置）
- ✅ 缓存的关键数据（避免重复请求）

**不应该持久化**:
- ❌ 列表数据（容易过期，占用空间）
- ❌ UI 状态（loading、error）
- ❌ 临时计算结果
- ❌ 分页信息（total、currentPage）
- ❌ 查询参数（queryParams）

#### 5.7 注意事项

⚠️ **重要提醒**:
- 只支持 `pick` 和 `omit` 两个参数，不支持 `paths`
- 插件自动处理 `key` 和 `storage`，无需手动配置
- 全局默认使用 `uniStorage` 适配器，无需指定存储类型

## 🌐 远程配置 Store

`useConfigStore` 缓存后端公开配置（`getConfig(key)`），持久化后启动即可读取上次的值：

```typescript
import { useConfigStore } from '@/store';

const configStore = useConfigStore();
// 同步读取，未加载或加载失败返回默认值
const notice = configStore.get<{ text: string }>('app.notice', { text: '' });
// 按需拉取（并发、静默、单个失败不影响其他、不会 reject）
await configStore.load(['app.notice']);
```

- 启动预加载的 key 定义在 `src/constants/config.ts` 的 `PRELOAD_CONFIG_KEYS`，按业务调整
- 配置接口为公开接口、无需登录：`App.vue` 在 `onLaunch` 中后台加载，不阻塞启动，加载完成前使用缓存或默认值
- 配置返回 404（不存在或未公开）时清除对应缓存，其余失败保留缓存
- `App.vue` 启动时以 `load(PRELOAD_CONFIG_KEYS, { prune: true })` 加载：本次 key 全部加载完成且无失败（404 除外）后删除缓存中不在列表里的 key；按需 `load` 不剪枝
- 加载失败（不含 404）的 key 会被记录，网络从离线恢复在线时自动重试，也可手动调用 `retryFailed()`

## 📂 Store组织结构

### 按业务领域划分
```
src/store/modules/
├── user.ts          # 用户相关状态
├── global.ts        # 全局配置状态
├── app.ts           # 应用状态
├── permission.ts    # 权限相关状态
└── settings.ts      # 用户设置状态
```

### Store导出
```typescript
// store/index.ts
export * from './modules/user';
export * from './modules/global';
export * from './modules/app';
```

## 📋 Store开发快速检查清单

### 状态定义检查
- [ ] 所有状态都有明确的TypeScript类型定义
- [ ] 状态初始值合理
- [ ] 避免深层嵌套的状态结构
- [ ] 相关状态组织在同一Store中

### Actions检查
- [ ] Actions有完整的JSDoc注释
- [ ] 异步Actions有完善的错误处理
- [ ] Actions命名清晰，描述明确
- [ ] 复杂逻辑拆分为多个Actions

### 计算属性检查
- [ ] 使用computed而不是函数
- [ ] 计算属性有明确的返回类型
- [ ] 避免在computed中执行副作用

### 性能优化检查
- [ ] 只持久化必要的状态
- [ ] 避免频繁的状态更新
- [ ] 大型对象使用shallowRef
- [ ] 合理使用computed缓存

## ❓ 常见问题

### Q: 什么时候应该创建新的Store？
**A**: 符合以下条件之一就应该创建新Store：
- 不同业务领域的状态
- 状态间没有强耦合关系
- Store文件超过200行
- 需要独立的持久化配置

### Q: 如何在组件中使用Store？
**A**:
```typescript
// 在setup中使用
import { useUserStore } from '@/store';

const userStore = useUserStore();

// 访问状态
console.log(userStore.token);

// 调用Actions
await userStore.loginAction({ username, password });

// 使用computed
const isLoggedIn = computed(() => userStore.isLoggedIn);
```

### Q: 如何在Store之间共享状态？
**A**:
```typescript
// store1中访问store2
import { useStore2 } from './store2';

export const useStore1 = defineStore('store1', () => {
  const store2 = useStore2();

  const someAction = () => {
    // 访问store2的状态
    console.log(store2.someState);
  };

  return { someAction };
});
```

### Q: 如何处理Store中的异步操作？
**A**:
```typescript
import { getCurrentUser } from '@/api';

// ✅ 正确：完善的异步处理
const fetchUserInfo = async () => {
  loading.value = true;
  error.value = null;

  try {
    const userResponse = await getCurrentUser();
    userInfo.value = userResponse;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取失败';
    throw err;
  } finally {
    loading.value = false;
  }
};
```

### Q: 如何优化Store性能？
**A**:
```typescript
// 1. 使用shallowRef处理大型对象
const largeData = shallowRef<ILargeData>({});

// 2. 避免不必要的响应式
const config = markRaw({ /* 配置对象 */ });

// 3. 合理使用computed
const filteredData = computed(() => {
  return data.value.filter(item => item.active);
});

// 4. 按需持久化
export const useStore = defineStore('store', () => {
  // ...
}, {
  persist: {
    pick: ['token'], // 只持久化token
  },
});
```

通过遵循这些Store开发规范，可以构建出清晰、高效、可维护的状态管理系统。
