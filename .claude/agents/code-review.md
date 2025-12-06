---
name: code-review
description: 代码质量检查、安全审查、性能优化建议和最佳实践验证
---

# 代码审查 Agent

## 职责
负责代码质量检查、安全审查、性能优化建议和最佳实践验证，确保代码符合项目标准并提供改进建议。

## 🎯 审查原则

### 1. 质量优先
- **功能正确性**: 代码逻辑正确，满足业务需求
- **类型安全**: TypeScript类型定义完整准确
- **错误处理**: 完善的异常处理机制
- **边界条件**: 考虑各种边界情况

### 2. 性能导向
- **渲染性能**: 避免不必要的重渲染
- **内存管理**: 防止内存泄漏
- **网络优化**: 减少不必要的请求
- **包大小**: 控制打包体积

### 3. 安全第一
- **输入验证**: 严格的数据验证
- **XSS防护**: 防止跨站脚本攻击
- **权限控制**: 合理的权限验证
- **敏感信息**: 避免泄露敏感数据

## 🤖 AI 生成代码审查要点

> **核心差异**: AI 代码通常"看起来完美"（语法正确、格式漂亮），导致 Reviewer 放松警惕而漏掉致命错误。

### 幻觉代码检测

AI 最大的问题是"一本正经地胡说八道"，以下场景需特别警惕：

```typescript
// ❌ 幻觉库：AI 编造的不存在的包
import { formatDate } from 'vue-date-formatter'; // 不存在！
import { useVirtualList } from '@vueuse/virtual'; // 路径错误

// ✅ 正确：使用项目已有的工具函数
import { formatDateShort, formatDateTime } from '@/utils';
import dayjs from 'dayjs'; // 项目已配置，直接使用

// ✅ 验证方法：检查 package.json 或 npm 官网
// npm view vue-date-formatter

// ❌ 幻觉 API：混淆不同版本的函数签名
import dayjs from 'dayjs';
dayjs().format('YYYY-MM-DD', { locale: 'zh-cn' }); // format 不接受第二个参数！

// ✅ 正确：dayjs 已全局配置，直接使用
import dayjs from 'dayjs';
dayjs().format('YYYY-MM-DD');      // 基础格式化
dayjs().fromNow();                  // 相对时间（RelativeTime 插件已配置）

// ❌ 幻觉正则：看似正确但实际不匹配
const emailRegex = /\w+@\w+\.\w+/; // 无法匹配 user.name@sub.domain.com

// ✅ 验证方法：在 regex101.com 实测多种输入
```

**幻觉探测提问话术**:
- "这个第三方库我没见过，请确认它的 npm 包名和最新版本。"
- "这段正则比较复杂，请提供你在测试工具中的验证截图。"
- "这个函数如果传入 null 会发生什么？"
- "AI 在这里使用了递归，最大深度限制在哪里？"

### 凭证硬编码检测

AI 经常为了"跑通代码"而硬编码凭证：

```typescript
// ❌ 危险：硬编码凭证
const API_KEY = 'sk-1234567890abcdef'; // AI 伪造的 key
const BASE_URL = 'http://192.168.1.100:8080'; // 内网 IP 泄露

// ❌ 危险：敏感信息打印到日志
console.log('用户登录:', { userId, token, password }); // 生产环境泄露！

// ✅ 正确：使用环境变量
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ✅ 正确：使用 Uni-app 的存储 API
uni.setStorageSync('token', tokenValue);  // 同步存储
uni.removeStorageSync('token');            // 同步删除

// ✅ 正确：日志脱敏
console.log('用户登录:', { userId, token: '***' });
```

### 边界情况覆盖

AI 擅长写 Happy Path，常忽略防御性编程：

