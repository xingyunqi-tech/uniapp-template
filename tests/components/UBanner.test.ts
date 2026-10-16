import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UBanner from '@/components/UBanner/index.vue';
import UImage from '@/components/UImage/index.vue';

const global = { components: { UImage }, stubs: { 'uni-icons': true } };

const list = [
  { id: 1, image: '/a.png', title: 'A' },
  { id: 2, image: '/b.png', title: 'B' },
];

function dispatchChange(el: Element, current: number) {
  el.dispatchEvent(new CustomEvent('change', { detail: { current, source: 'touch' } }));
}

describe('UBanner', () => {
  it('按列表渲染轮播项，图片使用 UImage 撑满轮播并沿用裁剪模式', () => {
    const wrapper = mount(UBanner, { props: { list, imageMode: 'aspectFit' }, global });
    const images = wrapper.findAllComponents(UImage);

    expect(wrapper.findAll('swiper-item')).toHaveLength(2);
    expect(images.map(img => img.props('src'))).toEqual(['/a.png', '/b.png']);
    expect(images[0].props()).toMatchObject({ mode: 'aspectFit', width: '100%', height: '100%' });
  });

  it('使用 imageField 指定的字段作为图片地址', () => {
    const wrapper = mount(UBanner, { props: { list: [{ id: 1, cover: '/c.png' }], imageField: 'cover' }, global });

    expect(wrapper.findComponent(UImage).props('src')).toBe('/c.png');
  });

  it('字符串高度原样作为轮播高度', () => {
    const wrapper = mount(UBanner, { props: { list, height: '50vh' }, global });

    expect(wrapper.find('swiper').attributes('style')).toContain('height: 50vh');
  });

  it('切换时更新绑定值并触发 change', () => {
    const wrapper = mount(UBanner, { props: { list }, global });

    dispatchChange(wrapper.find('swiper').element, 1);

    expect(wrapper.emitted('update:modelValue')).toEqual([[1]]);
    expect(wrapper.emitted('change')).toEqual([[1]]);
  });

  it('点击轮播项时触发 click 并带上数据与索引', async () => {
    const wrapper = mount(UBanner, { props: { list }, global });

    await wrapper.findAll('swiper-item')[1].trigger('click');

    expect(wrapper.emitted('click')).toEqual([[list[1], 1]]);
  });

  it('content 插槽接收当前项与索引', () => {
    const wrapper = mount(UBanner, {
      props: { list },
      global,
      slots: {
        content:
          '<template #content="{ item, index }"><text class="caption">{{ index }}-{{ item.title }}</text></template>',
      },
    });

    expect(wrapper.findAll('.caption').map(node => node.text())).toEqual(['0-A', '1-B']);
  });

  it('开启 virtualHost，父组件 class 合并到根节点', () => {
    const wrapper = mount(UBanner, { props: { list }, attrs: { class: 'home-banner' }, global });

    expect((UBanner as { options?: Record<string, unknown> }).options).toMatchObject({ virtualHost: true });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-banner', 'home-banner']));
  });
});
