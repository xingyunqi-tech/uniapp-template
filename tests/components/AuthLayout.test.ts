import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthLayout from '@/components/AuthLayout/index.vue';

describe('AuthLayout', () => {
  it('未传入时显示默认标题与副标题', () => {
    const wrapper = mount(AuthLayout);

    expect(wrapper.find('.logo-title').text()).toBe('欢迎');
    expect(wrapper.find('.logo-subtitle').text()).toBe('UniApp 多端开发模板');
    expect(wrapper.find('.card-title').text()).toBe('');
  });

  it('渲染传入的标题与卡片标题', () => {
    const wrapper = mount(AuthLayout, { props: { title: '登录', subtitle: '欢迎回来', cardTitle: '账号登录' } });

    expect(wrapper.find('.logo-title').text()).toBe('登录');
    expect(wrapper.find('.logo-subtitle').text()).toBe('欢迎回来');
    expect(wrapper.find('.card-title').text()).toBe('账号登录');
  });

  it('默认插槽渲染在表单卡片内', () => {
    const wrapper = mount(AuthLayout, { slots: { default: '<form class="form">表单</form>' } });

    expect(wrapper.find('.auth-card .form').text()).toBe('表单');
  });
});
