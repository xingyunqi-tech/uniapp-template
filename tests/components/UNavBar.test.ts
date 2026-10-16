import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UNavBar from '@/components/UNavBar/index.vue';
import { safeBack } from '@/utils/router';

vi.mock('@/store/modules/global', () => ({
  useGlobalStore: () => ({ themeClass: 'theme-light' }),
}));

vi.mock('@/utils/router', () => ({
  safeBack: vi.fn(),
}));

const global = { stubs: { 'uni-icons': true } };

let windowWidth = 375;
let menuButton: { left: number; top: number; height: number } | undefined;

beforeAll(() => {
  Object.assign(uni, {
    getWindowInfo: () => ({ statusBarHeight: 30, windowWidth }),
    getSystemInfoSync: () => ({}),
    getMenuButtonBoundingClientRect: () => menuButton,
    upx2px: (value: number) => value / 2,
  });
});

beforeEach(() => {
  vi.mocked(safeBack).mockClear();
  windowWidth = 375;
  menuButton = undefined;
});

function layoutStyles(wrapper: ReturnType<typeof mount>) {
  return wrapper.vm as unknown as { rightStyle?: { right: string }; titleStyle?: { maxWidth: string } };
}

describe('UNavBar', () => {
  it('点击默认返回按钮时返回上一页', async () => {
    const wrapper = mount(UNavBar, { global });

    await wrapper.find('.u-nav-bar__left').trigger('click');

    expect(wrapper.emitted('clickLeft')).toHaveLength(1);
    expect(safeBack).toHaveBeenCalledTimes(1);
  });

  it('customBack 时触发 back 而不返回', async () => {
    const wrapper = mount(UNavBar, { props: { customBack: true }, global });

    await wrapper.find('.u-nav-bar__left').trigger('click');

    expect(wrapper.emitted('back')).toHaveLength(1);
    expect(safeBack).not.toHaveBeenCalled();
  });

  it('自定义左侧插槽时只触发 clickLeft，不返回', async () => {
    const wrapper = mount(UNavBar, { slots: { left: '<text>城市</text>' }, global });

    await wrapper.find('.u-nav-bar__left').trigger('click');

    expect(wrapper.emitted('clickLeft')).toHaveLength(1);
    expect(wrapper.emitted('back')).toBeUndefined();
    expect(safeBack).not.toHaveBeenCalled();
  });

  it('没有胶囊时右侧区域与标题使用默认样式', () => {
    const wrapper = mount(UNavBar, { props: { title: '标题' }, global });

    expect(layoutStyles(wrapper).rightStyle).toBeUndefined();
    expect(layoutStyles(wrapper).titleStyle).toBeUndefined();
  });

  it('有胶囊时右侧区域让出胶囊，标题不超过胶囊左侧', () => {
    menuButton = { left: 281, top: 34, height: 32 };
    const wrapper = mount(UNavBar, { props: { title: '标题' }, global });

    expect(layoutStyles(wrapper).rightStyle).toEqual({ right: '102px' });
    expect(layoutStyles(wrapper).titleStyle).toEqual({ maxWidth: '171px' });
  });

  it('有胶囊且使用右侧插槽时，标题再让出右侧区域', () => {
    menuButton = { left: 281, top: 34, height: 32 };
    const wrapper = mount(UNavBar, { props: { title: '标题' }, slots: { right: '<text>分享</text>' }, global });

    expect(layoutStyles(wrapper).titleStyle).toEqual({ maxWidth: '75px' });
  });

  it('宽屏时标题最大宽度不超过窗口宽度的 60%', () => {
    windowWidth = 768;
    menuButton = { left: 680, top: 34, height: 32 };
    const wrapper = mount(UNavBar, { props: { title: '标题' }, global });

    expect(layoutStyles(wrapper).titleStyle).toEqual({ maxWidth: `${768 * 0.6}px` });
  });
});
