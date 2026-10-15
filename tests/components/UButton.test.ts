import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UButton from '@/components/UButton/index.vue';

describe('UButton', () => {
  it('按类型与尺寸生成样式类，默认显示 text', () => {
    const wrapper = mount(UButton, { props: { type: 'primary', size: 'small', block: true, text: '提交' } });

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['u-button', 'u-button--primary', 'u-button--small', 'u-button--block']),
    );
    expect(wrapper.text()).toBe('提交');
  });

  it('传入插槽时显示插槽内容', () => {
    const wrapper = mount(UButton, { props: { text: '忽略' }, slots: { default: '添加新地址' } });

    expect(wrapper.text()).toBe('添加新地址');
  });

  it('点击时触发 click', async () => {
    const wrapper = mount(UButton);

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it.each<{ disabled?: boolean; loading?: boolean }>([{ disabled: true }, { loading: true }])(
    '%o 时不触发 click 并禁用原生按钮',
    async props => {
      const wrapper = mount(UButton, { props });

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toBeUndefined();
      expect(wrapper.attributes('disabled')).toBeDefined();
      expect(wrapper.classes()).toContain('u-button--disabled');
    },
  );
});
