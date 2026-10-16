import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import USticky from '@/components/USticky/index.vue';

vi.mock('@/composables/useStatusBar', async () => {
  const { ref } = await import('vue');
  return { useStatusBar: () => ({ totalHeight: ref(88) }) };
});

function stickyStyle(wrapper: ReturnType<typeof mount>) {
  return (wrapper.vm as unknown as { stickyStyle?: { top: string; zIndex?: number } }).stickyStyle;
}

describe('USticky', () => {
  it('渲染插槽内容', () => {
    const wrapper = mount(USticky, { slots: { default: '<view class="bar">筛选</view>' } });

    expect(wrapper.find('.bar').text()).toBe('筛选');
  });

  it('数字 offsetTop 按 rpx 计算吸顶距离', () => {
    const wrapper = mount(USticky, { props: { offsetTop: 20 } });

    expect(stickyStyle(wrapper)).toEqual({ top: 'calc(var(--window-top, 0px) + 0px + 20rpx)' });
  });

  it('纯数字字符串 offsetTop 按 rpx 计算吸顶距离', () => {
    const wrapper = mount(USticky, { props: { offsetTop: '88' } });

    expect(stickyStyle(wrapper)?.top).toBe('calc(var(--window-top, 0px) + 0px + 88rpx)');
  });

  it('customNavBar 时吸顶距离叠加状态栏与导航栏高度', () => {
    const wrapper = mount(USticky, { props: { customNavBar: true, offsetTop: '10px' } });

    expect(stickyStyle(wrapper)?.top).toBe('calc(var(--window-top, 0px) + 88px + 10px)');
  });

  it('传入 zIndex 时覆盖默认层级', () => {
    const wrapper = mount(USticky, { props: { zIndex: 10 } });

    expect(stickyStyle(wrapper)?.zIndex).toBe(10);
  });

  it('disabled 时不吸顶', () => {
    const wrapper = mount(USticky, { props: { disabled: true } });

    expect(wrapper.classes()).toContain('u-sticky--disabled');
    expect(stickyStyle(wrapper)).toBeUndefined();
  });
});
