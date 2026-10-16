import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import USkeleton from '@/components/USkeleton/index.vue';

describe('USkeleton', () => {
  it('列表类型按 rows 渲染，段落最后一行宽度较短', () => {
    const wrapper = mount(USkeleton, { props: { rows: 2, paragraphRows: 3 } });
    const rows = wrapper.findAll('.u-skeleton__list-item')[0].findAll('.u-skeleton__row');

    expect(wrapper.classes()).toContain('u-skeleton--animated');
    expect(wrapper.findAll('.u-skeleton__list-item')).toHaveLength(2);
    expect(rows).toHaveLength(3);
    expect(rows[2].attributes('style')).toContain('width: 60%');
    expect(rows[0].attributes('style')).toBeUndefined();
  });

  it('开启头像时按形状渲染头像', () => {
    const wrapper = mount(USkeleton, { props: { rows: 1, avatar: true, avatarShape: 'square' } });

    expect(wrapper.find('.u-skeleton__avatar').classes()).toContain('u-skeleton__avatar--square');
  });

  it('按类型渲染对应布局，custom 类型渲染默认插槽', () => {
    const card = mount(USkeleton, { props: { type: 'card', rows: 2, animated: false } });
    const form = mount(USkeleton, { props: { type: 'form', rows: 4 } });
    const custom = mount(USkeleton, { props: { type: 'custom' }, slots: { default: '<div class="mine" />' } });

    expect(card.classes()).not.toContain('u-skeleton--animated');
    expect(card.findAll('.u-skeleton__card')).toHaveLength(2);
    expect(form.findAll('.u-skeleton__form-item')).toHaveLength(4);
    expect(custom.find('.mine').exists()).toBe(true);
  });

  it('加载结束后渲染 content 插槽', () => {
    const wrapper = mount(USkeleton, { props: { loading: false }, slots: { content: '<div class="real">内容</div>' } });

    expect(wrapper.find('.u-skeleton').exists()).toBe(false);
    expect(wrapper.find('.real').text()).toBe('内容');
  });
});
