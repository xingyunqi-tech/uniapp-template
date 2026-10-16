import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDialogHost, useDialog, type DialogRequest } from '@/composables/useDialog';

type ShowModalOptions = UniApp.ShowModalOptions;

const showModal = vi.fn();

function replyModal(result: Partial<UniApp.ShowModalRes>) {
  showModal.mockImplementation((options: ShowModalOptions) => options.success?.(result as UniApp.ShowModalRes));
}

describe('useDialog', () => {
  const page = { route: 'pages/a' };
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    showModal.mockReset();
    (uni as unknown as { showModal: typeof showModal }).showModal = showModal;
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(getCurrentPages).mockReturnValue([page] as unknown as ReturnType<typeof getCurrentPages>);
  });

  afterEach(() => {
    warn.mockRestore();
    vi.mocked(getCurrentPages).mockReturnValue([]);
  });

  it('当前页未放置 UDialog 时降级为 uni.showModal 并提示', async () => {
    replyModal({ confirm: true });

    await expect(useDialog().confirm({ title: '删除', content: '确定删除吗？', confirmText: '删除' })).resolves.toBe(
      true,
    );
    expect(showModal).toHaveBeenCalledWith(
      expect.objectContaining({ title: '删除', content: '确定删除吗？', confirmText: '删除', showCancel: true }),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('<UDialog />'));
  });

  it('页面栈为空时降级为 uni.showModal', async () => {
    vi.mocked(getCurrentPages).mockReturnValue([]);
    replyModal({ confirm: false, cancel: true });

    await expect(useDialog().confirm('确定吗？')).resolves.toBe(false);
    expect(showModal).toHaveBeenCalledTimes(1);
  });

  it('降级时确认后执行 beforeConfirm，返回 false 或抛错视为取消', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    replyModal({ confirm: true });
    const dialog = useDialog();

    await expect(dialog.confirm({ content: 'a', beforeConfirm: () => false })).resolves.toBe(false);
    await expect(
      dialog.confirm({
        content: 'b',
        beforeConfirm: () => Promise.reject(new Error('fail')),
      }),
    ).resolves.toBe(false);
    await expect(dialog.confirm({ content: 'c', beforeConfirm: async () => {} })).resolves.toBe(true);
    error.mockRestore();
  });

  it('降级的 alert 不显示取消按钮', async () => {
    replyModal({ confirm: true });

    await expect(useDialog().alert('操作成功')).resolves.toBeUndefined();
    expect(showModal).toHaveBeenCalledWith(
      expect.objectContaining({ content: '操作成功', confirmText: '知道了', showCancel: false }),
    );
  });

  it('降级的 prompt 使用可编辑模态框，取消返回 null', async () => {
    const dialog = useDialog();
    replyModal({ confirm: true, content: '新昵称' });
    const beforeConfirm = vi.fn();

    await expect(dialog.prompt({ title: '修改昵称', defaultValue: '旧昵称', beforeConfirm })).resolves.toBe('新昵称');
    expect(showModal).toHaveBeenCalledWith(
      expect.objectContaining({ title: '修改昵称', content: '旧昵称', editable: true, placeholderText: '请输入' }),
    );
    expect(beforeConfirm).toHaveBeenCalledWith('新昵称');

    replyModal({ confirm: false, cancel: true });
    await expect(dialog.prompt('输入')).resolves.toBeNull();
  });

  it('当前页已登记 UDialog 时交给其处理，不调用 showModal', async () => {
    const requests: DialogRequest[] = [];
    const unregister = registerDialogHost(page, '', { enqueue: request => requests.push(request) });

    const result = useDialog().confirm('确定吗？');
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ mode: 'confirm', title: '提示', content: '确定吗？', confirmText: '确定' });
    requests[0].resolve({ confirmed: true });

    await expect(result).resolves.toBe(true);
    expect(showModal).not.toHaveBeenCalled();
    unregister();
  });

  it('注销后同名的其他 UDialog 不受影响', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const unregisterFirst = registerDialogHost(page, '', { enqueue: first });
    const unregisterSecond = registerDialogHost(page, '', { enqueue: second });

    unregisterFirst();
    useDialog().confirm('确定吗？');
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    unregisterSecond();
  });
});
