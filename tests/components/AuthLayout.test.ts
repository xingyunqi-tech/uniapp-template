import { beforeAll, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthLayout from '@/components/AuthLayout/index.vue';
import { safeBack } from '@/utils/router';
import { PAGES } from '@/constants/pages';

vi.mock('@/utils/router', () => ({
  safeBack: vi.fn(),
}));

const global = { stubs: { 'uni-icons': true } };

beforeAll(() => {
  Object.assign(uni, {
    getWindowInfo: () => ({ statusBarHeight: 30, windowWidth: 375 }),
    getSystemInfoSync: () => ({ transparentTitle: true }),
    getMenuButtonBoundingClientRect: () => undefined,
  });
});

describe('AuthLayout', () => {
  it('未传入时显示默认标题与副标题', () => {
    const wrapper = mount(AuthLayout, { global });

    expect(wrapper.find('.logo-title').text()).toBe('欢迎');
    expect(wrapper.find('.logo-subtitle').text()).toBe('UniApp 多端开发模板');
    expect(wrapper.find('.card-title').text()).toBe('');
  });

  it('渲染传入的标题与卡片标题', () => {
    const wrapper = mount(AuthLayout, {
      global,
      props: { title: '登录', subtitle: '欢迎回来', cardTitle: '账号登录' },
    });

    expect(wrapper.find('.logo-title').text()).toBe('登录');
    expect(wrapper.find('.logo-subtitle').text()).toBe('欢迎回来');
    expect(wrapper.find('.card-title').text()).toBe('账号登录');
  });

  it('默认插槽渲染在表单卡片内', () => {
    const wrapper = mount(AuthLayout, { global, slots: { default: '<form class="form">表单</form>' } });

    expect(wrapper.find('.auth-card .form').text()).toBe('表单');
  });

  it('导航栏顶部留出状态栏高度', () => {
    const wrapper = mount(AuthLayout, { global });

    expect(wrapper.find('.auth-nav').attributes('style')).toContain('padding-top: 30px');
  });

  it('点击返回按钮时安全返回，无上一页回首页', async () => {
    const wrapper = mount(AuthLayout, { global });

    await wrapper.find('.auth-nav__back').trigger('click');

    expect(safeBack).toHaveBeenCalledWith(PAGES.HOME);
  });

  it('开启 virtualHost，父组件 class 合并到根节点', () => {
    const wrapper = mount(AuthLayout, { attrs: { class: 'dark-theme' }, global });

    expect((AuthLayout as { options?: Record<string, unknown> }).options).toMatchObject({ virtualHost: true });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['auth-page', 'dark-theme']));
  });
});
