import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import USearchBar from '@/components/USearchBar/index.vue';
import { storage } from '@/utils/storage';

vi.mock('@/store/modules/global', () => ({
  useGlobalStore: () => ({ themeClass: 'theme-light' }),
}));

const HISTORY_KEY = 'test_search_history';
const global = { stubs: { 'uni-icons': true } };

function mountBar(props: Record<string, unknown> = {}) {
  return mount(USearchBar, { props: { historyKey: HISTORY_KEY, ...props }, global });
}

beforeEach(() => {
  storage.remove(HISTORY_KEY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('USearchBar', () => {
  it('输入时更新绑定值，防抖结束后触发去除首尾空格的 search', async () => {
    vi.useFakeTimers();
    const wrapper = mountBar({ debounceTime: 300 });
    const input = wrapper.find('input');

    await input.trigger('input', { detail: { value: ' 手' } });
    await input.trigger('input', { detail: { value: ' 手机 ' } });
    vi.advanceTimersByTime(299);
    expect(wrapper.emitted('search')).toBeUndefined();

    vi.advanceTimersByTime(1);
    expect(wrapper.emitted('update:modelValue')).toEqual([[' 手'], [' 手机 ']]);
    expect(wrapper.emitted('search')).toEqual([['手机']]);
  });

  it('debounceTime 为 0 时输入不自动搜索', async () => {
    vi.useFakeTimers();
    const wrapper = mountBar({ debounceTime: 0 });

    await wrapper.find('input').trigger('input', { detail: { value: '手机' } });
    vi.runAllTimers();

    expect(wrapper.emitted('search')).toBeUndefined();
  });

  it('回车确认时立即搜索、写入历史并取消待触发的防抖搜索', async () => {
    vi.useFakeTimers();
    const wrapper = mountBar();
    await wrapper.find('input').trigger('input', { detail: { value: '耳机' } });
    await wrapper.setProps({ modelValue: ' 耳机 ' });

    await wrapper.find('input').trigger('confirm');
    vi.runAllTimers();

    expect(wrapper.emitted('search')).toEqual([['耳机']]);
    expect(storage.get(HISTORY_KEY)).toEqual(['耳机']);
  });

  it('点击清空按钮清空内容并触发 clear，禁用时不显示清空按钮', async () => {
    const wrapper = mountBar({ modelValue: '手机' });

    await wrapper.find('.u-search-bar__clear').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.emitted('clear')).toHaveLength(1);

    await wrapper.setProps({ disabled: true });
    expect(wrapper.find('.u-search-bar__clear').exists()).toBe(false);
  });

  it('聚焦时显示取消按钮和历史面板，失焦 150ms 后收起', async () => {
    vi.useFakeTimers();
    storage.set(HISTORY_KEY, ['手机', '耳机']);
    const wrapper = mountBar({ cancelText: '关闭' });

    await wrapper.find('input').trigger('focus');
    expect(wrapper.emitted('focus')).toHaveLength(1);
    expect(wrapper.find('.u-search-bar__cancel').text()).toBe('关闭');
    expect(wrapper.findAll('.u-search-bar__tag-text').map(t => t.text())).toEqual(['手机', '耳机']);

    await wrapper.find('input').trigger('blur');
    expect(wrapper.emitted('blur')).toHaveLength(1);
    vi.advanceTimersByTime(150);
    await nextTick();
    expect(wrapper.find('.u-search-bar__panel').exists()).toBe(false);
  });

  it('点击取消按钮清空内容、收起并触发 cancel', async () => {
    const wrapper = mountBar();
    await wrapper.find('input').trigger('focus');

    await wrapper.find('.u-search-bar__cancel').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.find('.u-search-bar__cancel').exists()).toBe(false);
  });

  it('选择历史或热门关键词时回填、搜索并置顶到历史', async () => {
    storage.set(HISTORY_KEY, ['手机', '耳机']);
    const wrapper = mountBar({ hotKeywords: ['平板'] });
    await wrapper.find('input').trigger('focus');

    await wrapper.findAll('.u-search-bar__tag')[1].trigger('click');
    expect(wrapper.emitted('selectHistory')).toEqual([['耳机']]);
    expect(storage.get(HISTORY_KEY)).toEqual(['耳机', '手机']);

    await wrapper.find('input').trigger('focus');
    await wrapper.find('.u-search-bar__tag--hot').trigger('click');
    expect(wrapper.emitted('selectHot')).toEqual([['平板']]);
    expect(wrapper.emitted('search')).toEqual([['耳机'], ['平板']]);
    expect(wrapper.emitted('update:modelValue')).toEqual([['耳机'], ['平板']]);
    expect(storage.get(HISTORY_KEY)).toEqual(['平板', '耳机', '手机']);
  });

  it('删除单条历史不触发选择，清空历史后显示空状态', async () => {
    storage.set(HISTORY_KEY, ['手机', '耳机']);
    const wrapper = mountBar();
    await wrapper.find('input').trigger('focus');

    await wrapper.findAll('.u-search-bar__tag-close')[0].trigger('click');
    expect(wrapper.findAll('.u-search-bar__tag-text').map(t => t.text())).toEqual(['耳机']);
    expect(wrapper.emitted('selectHistory')).toBeUndefined();

    await wrapper.find('.u-search-bar__section-action').trigger('click');
    expect(wrapper.find('.u-search-bar__empty').text()).toBe('暂无搜索历史');
    expect(storage.get(HISTORY_KEY)).toBeNull();
  });
});
