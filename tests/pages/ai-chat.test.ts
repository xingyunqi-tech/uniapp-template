import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ApiError } from '@/api';
import type { StreamCallbacks, StreamResult, StreamTransport } from '@/utils/chat-transport';

const hooks = vi.hoisted(() => ({ load: null as null | ((options: Record<string, string>) => void) }));

vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (callback: (options: Record<string, string>) => void) => {
    hooks.load = callback;
  },
  onShow: vi.fn(),
  onHide: vi.fn(),
  onUnload: vi.fn(),
}));

vi.mock('@/store/modules/global', () => ({ useGlobalStore: () => ({ themeClass: '' }) }));

vi.mock('@/store/modules/ai', () => ({
  useAiStore: () => ({
    enabled: true,
    quota: null,
    loadEnabled: () => Promise.resolve(true),
    fetchQuota: vi.fn(),
    rememberSession: vi.fn(),
    sessionOf: () => undefined,
  }),
}));

vi.mock('@/store/modules/consent', () => ({
  useConsentStore: () => ({ check: () => Promise.resolve([]), needsConsent: () => false }),
}));

const modal = vi.hoisted(() => ({ confirm: vi.fn() }));

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('@/composables/useRouter', () => ({ useRouter: () => router }));

vi.mock('@/utils/modal', () => modal);

vi.mock('@/utils/network', () => ({ onNetworkChange: () => () => {} }));

interface WholeBodyConnection {
  callbacks: StreamCallbacks;
  finish(result: StreamResult): void;
}

const transport = vi.hoisted(() => ({ connections: [] as WholeBodyConnection[] }));

vi.mock('@/utils/chat-transport', async importOriginal => ({
  ...(await importOriginal<typeof import('@/utils/chat-transport')>()),
  defaultStreamTransport: (): StreamTransport => (_request, callbacks) => {
    let resolve!: (result: StreamResult) => void;
    const done = new Promise<StreamResult>(res => {
      resolve = res;
    });
    transport.connections.push({ callbacks, finish: resolve });
    return { done, abort: vi.fn(), chunked: false };
  },
}));

const api = vi.hoisted(() => ({
  createAiConversation: vi.fn(),
  getAiMessages: vi.fn(),
  stopAiMessage: vi.fn(),
  resolveRequestHeaders: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { default: ChatPage } = await import('@/pages-sub/ai/chat/index.vue');

function sse(event: string, data: unknown, id: string): string {
  return `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function mountPage() {
  const wrapper = mount(ChatPage, {
    global: {
      stubs: {
        'scroll-view': { template: '<div><slot /></div>' },
        UPageState: {
          props: ['loading', 'error'],
          template: '<div><p v-if="error" class="state-error">{{ error }}</p><slot v-else-if="!loading" /></div>',
        },
        UAiMessage: {
          props: ['message'],
          template: '<div class="ai-message">{{ message.content }}|{{ message.status }}</div>',
        },
        UPopup: true,
        UTextarea: true,
        UButton: true,
        UAiConsentPopup: true,
      },
    },
  });
  hooks.load!({ questionId: 'q1' });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  setActivePinia(createPinia());
  transport.connections = [];
  Object.values(api).forEach(fn => fn.mockReset());
  api.createAiConversation.mockResolvedValue({ id: 'c1' });
  api.getAiMessages.mockResolvedValue({ list: [], hasMore: false });
  api.resolveRequestHeaders.mockResolvedValue({ Authorization: 'Bearer t1' });
  modal.confirm.mockReset().mockResolvedValue(true);
  router.push.mockReset().mockResolvedValue(undefined);
  vi.mocked(uni.showToast).mockClear();
});

describe('AI 讲题对话页', () => {
  it('回答整段返回：等待时显示提示且不能中途停止，结束后完整显示', async () => {
    const wrapper = await mountPage();
    await wrapper.find('textarea').setValue('为什么选 A？');
    await wrapper.find('.chat-input__button').trigger('click');
    await vi.waitFor(() => expect(transport.connections).toHaveLength(1));
    await flushPromises();

    expect(wrapper.find('.chat-list__waiting').text()).toContain('完成后将完整显示');
    const stop = wrapper.find('.chat-input__button--stop');
    expect(stop.text()).toBe('停止');
    expect(stop.classes()).toContain('chat-input__button--disabled');
    await stop.trigger('click');
    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '回答生成中，暂不支持中途停止' }));
    expect(api.stopAiMessage).not.toHaveBeenCalled();

    transport.connections[0].finish({
      status: 200,
      data:
        sse('message.start', { messageId: 'm1' }, '1-0') +
        sse('answer.delta', { text: '选 A，' }, '2-0') +
        sse('answer.delta', { text: '因为……' }, '3-0') +
        sse('message.done', { status: 'DONE' }, '4-0'),
    });
    await flushPromises();

    expect(wrapper.find('.ai-message').text()).toBe('选 A，因为……|DONE');
    expect(wrapper.find('.chat-list__waiting').exists()).toBe(false);
    expect(wrapper.find('.chat-input__button--stop').exists()).toBe(false);
    expect(wrapper.find('.chat-input__button').text()).toBe('发送');
  });

  it('未绑定手机号时提示手机号登录并可前往登录页', async () => {
    api.createAiConversation.mockRejectedValue(
      new ApiError('forbidden', 403, undefined, 'phoneBindingRequired', { errorKey: 'phoneBindingRequired' }),
    );
    const wrapper = await mountPage();

    expect(modal.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ content: '请使用手机号登录后使用 AI 助教', confirmText: '去登录' }),
    );
    expect(router.push).toHaveBeenCalledWith(
      '/pages/login/index',
      expect.objectContaining({ redirect: expect.any(String) }),
    );
    expect(wrapper.find('.state-error').text()).toBe('请使用手机号登录后使用 AI 助教');
  });
});
