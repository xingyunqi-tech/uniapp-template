import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UPasswordStrength from '@/components/UPasswordStrength/index.vue';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/constants/form';

const global = { stubs: { 'uni-icons': true } };

describe('UPasswordStrength', () => {
  it('按密码计算强度并点亮对应数量的强度条', () => {
    const wrapper = mount(UPasswordStrength, { props: { password: 'abc12345' }, global });
    const bars = wrapper.findAll('.strength-bar');

    expect(bars.map(bar => bar.classes().includes('active'))).toEqual([true, true, false]);
    expect(wrapper.find('.strength-text').text()).toBe('中');
    expect(wrapper.find('.strength-text').classes()).toContain('medium');
  });

  it('默认显示长度、字母、数字规则并标记是否满足', () => {
    const wrapper = mount(UPasswordStrength, { props: { password: 'abcdefgh' }, global });
    const rules = wrapper.findAll('.rule-item');

    expect(rules.map(rule => rule.text())).toEqual([
      `长度${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位`,
      '包含字母',
      '包含数字',
    ]);
    expect(rules.map(rule => rule.classes().includes('valid'))).toEqual([true, true, false]);
  });

  it('密码变化时重新计算', async () => {
    const wrapper = mount(UPasswordStrength, { props: { password: '' }, global });

    expect(wrapper.findAll('.strength-bar.active')).toHaveLength(0);

    await wrapper.setProps({ password: 'abcdef123456!' });

    expect(wrapper.findAll('.strength-bar.active')).toHaveLength(3);
    expect(wrapper.find('.strength-text').text()).toBe('强');
  });

  it('按 rules 控制规则项和长度范围', async () => {
    const wrapper = mount(UPasswordStrength, {
      props: {
        password: '12345!',
        rules: { minLength: 6, maxLength: 12, requireLetter: false, requireSpecialChar: true },
      },
      global,
    });
    const rules = () => wrapper.findAll('.rule-item');

    expect(rules().map(rule => rule.text())).toEqual(['长度6-12位', '包含数字', '包含特殊字符']);
    expect(rules().map(rule => rule.classes().includes('valid'))).toEqual([true, true, true]);

    await wrapper.setProps({ rules: { minLength: 8 } });

    expect(rules()[0].text()).toBe(`长度8-${PASSWORD_MAX_LENGTH}位`);
    expect(rules()[0].classes()).not.toContain('valid');
  });

  it('可隐藏强度条和规则', () => {
    const wrapper = mount(UPasswordStrength, {
      props: { password: 'abc123', showStrengthBar: false, showRules: false },
      global,
    });

    expect(wrapper.find('.strength-bar-section').exists()).toBe(false);
    expect(wrapper.find('.rules-section').exists()).toBe(false);
  });

  it('showRulesTitle 显示标题，horizontal 为 false 时不水平排列', () => {
    const wrapper = mount(UPasswordStrength, {
      props: { password: 'abc123', showRulesTitle: true, horizontal: false },
      global,
    });

    expect(wrapper.find('.rules-title').text()).toBe('密码要求：');
    expect(wrapper.find('.rules-list').classes()).not.toContain('horizontal');
  });
});
