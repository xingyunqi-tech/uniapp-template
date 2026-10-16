import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import UIcon from '@/components/UIcon/index.vue';

const IconsStub = defineComponent({
  name: 'UniIcons',
  props: {
    type: { type: String, default: '' },
    size: { type: [String, Number], default: '' },
    color: { type: String, default: '' },
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h('i', {
        class: 'icon',
        'data-type': props.type,
        'data-size': props.size,
        'data-color': props.color,
        onClick: (e: Event) => emit('click', e),
      });
  },
});

const global = { stubs: { 'uni-icons': IconsStub } };

describe('UIcon', () => {
  it('name 传给 uni-icons 的 type，尺寸与颜色默认跟随父级', () => {
    const wrapper = mount(UIcon, { props: { name: 'home' }, global });
    const icon = wrapper.find('.icon');

    expect(icon.attributes('data-type')).toBe('home');
    expect(icon.attributes('data-size')).toBe('inherit');
    expect(icon.attributes('data-color')).toBe('inherit');
  });

  it('数字尺寸与纯数字字符串按 rpx 处理', () => {
    const numeric = mount(UIcon, { props: { name: 'home', size: 32 }, global });
    const numericString = mount(UIcon, { props: { name: 'home', size: '28' }, global });

    expect(numeric.find('.icon').attributes('data-size')).toBe('32rpx');
    expect(numericString.find('.icon').attributes('data-size')).toBe('28rpx');
  });

  it('带单位的尺寸原样传递', () => {
    const wrapper = mount(UIcon, { props: { name: 'home', size: '20px', color: 'var(--color-primary)' }, global });
    const icon = wrapper.find('.icon');

    expect(icon.attributes('data-size')).toBe('20px');
    expect(icon.attributes('data-color')).toBe('var(--color-primary)');
  });

  it('点击时触发 click 事件', async () => {
    const wrapper = mount(UIcon, { props: { name: 'trash' }, global });

    await wrapper.find('.icon').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
