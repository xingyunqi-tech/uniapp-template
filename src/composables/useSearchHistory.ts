import { ref, onMounted } from 'vue';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * 搜索历史管理配置
 */
export interface UseSearchHistoryOptions {
  /** 存储键名 (默认: 'search_history') */
  key?: string;
  /** 最大历史条数 (默认: 10) */
  maxItems?: number;
  /** 是否自动加载 (默认: true) */
  autoLoad?: boolean;
}

/**
 * 搜索历史管理 Composable
 *
 * @description 管理搜索历史记录的存储、添加、删除、清空等操作
 *
 * @example
 * ```typescript
 * const { history, add, remove, clear } = useSearchHistory();
 *
 * // 添加搜索记录
 * add('手机');
 *
 * // 删除单条记录
 * remove('手机');
 *
 * // 清空所有记录
 * clear();
 * ```
 */
export function useSearchHistory(options: UseSearchHistoryOptions = {}) {
  const { key = STORAGE_KEYS.SEARCH_HISTORY, maxItems = 10, autoLoad = true } = options;

  /** 搜索历史列表 */
  const history = ref<string[]>([]);

  /**
   * 从本地存储加载历史记录
   */
  function load(): void {
    const stored = storage.get<string[]>(key);
    history.value = stored || [];
  }

  /**
   * 保存历史记录到本地存储
   */
  function save(): void {
    storage.set(key, history.value);
  }

  /**
   * 添加搜索记录
   * @param keyword 搜索关键词
   *
   * @description
   * - 自动去重：如果关键词已存在，会移动到最前面
   * - 自动限制数量：超过 maxItems 会移除最早的记录
   * - 自动过滤空值
   */
  function add(keyword: string): void {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    // 移除已存在的相同记录 (去重)
    const index = history.value.indexOf(trimmed);
    if (index > -1) {
      history.value.splice(index, 1);
    }

    // 添加到最前面
    history.value.unshift(trimmed);

    // 限制数量
    if (history.value.length > maxItems) {
      history.value = history.value.slice(0, maxItems);
    }

    save();
  }

  /**
   * 删除单条历史记录
   * @param keyword 要删除的关键词
   */
  function remove(keyword: string): void {
    const index = history.value.indexOf(keyword);
    if (index > -1) {
      history.value.splice(index, 1);
      save();
    }
  }

  /**
   * 清空所有历史记录
   */
  function clear(): void {
    history.value = [];
    storage.remove(key);
  }

  /**
   * 检查关键词是否已存在于历史记录中
   * @param keyword 搜索关键词
   */
  function has(keyword: string): boolean {
    return history.value.includes(keyword.trim());
  }

  // 自动加载
  if (autoLoad) {
    onMounted(() => {
      load();
    });
  }

  return {
    /** 搜索历史列表 (响应式) */
    history,
    /** 加载历史记录 */
    load,
    /** 添加搜索记录 */
    add,
    /** 删除单条记录 */
    remove,
    /** 清空所有记录 */
    clear,
    /** 检查是否存在 */
    has,
  };
}
