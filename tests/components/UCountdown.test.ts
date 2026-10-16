import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import UCountdown from '@/components/UCountdown/index.vue';

interface CountdownExpose {
  start: () => void;
  pause: () => void;
  reset: () => void;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('UCountdown', () => {
  it('按默认格式显示并每秒递减', async () => {
    const wrapper = mount(UCountdown, { props: { time: HOUR + 61_000 } });

    expect(wrapper.text()).toBe('01:01:01');

    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(wrapper.text()).toBe('01:01:00');
  });

  it('格式不含 DD 时天数折算进小时', () => {
    const wrapper = mount(UCountdown, { props: { time: DAY + HOUR, autoStart: false } });

    expect(wrapper.text()).toBe('25:00:00');
  });

  it('支持天数与毫秒占位，hideZeroDay 时天数为 0 隐藏天数部分', async () => {
    const wrapper = mount(UCountdown, {
      props: { time: DAY + 1500, format: 'DD天HH:mm:ss.SSS', millisecond: true, autoStart: false },
    });
    expect(wrapper.text()).toBe('01天00:00:01.500');

    await wrapper.setProps({ time: 1500, hideZeroDay: true });
    expect(wrapper.text()).toBe('00:00:01.500');
  });

  it('endTime 优先于 time', () => {
    const wrapper = mount(UCountdown, { props: { time: 5000, endTime: Date.now() + 10_000, autoStart: false } });

    expect(wrapper.text()).toBe('00:00:10');
  });

  it('倒计时结束触发 finish，过程中触发 change', async () => {
    const wrapper = mount(UCountdown, { props: { time: 2000 } });

    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(wrapper.emitted('change')?.[0]?.[0]).toMatchObject({ seconds: 1, total: 1000 });

    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(wrapper.emitted('finish')).toHaveLength(1);
    expect(wrapper.text()).toBe('00:00:00');
  });

  it('autoStart 为 false 时不计时，start / pause / reset 控制计时', async () => {
    const wrapper = mount(UCountdown, { props: { time: 10_000, autoStart: false } });
    const vm = wrapper.vm as unknown as CountdownExpose;

    vi.advanceTimersByTime(3000);
    await nextTick();
    expect(wrapper.text()).toBe('00:00:10');

    vm.start();
    vi.advanceTimersByTime(3000);
    await nextTick();
    expect(wrapper.text()).toBe('00:00:07');

    vm.pause();
    vi.advanceTimersByTime(3000);
    await nextTick();
    expect(wrapper.text()).toBe('00:00:07');

    vm.reset();
    await nextTick();
    expect(wrapper.text()).toBe('00:00:10');
  });

  it('定时器挂起后按结束时间校正剩余时间', async () => {
    const wrapper = mount(UCountdown, { props: { endTime: Date.now() + 60_000 } });

    vi.setSystemTime(Date.now() + 30_000);
    vi.advanceTimersByTime(1000);
    await nextTick();

    expect(wrapper.text()).toBe('00:00:29');
  });

  it('作用域插槽暴露时间字段', () => {
    const wrapper = mount(UCountdown, {
      props: { time: DAY + 2 * HOUR + 3 * 60_000 + 4000, autoStart: false },
      slots: {
        default: `<template #default="{ days, hours, minutes, seconds, milliseconds }">
          <span class="slot">{{ days }}-{{ hours }}-{{ minutes }}-{{ seconds }}-{{ milliseconds }}</span>
        </template>`,
      },
    });

    expect(wrapper.find('.slot').text()).toBe('1-2-3-4-0');
  });

  it('没有 time 与 endTime 时不计时也不触发 finish', async () => {
    const wrapper = mount(UCountdown);

    vi.advanceTimersByTime(3000);
    await nextTick();

    expect(wrapper.text()).toBe('00:00:00');
    expect(wrapper.emitted('finish')).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('endTime 赋值为未来时间后开始计时', async () => {
    const wrapper = mount(UCountdown, { props: { endTime: undefined } });

    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(wrapper.emitted('finish')).toBeUndefined();

    await wrapper.setProps({ endTime: Date.now() + 5000 });
    expect(wrapper.text()).toBe('00:00:05');

    vi.advanceTimersByTime(2000);
    await nextTick();
    expect(wrapper.text()).toBe('00:00:03');
    expect(wrapper.emitted('finish')).toBeUndefined();
  });

  it('endTime 赋值为已过去的时间时触发一次 finish', async () => {
    const wrapper = mount(UCountdown, { props: { endTime: undefined } });

    await wrapper.setProps({ endTime: Date.now() - 5000 });
    vi.advanceTimersByTime(3000);
    await nextTick();

    expect(wrapper.emitted('finish')).toHaveLength(1);
    expect(wrapper.text()).toBe('00:00:00');
  });

  it('毫秒模式只在秒数变化时触发 change', async () => {
    const wrapper = mount(UCountdown, {
      props: { time: 2000, format: 'ss.SS', millisecond: true },
    });

    vi.advanceTimersByTime(290);
    await nextTick();
    expect(wrapper.text()).toBe('01.71');
    expect(wrapper.emitted('change')).toBeUndefined();

    vi.advanceTimersByTime(910);
    await nextTick();
    expect(wrapper.emitted('change')).toHaveLength(1);

    vi.advanceTimersByTime(800);
    await nextTick();
    expect(wrapper.emitted('change')).toHaveLength(2);
    expect(wrapper.emitted('finish')).toHaveLength(1);
  });

  it('卸载后清除定时器', () => {
    const wrapper = mount(UCountdown, { props: { time: 10_000 } });

    wrapper.unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
