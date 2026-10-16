import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UPrice from '@/components/UPrice/index.vue';

const text = (wrapper: ReturnType<typeof mount>, selector: string) => wrapper.find(selector).text();

describe('UPrice', () => {
  it('默认按分换算为元，整数与小数分开渲染', () => {
    const wrapper = mount(UPrice, { props: { value: 12990 } });

    expect(text(wrapper, '.u-price__symbol')).toBe('¥');
    expect(text(wrapper, '.u-price__integer')).toBe('129');
    expect(text(wrapper, '.u-price__decimal')).toBe('.90');
  });

  it('unit 为 yuan 时不换算', () => {
    const wrapper = mount(UPrice, { props: { value: '8.5', unit: 'yuan' } });

    expect(text(wrapper, '.u-price__integer')).toBe('8');
    expect(text(wrapper, '.u-price__decimal')).toBe('.50');
  });

  it('整数部分按千分位分隔', () => {
    const wrapper = mount(UPrice, { props: { value: 123456789 } });

    expect(text(wrapper, '.u-price__integer')).toBe('1,234,567');
  });

  it('负数显示负号', () => {
    const wrapper = mount(UPrice, { props: { value: -2050 } });

    expect(text(wrapper, '.u-price__sign')).toBe('-');
    expect(text(wrapper, '.u-price__integer')).toBe('20');
  });

  it('四舍五入后为 0 的负数不显示负号', () => {
    const wrapper = mount(UPrice, { props: { value: -0.4 } });

    expect(wrapper.find('.u-price__sign').exists()).toBe(false);
    expect(wrapper.text()).toBe('¥0.00');
  });

  it('trimZero 去掉小数末尾的 0，全为 0 时不显示小数', () => {
    const half = mount(UPrice, { props: { value: 950, trimZero: true } });
    const whole = mount(UPrice, { props: { value: 1000, trimZero: true } });

    expect(text(half, '.u-price__decimal')).toBe('.5');
    expect(whole.find('.u-price__decimal').exists()).toBe(false);
  });

  it('decimals 为 0 时不显示小数', () => {
    const wrapper = mount(UPrice, { props: { value: 12990, decimals: 0 } });

    expect(text(wrapper, '.u-price__integer')).toBe('130');
    expect(wrapper.find('.u-price__decimal').exists()).toBe(false);
  });

  it('元单位按十进制四舍五入', () => {
    const wrapper = mount(UPrice, { props: { value: 1.005, unit: 'yuan' } });

    expect(wrapper.text()).toBe('¥1.01');
  });

  it('字符串金额可带千分位逗号', () => {
    const wrapper = mount(UPrice, { props: { value: '1,299.5', unit: 'yuan' } });

    expect(wrapper.text()).toBe('¥1,299.50');
  });

  it('decimals 超出范围时按 0~10 截取', () => {
    const negative = mount(UPrice, { props: { value: 12990, decimals: -1 } });
    const large = mount(UPrice, { props: { value: 100, decimals: 200 } });

    expect(negative.text()).toBe('¥130');
    expect(large.find('.u-price__decimal').text()).toBe('.0000000000');
  });

  it('非数字按 0 显示', () => {
    const wrapper = mount(UPrice, { props: { value: 'abc' } });

    expect(wrapper.text()).toBe('¥0.00');
  });

  it('original 时使用划线样式且不加粗', () => {
    const wrapper = mount(UPrice, { props: { value: 100, original: true, size: 'small' } });

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-price--original', 'u-price--small']));
    expect(wrapper.classes()).not.toContain('u-price--bold');
  });

  it('自定义货币符号与颜色类型', () => {
    const wrapper = mount(UPrice, { props: { value: 100, symbol: '$', type: 'primary' } });

    expect(text(wrapper, '.u-price__symbol')).toBe('$');
    expect(wrapper.classes()).toContain('u-price--primary');
  });
});