```typescript
// ❌ 问题：AI 假设输入永远完美
import type { UserDTO } from '@/api';

const getUserName = (user: UserDTO) => {
  return user.realName.toUpperCase(); // realName 可能为 undefined
};

// ✅ 改进：防御性编程（参考 useUserStore）
const getUserName = (user: UserDTO | null | undefined): string => {
  return user?.realName?.toUpperCase() ?? user?.username ?? '未知用户';
};

// ❌ 问题：缺少循环终止条件
const findParent = (node: TreeNode): TreeNode => {
  while (node.parent) { // 如果有循环引用会死循环
    node = node.parent;
  }
  return node;
};

// ✅ 改进：添加深度限制
const findParent = (node: TreeNode, maxDepth = 100): TreeNode | null => {
  let depth = 0;
  while (node.parent && depth < maxDepth) {
    node = node.parent;
    depth++;
  }
  return depth >= maxDepth ? null : node;
};
```

### 注释与代码不同步

AI 修改代码后常忘记更新注释：

```typescript
// ❌ 问题：注释与代码不符
/**
 * 获取比赛列表
 * @param page 页码
 * @param size 每页数量
 */
const getCompetitions = async (status: string) => { // 参数已改，注释未更新！
  return await listCompetitions({ status });
};

// ✅ 正确：注释与代码保持同步
import { listCompetitions } from '@/api';
import type { ListCompetitionsParams } from '@/api';

/**
 * 根据状态获取比赛列表
 * @param status 比赛状态
 */
const getCompetitions = async (status: string) => {
  return await listCompetitions({ status });
};
```

## 📋 代码审查清单

### TypeScript 类型检查
```typescript
// ✅ 检查点：类型定义完整
interface UserInfo {
  id: string;
  username: string;
  email: string;
  roles: string[];
  createdAt: string;
  avatar?: string; // 可选属性明确标识
}

// ❌ 问题：使用any类型
const userData: any = response.data; // 应该定义具体类型

// ✅ 改进：使用具体类型
const userData: UserInfo = response.data;

// ❌ 问题：缺少null检查
const userName = user.name.toUpperCase(); // 可能报错

// ✅ 改进：添加null检查
const userName = user?.name?.toUpperCase() || '';

// ❌ 问题：类型断言过度使用
const element = document.getElementById('root') as HTMLElement;

// ✅ 改进：使用类型守卫
const element = document.getElementById('root');
if (element instanceof HTMLElement) {
  // 安全使用element
}
```

**检查要点**:
- [ ] 所有变量都有明确类型定义
- [ ] 避免使用`any`类型
- [ ] 接口定义完整且有注释
- [ ] 泛型使用合理
- [ ] 类型导入使用`type`关键字
- [ ] 可选属性正确标识
- [ ] 联合类型使用恰当

### Vue 组件检查
```vue
<!-- ✅ 检查点：模板结构清晰 -->
<template>
  <view class="user-profile">
    <!-- 条件渲染使用v-if -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    <view v-else-if="error" class="error">
      <text>{{ error }}</text>
    </view>
    <view v-else class="content">
      <!-- 列表渲染使用key -->
      <view v-for="user in userList" :key="user.id" class="user-item">
        <text>{{ user.username }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
// ✅ 检查点：导入顺序规范
import { ref, computed, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { showToast } from '@/utils/toast';
import { getAuthUserInfo } from '@/api';
import type { UserInfo } from '@/api';

// ✅ 检查点：Props类型定义完整
interface Props {
  /** 用户ID */
  userId: string;
  /** 显示模式 */
  mode?: 'card' | 'list';
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'card',
});

// ✅ 检查点：事件定义清晰
interface Emits {
  (e: 'update', user: UserInfo): void;
  (e: 'delete', userId: string): void;
}

const emit = defineEmits<Emits>();

// ❌ 问题：响应式数据类型不明确
const userInfo = ref(null); // 应该指定类型

// ✅ 改进：明确类型定义
const userInfo = ref<UserInfo | null>(null);

// ❌ 问题：计算属性没有返回类型
const displayName = computed(() => {
  return userInfo.value?.username || '未知用户';
});

// ✅ 改进：添加返回类型
const displayName = computed((): string => {
  return userInfo.value?.username || '未知用户';
});

// ❌ 问题：异步函数缺少错误处理
const fetchUser = async () => {
  const userData = await getAuthUserInfo();
  userInfo.value = userData;
};

// ✅ 改进：完善错误处理
const fetchUser = async (): Promise<void> => {
  try {
    loading.value = true;
    const userData = await getAuthUserInfo();
    userInfo.value = userData;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    showToast('获取用户信息失败');
  } finally {
    loading.value = false;
  }
};

// ✅ 检查点：生命周期使用合理 (Uni-app 使用 onLoad)
onLoad(() => {
  fetchUser();
});

// ✅ 检查点：监听器依赖明确
watch(
  () => props.userId,
  (newUserId, oldUserId) => {
    if (newUserId && newUserId !== oldUserId) {
      fetchUser();
    }
  }
);
</script>

<style scoped lang="scss">
// ✅ 检查点：样式组织规范 (使用 rpx 单位)
.user-profile {
  padding: 40rpx;

  .loading,
  .error {
    text-align: center;
    padding: 80rpx;
  }

  .error {
    color: var(--colorError);
  }

  .content {
    .user-item {
      padding: 24rpx;
      border-bottom: 1rpx solid var(--colorBorder);

      &:last-child {
        border-bottom: none;
      }
    }
  }
}
</style>
```

