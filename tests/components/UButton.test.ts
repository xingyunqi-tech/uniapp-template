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

  it('round 添加圆角类，formType 透传给原生按钮', () => {
    const wrapper = mount(UButton, { props: { round: true, formType: 'submit' } });

    expect(wrapper.classes()).toContain('u-button--round');
    expect(wrapper.attributes('form-type')).toBe('submit');
    expect(mount(UButton).classes()).not.toContain('u-button--round');
  });

  it('传入 icon 时在文字前显示图标，加载中隐藏', () => {
    const global = { stubs: { 'uni-icons': { props: ['type'], template: '<i class="icon" :data-type="type" />' } } };
    const wrapper = mount(UButton, { props: { icon: 'plus', text: '新增' }, global });
    const loading = mount(UButton, { props: { icon: 'plus', loading: true }, global });

    expect(wrapper.find('.icon').attributes('data-type')).toBe('plus');
    expect(wrapper.text()).toBe('新增');
    expect(loading.find('.icon').exists()).toBe(false);
  });

  it.each(['error', 'opensetting', 'launchapp', 'agreeprivacyauthorization', 'getphonenumber'])(
    '原生按钮的 %s 事件原样转发',
    async name => {
      const wrapper = mount(UButton, { props: { openType: 'getPhoneNumber' } });
      const detail = { errMsg: name };

      await wrapper.trigger(name, { detail });

      expect(wrapper.emitted(name)).toHaveLength(1);
      expect((wrapper.emitted(name)![0][0] as { detail: unknown }).detail).toEqual(detail);
    },
  );

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
