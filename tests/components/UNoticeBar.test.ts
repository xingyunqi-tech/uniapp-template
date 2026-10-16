import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import UNoticeBar from '@/components/UNoticeBar/index.vue';

const NoticeBarStub = defineComponent({
  name: 'UniNoticeBar',
  props: {
    text: { type: String, default: '' },
    backgroundColor: { type: String, default: '' },
    color: { type: String, default: '' },
    showClose: Boolean,
    showGetMore: Boolean,
    scrollable: Boolean,
    single: Boolean,
  },
  emits: ['click', 'close', 'getmore'],
  setup(props, { slots }) {
    return () => h('div', { class: 'notice' }, slots.default?.() ?? props.text);
  },
});

const global = { stubs: { 'uni-notice-bar': NoticeBarStub } };

describe('UNoticeBar', () => {
  it('透传文字与开关配置', () => {
    const wrapper = mount(UNoticeBar, {
      props: { text: '系统维护', showClose: true, showMore: true, scrollable: true },
      global,
    });
    const bar = wrapper.findComponent(NoticeBarStub);

    expect(bar.props()).toMatchObject({
      text: '系统维护',
      showClose: true,
      showGetMore: true,
      scrollable: true,
      single: true,
    });
  });

  it('按类型设置主题类与颜色', () => {
    const wrapper = mount(UNoticeBar, { props: { type: 'error' }, global });
    const bar = wrapper.findComponent(NoticeBarStub);

    expect(wrapper.classes()).toContain('u-notice-bar--error');
    expect(bar.props('backgroundColor')).toBe('var(--color-error-bg)');
    expect(bar.props('color')).toBe('var(--color-error)');
  });

  it('默认插槽替换通知文字', () => {
    const wrapper = mount(UNoticeBar, { props: { text: '文字' }, slots: { default: '<b>插槽内容</b>' }, global });

    expect(wrapper.find('.notice').text()).toBe('插槽内容');
  });

  it('点击与查看更多分别触发 click 和 more', () => {
    const wrapper = mount(UNoticeBar, { global });
    const bar = wrapper.findComponent(NoticeBarStub);

    bar.vm.$emit('click');
    bar.vm.$emit('getmore');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('more')).toHaveLength(1);
  });

  it('关闭后隐藏并触发 close', async () => {
    const wrapper = mount(UNoticeBar, { props: { showClose: true }, global });

    wrapper.findComponent(NoticeBarStub).vm.$emit('close');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.find('.u-notice-bar').exists()).toBe(false);
  });

  it('通过 hide / show 控制显隐', async () => {
    const wrapper = mount(UNoticeBar, { global });

    wrapper.vm.hide();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.u-notice-bar').exists()).toBe(false);

    wrapper.vm.show();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.u-notice-bar').exists()).toBe(true);
  });
});