**检查要点**:
- [ ] Props和Emits类型定义完整
- [ ] 响应式数据类型明确
- [ ] 计算属性有返回类型
- [ ] 异步函数有错误处理
- [ ] 生命周期使用合理
- [ ] 监听器依赖明确
- [ ] 模板使用v-key
- [ ] 条件渲染逻辑清晰

### API 接口检查

**重要**: 项目使用Orval自动生成API，详细架构说明参考 [api-development.md#核心架构决策](api-development.md#核心架构决策)

**Orval架构下的检查要点**:
- [ ] **绝不修改** `generated/` 目录的文件
- [ ] 从 `@/api` 统一导入，不直接从 `generated/` 导入
- [ ] 自定义API在 `custom/` 目录，保持函数名一致
- [ ] 使用生成的类型，不重复定义
- [ ] 参数验证在自定义层添加
- [ ] 错误处理依赖拦截器，组件只处理特定逻辑
- [ ] 优先使用Pinia Store (`useLogin`, `useUserInfo`)

**详细规范**: 参考 [@api-development.md#核心架构决策](api-development.md#核心架构决策)

**自定义API扩展示例**:
```typescript
// ✅ 正确：扩展生成的API（参考 api-development.md）
import { postAuthLogin as generatedLogin } from '../generated/auth/auth';
import type { LoginRequest } from '@/api';

export const postAuthLogin = async (data: LoginRequest) => {
  // 参数验证
  if (!data.username?.trim()) throw new Error('用户名不能为空');

  // 调用生成的API + 添加业务逻辑
  const response = await generatedLogin(data);
  if (response.token) uni.setStorageSync('token', response.token);

  return response;
};
```

### 状态管理检查
```typescript
import { postAuthLogin, postAuthLogout } from '@/api';
import type { LoginRequest, UserInfo } from '@/api';

// ✅ 检查点：Store定义规范
export const useUserStore = defineStore('user', () => {
  // ✅ 检查点：状态类型明确
  const token = ref<string>('');
  const userInfo = ref<UserInfo | null>(null);
  const loading = ref<boolean>(false);

  // ✅ 检查点：计算属性类型明确
  const isLoggedIn = computed((): boolean => !!token.value);

  // ❌ 问题：异步操作缺少加载状态
  const login = async (credentials: LoginRequest) => {
    const response = await postAuthLogin(credentials);
    token.value = response.token;
    userInfo.value = response.userInfo;
  };

  // ✅ 改进：添加加载状态和错误处理
  const login = async (credentials: LoginRequest): Promise<void> => {
    loading.value = true;

    try {
      const response = await postAuthLogin(credentials);
      token.value = response.token;
      userInfo.value = response.userInfo;

      // 持久化存储
      uni.setStorageSync('token', token.value);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // ✅ 检查点：清理操作完整
  const logout = async (): Promise<void> => {
    try {
      await postAuthLogout();
    } finally {
      // 确保状态被清理
      token.value = '';
      userInfo.value = null;
      uni.removeStorageSync('token');
    }
  };

  return {
    // 状态
    token: readonly(token),
    userInfo: readonly(userInfo),
    loading: readonly(loading),
    // 计算属性
    isLoggedIn,
    // 动作
    login,
    logout,
  };
});
```

**检查要点**:
- [ ] 状态类型定义明确
- [ ] 计算属性有返回类型
- [ ] 异步操作有加载状态
- [ ] 错误处理完善
- [ ] 状态清理完整
- [ ] 持久化存储合理
- [ ] 状态只读暴露

## 🚀 性能优化检查

### 组件性能
```vue
<script setup lang="ts">
// ❌ 问题：每次渲染都创建新对象
const handleClick = () => {
  emit('click', { timestamp: Date.now() });
};

// ✅ 改进：使用useCallback优化
const handleClick = useCallback(() => {
  emit('click', { timestamp: Date.now() });
}, []);

// ❌ 问题：计算属性依赖过多
const expensiveComputed = computed(() => {
  return props.items
    .filter(item => item.active)
    .map(item => ({ ...item, processed: true }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

// ✅ 改进：拆分计算属性
const activeItems = computed(() =>
  props.items.filter(item => item.active)
);

const processedItems = computed(() =>
  activeItems.value.map(item => ({ ...item, processed: true }))
);

const sortedItems = computed(() =>
  processedItems.value.sort((a, b) => a.name.localeCompare(b.name))
);

// ❌ 问题：不必要的响应式数据
const config = reactive({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
});

// ✅ 改进：使用常量
const CONFIG = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
} as const;
</script>

<template>
  <!-- ❌ 问题：内联对象/函数 -->
  <div :style="{ color: 'red', fontSize: '14px' }">
    <button @click="() => handleDelete(item.id)">删除</button>
  </div>

  <!-- ✅ 改进：提取到计算属性/方法 -->
  <div :style="itemStyle">
    <button @click="handleDelete(item.id)">删除</button>
  </div>
</template>
```

**性能检查要点**:
- [ ] 避免在模板中使用内联对象/函数
- [ ] 合理使用计算属性缓存
- [ ] 避免不必要的响应式数据
- [ ] 大列表使用虚拟滚动
- [ ] 图片懒加载
- [ ] 组件懒加载

### 网络请求优化

**注意**: 项目使用Orval + Pinia Store，推荐使用自动生成的Hooks以获得智能缓存和请求管理。

```typescript
// ❌ 问题：手动管理缓存（不推荐）
const userCache = new Map<string, UserInfo>();

const fetchUserInfo = async (userId: string): Promise<UserInfo> => {
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  const userInfo = await getAuthUserInfo();
  userCache.set(userId, userInfo);

  return userInfo;
};

// ✅ 最佳实践：使用Pinia Store（推荐）
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const loading = ref(false);

// 使用 Store 管理用户信息状态
onMounted(async () => {
  loading.value = true;
  await userStore.fetchUserInfo();
  loading.value = false;
});

const userInfo = computed(() => userStore.userInfo);

// ❌ 问题：串行请求
const loadPageData = async () => {
  const users = await getUserList();
  const roles = await getRoleList();
  const permissions = await getPermissionList();

  return { users, roles, permissions };
};

// ✅ 改进：并行请求
const loadPageData = async () => {
  const [users, roles, permissions] = await Promise.all([
    getUserList(),
    getRoleList(),
    getPermissionList(),
  ]);

  return { users, roles, permissions };
};

// ✅✅ 最佳实践：使用Pinia Store的并行查询

  queries: [
    { queryKey: ['users'], queryFn: getUserList },
    { queryKey: ['roles'], queryFn: getRoleList },
    { queryKey: ['permissions'], queryFn: getPermissionList },
  ]
});

// queries[0].data 是用户列表
// queries[1].data 是角色列表
// queries[2].data 是权限列表
```

**网络优化检查要点**:
- [ ] 优先使用Pinia Store，避免手动缓存
- [ ] 合理配置`staleTime`和`cacheTime`
- [ ] 使用`Promise.all`并行请求
- [ ] 避免在循环中发起请求

## 🔒 安全检查

### 输入验证

**注意**: 使用Orval自动生成的类型确保类型安全。

```typescript
import { postUsersCreate } from '@/api';
import type { CreateUserRequest, UserInfo } from '@/api';

// ❌ 问题：缺少输入验证，使用any类型
const createUser = async (userData: any) => {
  const response = await postUsersCreate(userData);
  return response;
};

// ✅ 改进：使用生成的类型 + 严格输入验证
const createUser = async (userData: CreateUserRequest): Promise<UserInfo> => {
  // 验证必填字段
  if (!userData.username?.trim() || !userData.email?.trim() || !userData.password) {
    throw new Error('用户名、邮箱和密码为必填项');
  }

  // 验证邮箱格式
  if (!ValidationUtils.isValidEmail(userData.email)) {
    throw new Error('邮箱格式不正确');
  }

  // 验证密码强度
  if (ValidationUtils.getPasswordStrength(userData.password) === 'weak') {
    throw new Error('密码强度不足');
  }

  // 清理输入数据（保持类型安全）
  const cleanData: CreateUserRequest = {
    ...userData,
    username: userData.username.trim(),
    email: userData.email.toLowerCase().trim(),
    roles: userData.roles || ['user'],
  };

  const response = await postUsersCreate(cleanData);
  return response;
};
```

**输入验证检查要点**:
- [ ] 使用Orval生成的类型，不使用`any`
- [ ] 验证必填字段
- [ ] 验证数据格式（邮箱、手机号等）
- [ ] 验证数据范围和长度
- [ ] 清理和规范化输入数据
- [ ] 后端也要有验证，前端验证只是第一道防线

### XSS防护

**项目已封装**: 使用 `src/utils/sanitize.ts` 中的工具函数

```vue
<template>
  <!-- ❌ 问题：直接输出HTML -->
  <div v-html="userContent"></div>

  <!-- ✅ 改进：文本输出或使用项目封装的 sanitize 函数 -->
  <div>{{ userContent }}</div>
  <!-- 或者 -->
  <div v-html="sanitizedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { sanitizeHtml, sanitizeHtmlStrict, sanitizeText } from '@/utils/sanitize';

interface Props {
  /** 用户输入的 HTML 内容 */
  userContent: string;
}

const props = defineProps<Props>();

// ✅ 富文本场景：允许基础格式化标签
const sanitizedContent = computed(() => {
  return sanitizeHtml(props.userContent, { allowImages: true, allowLinks: true });
});

// ✅ 评论场景：严格模式，只允许文本格式化
const strictContent = computed(() => {
  return sanitizeHtmlStrict(props.userContent);
});

// ✅ 纯文本场景：移除所有 HTML 标签
const plainText = computed(() => {
  return sanitizeText(props.userContent);
});
</script>
```

### 权限控制

**项目已封装**: 使用 `src/utils/auth.ts` 中的工具函数

```typescript
import { checkRole, getRoleLabel } from '@/utils/auth';
import { useUserStore } from '@/store/modules/user';
import { ROLES } from '@/constants/roles';
import type { RoleType } from '@/constants/roles';

// ✅ 检查点：角色验证（使用项目工具函数）
const userStore = useUserStore();
const isAdmin = checkRole(userStore.role, ROLES.ADMIN);
const isTeacher = checkRole(userStore.role, [ROLES.ADMIN, ROLES.TEACHER]);

// ✅ 在组件中使用
const canManage = computed(() => checkRole(userStore.role, [ROLES.ADMIN, ROLES.TEACHER]));
const roleDisplayName = computed(() => getRoleLabel(userStore.role as RoleType));

// ✅ 在路由守卫中使用（参考 src/router/guard.ts）
router.beforeEach((to, from, next) => {
  const requiredRoles = to.meta.roles as RoleType[];

  if (requiredRoles && !checkRole(userStore.role, requiredRoles)) {
    next('/403');
    return;
  }

  next();
});
```

## 📊 代码质量指标

### 复杂度检查
```typescript
// ❌ 问题：函数过于复杂
const processUserData = (users: UserInfo[], filters: any) => {
  let result = users;

  if (filters.status) {
    result = result.filter(user => user.status === filters.status);
  }

  if (filters.role) {
    result = result.filter(user => user.roles.includes(filters.role));
  }

  if (filters.keyword) {
    result = result.filter(user =>
      user.username.includes(filters.keyword) ||
      user.email.includes(filters.keyword)
    );
  }

  if (filters.dateRange) {
    result = result.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= filters.dateRange.start &&
             createdAt <= filters.dateRange.end;
    });
  }

  if (filters.sortBy) {
    result = result.sort((a, b) => {
      if (filters.sortBy === 'username') {
        return a.username.localeCompare(b.username);
      } else if (filters.sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }

  return result;
};

// ✅ 改进：拆分函数
const filterByStatus = (users: UserInfo[], status?: string) => {
  return status ? users.filter(user => user.status === status) : users;
};

const filterByRole = (users: UserInfo[], role?: string) => {
  return role ? users.filter(user => user.roles.includes(role)) : users;
};

const filterByKeyword = (users: UserInfo[], keyword?: string) => {
  if (!keyword) return users;

  const lowerKeyword = keyword.toLowerCase();
  return users.filter(user =>
    user.username.toLowerCase().includes(lowerKeyword) ||
    user.email.toLowerCase().includes(lowerKeyword)
  );
};

const filterByDateRange = (users: UserInfo[], dateRange?: { start: Date; end: Date }) => {
  if (!dateRange) return users;

  return users.filter(user => {
    const createdAt = new Date(user.createdAt);
    return createdAt >= dateRange.start && createdAt <= dateRange.end;
  });
};

const sortUsers = (users: UserInfo[], sortBy?: string) => {
  if (!sortBy) return users;

  return [...users].sort((a, b) => {
    switch (sortBy) {
      case 'username':
        return a.username.localeCompare(b.username);
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });
};

const processUserData = (users: UserInfo[], filters: IUserFilters): UserInfo[] => {
  let result = users;

  result = filterByStatus(result, filters.status);
  result = filterByRole(result, filters.role);
  result = filterByKeyword(result, filters.keyword);
  result = filterByDateRange(result, filters.dateRange);
  result = sortUsers(result, filters.sortBy);

  return result;
};
```

### 测试覆盖率检查
```typescript
// ✅ 检查点：关键功能有测试
describe('UserService', () => {
  describe('createUser', () => {
    it('应该成功创建用户', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'StrongPassword123!',
        roles: ['user'],
      };

      const result = await UserService.createUser(userData);

      expect(result).toBeDefined();
      expect(result.username).toBe(userData.username);
    });

    it('应该在邮箱格式错误时抛出异常', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'StrongPassword123!',
        roles: ['user'],
      };

      await expect(UserService.createUser(userData)).rejects.toThrow('邮箱格式不正确');
    });
  });
});
```

## 📋 审查报告模板

### 代码审查报告
```markdown
## 代码审查报告

**审查文件**: src/components/UserProfile/index.vue
**审查时间**: 2024-01-01
**审查者**: AI Assistant

### 🎯 总体评价
- **质量等级**: B+ (良好)
- **主要问题**: 类型定义不完整，错误处理不够完善
- **建议**: 优化类型定义，增强错误处理

### ✅ 优点
1. 组件结构清晰，职责单一
2. 使用了Composition API
3. 样式组织规范

### ❌ 问题清单
1. **类型安全** (高优先级)
   - 第25行：`userInfo`缺少类型定义
   - 第38行：计算属性缺少返回类型

2. **错误处理** (中优先级)
   - 第45行：`fetchUserInfo`缺少try-catch
   - 第52行：网络错误未向用户提示

3. **性能优化** (低优先级)
   - 第18行：可以使用`computed`缓存复杂计算

### 🔧 修改建议
```typescript
// 修改前
const userInfo = ref(null);

// 修改后
const userInfo = ref<UserInfo | null>(null);
```

### 📊 质量指标
- 类型覆盖率: 75%
- 错误处理覆盖率: 60%
- 测试覆盖率: 0%
- 复杂度: 低

### 🎯 后续行动
1. 完善类型定义
2. 增加错误处理
3. 编写单元测试
```

通过系统化的代码审查，可以确保代码质量持续改进，为项目的长期维护提供保障。
