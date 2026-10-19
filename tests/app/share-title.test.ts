import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { DEFAULT_SITE_PROFILE } from '@/constants';

vi.mock('@/App.vue', () => ({ default: defineComponent({ render: () => null }) }));

vi.mock('@/utils/router-interceptor', () => ({
  guardCurrentPage: vi.fn(),
  setupRouterInterceptor: vi.fn(),
}));

vi.mock('@/utils/router', () => ({
  getCurrentRoute: () => 'pages/index/index',
  getShareTarget: () => ({ path: '/pages/index/index', query: '' }),
  isPrivatePage: () => false,
  isTabBarPage: () => false,
}));

const { createApp } = await import('@/main');
const { default: pinia, useAppProfileStore } = await import('@/store');

interface ShareMixin {
  onShareAppMessage: () => { title: string };
  onShareTimeline: () => { title: string };
}

function shareMixin(): ShareMixin {
  const { app } = createApp();
  return app._context.mixins.find(mixin => 'onShareAppMessage' in mixin) as unknown as ShareMixin;
}

beforeEach(() => {
  useAppProfileStore(pinia).remote = {};
});

describe('全局分享标题', () => {
  it('未配置时使用默认产品名称', () => {
    const mixin = shareMixin();

    expect(mixin.onShareAppMessage().title).toBe(DEFAULT_SITE_PROFILE.appName);
    expect(mixin.onShareTimeline().title).toBe(DEFAULT_SITE_PROFILE.appName);
  });

  it('未配置分享标题时使用后台配置的产品名称', () => {
    useAppProfileStore(pinia).remote = { appName: '新名称' };
    const mixin = shareMixin();

    expect(mixin.onShareAppMessage().title).toBe('新名称');
    expect(mixin.onShareTimeline().title).toBe('新名称');
  });

  it('配置分享标题时使用分享标题', () => {
    useAppProfileStore(pinia).remote = { appName: '新名称', shareTitle: '一起来刷题' };
    const mixin = shareMixin();

    expect(mixin.onShareAppMessage().title).toBe('一起来刷题');
    expect(mixin.onShareTimeline().title).toBe('一起来刷题');
  });
});
