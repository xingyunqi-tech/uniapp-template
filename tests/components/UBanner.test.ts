import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UBanner from '@/components/UBanner/index.vue';

const list = [
  { id: 1, image: '/a.png', title: 'A' },
  { id: 2, image: '/b.png', title: 'B' },
];

function dispatchChange(el: Element, current: number) {
  el.dispatchEvent(new CustomEvent('change', { detail: { current, source: 'touch' } }));
}

describe('UBanner', () => {
  it('按列表渲染轮播项与图片', () => {
    const wrapper = mount(UBanner, { props: { list } });
    const images = wrapper.findAll('.u-banner__image');

    expect(wrapper.findAll('swiper-item')).toHaveLength(2);
    expect(images.map(img => img.attributes('src'))).toEqual(['/a.png', '/b.png']);
    expect(images[0].attributes('mode')).toBe('aspectFill');
  });

  it('使用 imageField 指定的字段作为图片地址', () => {
    const wrapper = mount(UBanner, { props: { list: [{ id: 1, cover: '/c.png' }], imageField: 'cover' } });

    expect(wrapper.find('.u-banner__image').attributes('src')).toBe('/c.png');
  });

  it('字符串高度原样作为轮播高度', () => {
    const wrapper = mount(UBanner, { props: { list, height: '50vh' } });

    expect(wrapper.find('swiper').attributes('style')).toContain('height: 50vh');
  });

  it('切换时更新绑定值并触发 change', () => {
    const wrapper = mount(UBanner, { props: { list } });

    dispatchChange(wrapper.find('swiper').element, 1);

    expect(wrapper.emitted('update:modelValue')).toEqual([[1]]);
    expect(wrapper.emitted('change')).toEqual([[1]]);
  });

  it('点击轮播项时触发 click 并带上数据与索引', async () => {
    const wrapper = mount(UBanner, { props: { list } });

    await wrapper.findAll('swiper-item')[1].trigger('click');

    expect(wrapper.emitted('click')).toEqual([[list[1], 1]]);
  });

  it('content 插槽接收当前项与索引', () => {
    const wrapper = mount(UBanner, {
      props: { list },
      slots: {
        content:
          '<template #content="{ item, index }"><text class="caption">{{ index }}-{{ item.title }}</text></template>',
      },
    });

    expect(wrapper.findAll('.caption').map(node => node.text())).toEqual(['0-A', '1-B']);
  });
});
