import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UEmpty from '@/components/UEmpty/index.vue';

const global = { stubs: { 'uni-icons': { props: ['type'], template: '<i class="icon" :data-type="type" />' } } };

describe('UEmpty', () => {
  it('按类型显示对应图标与默认文字', () => {
    const wrapper = mount(UEmpty, { props: { type: 'search' }, global });

    expect(wrapper.find('.icon').attributes('data-type')).toBe('search');
    expect(wrapper.find('.u-empty__text').text()).toBe('暂无数据');
  });

  it('传入 icon 时覆盖类型对应的图标', () => {
    const wrapper = mount(UEmpty, { props: { type: 'search', icon: 'star', text: '暂无收藏' }, global });

    expect(wrapper.find('.icon').attributes('data-type')).toBe('star');
    expect(wrapper.find('.u-empty__text').text()).toBe('暂无收藏');
  });

  it('只有传入默认插槽时才渲染操作区', () => {
    const plain = mount(UEmpty, { global });
    const withAction = mount(UEmpty, { slots: { default: '<button>重试</button>' }, global });

    expect(plain.find('.u-empty__action').exists()).toBe(false);
    expect(withAction.find('.u-empty__action').text()).toBe('重试');
  });

  it('开启 virtualHost，父组件 class 合并到根节点', () => {
    const wrapper = mount(UEmpty, { attrs: { class: 'detail-error' }, global });

    expect((UEmpty as { options?: Record<string, unknown> }).options).toMatchObject({ virtualHost: true });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-empty', 'detail-error']));
  });
});
