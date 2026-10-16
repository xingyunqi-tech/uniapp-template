import { getCurrentInstance, onMounted } from 'vue';
import { alert as nativeAlert, confirm as nativeConfirm } from '@/utils/modal';

export type DialogTheme = 'success' | 'warning' | 'info' | 'error';
export type DialogMode = 'confirm' | 'alert' | 'prompt';

export interface DialogOptions {
  /** 标题，默认「提示」 */
  title?: string;
  /** 内容文本，UDialog 有默认插槽时由插槽替代 */
  content?: string;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 标题主题色 */
  type?: DialogTheme;
  /** 确认前置钩子，返回 false 或 reject 时不关闭 */
  beforeConfirm?: () => boolean | void | Promise<boolean | void>;
}

export type AlertOptions = Omit<DialogOptions, 'cancelText' | 'beforeConfirm'>;

export interface PromptOptions extends Omit<DialogOptions, 'beforeConfirm'> {
  /** 输入框占位符 */
  placeholder?: string;
  /** 输入框默认值 */
  defaultValue?: string;
  /** 确认前置钩子，传入输入值，返回 false 或 reject 时不关闭 */
  beforeConfirm?: (value: string) => boolean | void | Promise<boolean | void>;
}

export interface DialogResult {
  confirmed: boolean;
  value?: string;
}

/** UDialog 承载的一次调用 */
export interface DialogRequest {
  id: number;
  mode: DialogMode;
  title: string;
  content: string;
  confirmText: string;
  cancelText: string;
  type: DialogTheme;
  placeholder: string;
  defaultValue: string;
  beforeConfirm?: (value?: string) => boolean | void | Promise<boolean | void>;
  resolve: (result: DialogResult) => void;
}

export interface DialogHost {
  enqueue: (request: DialogRequest) => void;
}

export interface UseDialogReturn {
  /** 确认框，确认返回 true，取消返回 false */
  confirm: (options: DialogOptions | string) => Promise<boolean>;
  /** 提示框，只有确认按钮 */
  alert: (options: AlertOptions | string) => Promise<void>;
  /** 输入框，确认返回输入值，取消返回 null */
  prompt: (options?: PromptOptions | string) => Promise<string | null>;
}

/** 页面实例 → name → UDialog */
const registry = new WeakMap<object, Map<string, DialogHost>>();

let requestId = 0;

/** 页面栈栈顶页面实例 */
export function getTopPage(): object | undefined {
  const pages = getCurrentPages();
  return pages[pages.length - 1];
}

/** UDialog 挂载时登记到所在页面，返回注销函数 */
export function registerDialogHost(page: object, name: string, host: DialogHost): () => void {
  let hosts = registry.get(page);
  if (!hosts) {
    hosts = new Map();
    registry.set(page, hosts);
  }
  hosts.set(name, host);
  return () => {
    const current = registry.get(page);
    if (current?.get(name) === host) current.delete(name);
  };
}

function findHost(page: object | undefined, name: string): DialogHost | undefined {
  return page ? registry.get(page)?.get(name) : undefined;
}

function normalize<T extends { content?: string }>(options: T | string): T {
  return typeof options === 'string' ? ({ content: options } as T) : options;
}

async function passBeforeConfirm(hook: (() => unknown) | undefined): Promise<boolean> {
  if (!hook) return true;
  try {
    return (await hook()) !== false;
  } catch (error) {
    console.error('[useDialog] beforeConfirm 执行失败:', error);
    return false;
  }
}

function warnFallback(name: string) {
  if (import.meta.env.DEV) {
    const label = name ? `<UDialog name="${name}" />` : '<UDialog />';
    console.warn(`[useDialog] 当前页面未放置 ${label}，降级为 uni.showModal`);
  }
}

function nativePrompt(options: PromptOptions): Promise<string | null> {
  return new Promise(resolve => {
    uni.showModal({
      title: options.title ?? '提示',
      content: options.defaultValue ?? '',
      placeholderText: options.placeholder ?? '请输入',
      editable: true,
      confirmText: options.confirmText ?? '确定',
      cancelText: options.cancelText ?? '取消',
      success: res => resolve(res.confirm ? (res.content ?? '') : null),
      fail: () => resolve(null),
    });
  });
}

/**
 * 页面内确认框
 * 页面模板放置 <UDialog />，调用时弹出所属页面的 UDialog；所属页面为调用 useDialog 的组件挂载时的栈顶页面，
 * 在组件外调用时取调用时的栈顶页面。找不到 UDialog 时降级为 uni.showModal。
 * 同一 UDialog 的多次调用按顺序排队，前一个关闭后再弹出下一个。
 *
 * @param name 对应 <UDialog name="..." />，默认空字符串
 *
 * @example
 * ```ts
 * const dialog = useDialog();
 * if (await dialog.confirm({ title: '提示', content: '确定要取消该订单吗？' })) {
 *   await cancelOrder();
 * }
 * ```
 */
export function useDialog(name = ''): UseDialogReturn {
  let ownerPage: object | undefined;

  if (getCurrentInstance()) {
    onMounted(() => {
      ownerPage ??= getTopPage();
    });
  }

  function request(
    mode: DialogMode,
    options: Omit<PromptOptions, 'beforeConfirm'> & { beforeConfirm?: (value: string) => unknown },
  ): Promise<DialogResult> | undefined {
    const host = findHost(ownerPage ?? getTopPage(), name);
    if (!host) return undefined;
    return new Promise(resolve => {
      host.enqueue({
        id: ++requestId,
        mode,
        title: options.title ?? '提示',
        content: options.content ?? '',
        confirmText: options.confirmText ?? (mode === 'alert' ? '知道了' : '确定'),
        cancelText: options.cancelText ?? '取消',
        type: options.type ?? 'info',
        placeholder: options.placeholder ?? '请输入',
        defaultValue: options.defaultValue ?? '',
        beforeConfirm: options.beforeConfirm as DialogRequest['beforeConfirm'],
        resolve,
      });
    });
  }

  async function confirm(options: DialogOptions | string): Promise<boolean> {
    const opts = normalize<DialogOptions>(options);
    const pending = request('confirm', opts);
    if (pending) return (await pending).confirmed;

    warnFallback(name);
    const confirmed = await nativeConfirm({ ...opts, content: opts.content ?? '' });
    return confirmed && (await passBeforeConfirm(opts.beforeConfirm));
  }

  async function alert(options: AlertOptions | string): Promise<void> {
    const opts = normalize<AlertOptions>(options);
    const pending = request('alert', opts);
    if (pending) {
      await pending;
      return;
    }

    warnFallback(name);
    await nativeAlert({ ...opts, content: opts.content ?? '' });
  }

  async function prompt(options?: PromptOptions | string): Promise<string | null> {
    const opts: PromptOptions = typeof options === 'string' ? { title: options } : (options ?? {});
    const pending = request('prompt', opts);
    if (pending) {
      const result = await pending;
      return result.confirmed ? (result.value ?? '') : null;
    }

    warnFallback(name);
    const value = await nativePrompt(opts);
    if (value === null) return null;
    const hook = opts.beforeConfirm;
    return (await passBeforeConfirm(hook && (() => hook(value)))) ? value : null;
  }

  return { confirm, alert, prompt };
}
