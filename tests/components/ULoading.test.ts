import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import ULoading from '@/components/ULoading/index.vue';
import { forceHideLoading, showLoading } from '@/composables/useLoading';

afterEach(() => {
  forceHideLoading();
});

describe('ULoading', () => {
  it('visible 为 false 时不渲染', () => {
    const wrapper = mount(ULoading);

    expect(wrapper.find('.u-loading').exists()).toBe(false);
  });

  it('显示文字并按类型、全屏添加修饰类', () => {
    const wrapper = mount(ULoading, { props: { visible: true, text: '加载中', type: 'primary' } });

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-loading--primary', 'u-loading--fullscreen']));
    expect(wrapper.find('.u-loading__text').text()).toBe('加载中');
  });

  it('spinner 类型渲染 12 个圆点', () => {
    const wrapper = mount(ULoading, { props: { visible: true, spinnerType: 'spinner' } });

    expect(wrapper.findAll('.u-loading__spinner-dot')).toHaveLength(12);
    expect(wrapper.find('.u-loading__circular').exists()).toBe(false);
  });

  it('按 color 设置图标和文字颜色', () => {
    const wrapper = mount(ULoading, { props: { visible: true, text: '加载中', color: 'red' } });
    const spinner = wrapper.find('.u-loading__spinner').element as HTMLElement;

    expect(spinner.style.getPropertyValue('--u-loading-color')).toBe('red');
    expect((wrapper.find('.u-loading__text').element as HTMLElement).style.color).toBe('red');
  });

  it('closeOnClickMask 时点击遮罩关闭', async () => {
    const wrapper = mount(ULoading, { props: { visible: true, closeOnClickMask: true } });

    await wrapper.find('.u-loading__mask').trigger('click');

    expect(wrapper.emitted('update:visible')).toEqual([[false]]);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('默认点击遮罩不关闭', async () => {
    const wrapper = mount(ULoading, { props: { visible: true } });

    await wrapper.find('.u-loading__mask').trigger('click');

    expect(wrapper.emitted('update:visible')).toBeUndefined();
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('global 模式跟随命令式 API 显示与隐藏', async () => {
    const wrapper = mount(ULoading, { props: { global: true, text: '忽略' } });
    expect(wrapper.find('.u-loading').exists()).toBe(false);

    showLoading('提交中');
    await nextTick();
    expect(wrapper.find('.u-loading__text').text()).toBe('提交中');

    forceHideLoading();
    await nextTick();
    expect(wrapper.find('.u-loading').exists()).toBe(false);
  });
});
