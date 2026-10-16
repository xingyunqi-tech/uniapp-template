import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import UFixedButton from '@/components/UFixedButton/index.vue';

const UButtonStub = defineComponent({
  name: 'UButton',
  props: {
    type: { type: String, default: '' },
    block: Boolean,
    text: { type: String, default: '' },
    loading: Boolean,
    disabled: Boolean,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { class: 'btn', onClick: () => emit('click') }, props.text);
  },
});

const global = { stubs: { UButton: UButtonStub } };

describe('UFixedButton', () => {
  it('默认渲染撑满的主色按钮与默认文字', () => {
    const wrapper = mount(UFixedButton, { global });

    expect(wrapper.findComponent(UButtonStub).props()).toMatchObject({ type: 'primary', block: true, text: '确定' });
  });

  it('加载中显示加载文字并透传 loading', () => {
    const wrapper = mount(UFixedButton, { props: { loading: true, loadingText: '保存中' }, global });

    expect(wrapper.findComponent(UButtonStub).props()).toMatchObject({ text: '保存中', loading: true });
  });

  it('点击按钮触发 click', async () => {
    const wrapper = mount(UFixedButton, { global });

    await wrapper.find('.btn').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('禁用或加载中时点击不触发 click', async () => {
    const disabled = mount(UFixedButton, { props: { disabled: true }, global });
    const loading = mount(UFixedButton, { props: { loading: true }, global });

    await disabled.find('.btn').trigger('click');
    await loading.find('.btn').trigger('click');

    expect(disabled.emitted('click')).toBeUndefined();
    expect(loading.emitted('click')).toBeUndefined();
  });
});
