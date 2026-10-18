import { describe, expect, it } from 'vitest';
import { clockOffset, formatClock, formatDuration, remainingSeconds, serverTime } from '@/utils/practice-clock';

const LOCAL = new Date('2026-01-01T08:10:00.000Z').getTime();

describe('clockOffset / serverTime', () => {
  it('本地时间快 10 分钟时偏移为 -10 分钟', () => {
    const offset = clockOffset('2026-01-01T08:00:00.000Z', LOCAL);
    expect(offset).toBe(-600_000);
    expect(serverTime(offset, LOCAL)).toBe(new Date('2026-01-01T08:00:00.000Z').getTime());
  });

  it('服务端时间无法解析时不校准', () => {
    expect(clockOffset('invalid', LOCAL)).toBe(0);
  });
});

describe('remainingSeconds', () => {
  it('按服务端时间计算剩余秒数，不受本地时钟偏差影响', () => {
    const offset = clockOffset('2026-01-01T08:00:00.000Z', LOCAL);
    expect(remainingSeconds('2026-01-01T09:00:00.000Z', offset, LOCAL)).toBe(3600);
    expect(remainingSeconds('2026-01-01T09:00:00.000Z', offset, LOCAL + 1500)).toBe(3599);
  });

  it('超过截止时间为 0，没有截止时间为 null', () => {
    expect(remainingSeconds('2026-01-01T08:00:00.000Z', 0, LOCAL)).toBe(0);
    expect(remainingSeconds(null, 0, LOCAL)).toBeNull();
  });
});

describe('formatClock / formatDuration', () => {
  it('倒计时不足 1 小时省略小时', () => {
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(3725)).toBe('01:02:05');
    expect(formatClock(-3)).toBe('00:00');
  });

  it('用时省略前导的 0 单位', () => {
    expect(formatDuration(45)).toBe('45 秒');
    expect(formatDuration(125)).toBe('2 分 5 秒');
    expect(formatDuration(3720)).toBe('1 小时 2 分');
  });
});
