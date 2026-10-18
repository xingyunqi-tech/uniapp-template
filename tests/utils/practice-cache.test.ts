import { beforeEach, describe, expect, it } from 'vitest';
import type { AnswerPatchDto } from '@/api';
import {
  acknowledgePatches,
  allocateSeq,
  clearAnswerCache,
  dropPatches,
  enqueuePatch,
  loadAnswerCache,
  saveAnswerCache,
  type AnswerCache,
} from '@/utils/practice-cache';

function patch(questionId: string, clientSeq: number, extra: Partial<AnswerPatchDto> = {}): AnswerPatchDto {
  return { questionId, clientSeq, clientAnsweredAt: '2026-01-01T00:00:00.000Z', ...extra };
}

function cache(pending: AnswerPatchDto[] = [], seq = 0): AnswerCache {
  return { deviceId: 'd1', seq, pending };
}

beforeEach(() => {
  uni.removeStorageSync('uni_practiceAnswers:s1');
});

describe('loadAnswerCache / saveAnswerCache', () => {
  it('按会话 ID 读写缓存', () => {
    saveAnswerCache('s1', cache([patch('q1', 1)], 1));
    expect(loadAnswerCache('s1', 'd1')).toEqual(cache([patch('q1', 1)], 1));
  });

  it('缓存不存在或设备不一致时返回空缓存', () => {
    expect(loadAnswerCache('s1', 'd1')).toEqual(cache());
    saveAnswerCache('s1', cache([patch('q1', 1)], 1));
    expect(loadAnswerCache('s1', 'd2')).toEqual({ deviceId: 'd2', seq: 0, pending: [] });
  });

  it('清除后读取为空缓存', () => {
    saveAnswerCache('s1', cache([patch('q1', 1)], 1));
    clearAnswerCache('s1');
    expect(loadAnswerCache('s1', 'd1').pending).toEqual([]);
  });
});

describe('allocateSeq', () => {
  it('在已用序号与服务端序号中取较大者加 1', () => {
    expect(allocateSeq(cache([], 3)).seq).toBe(4);
    const allocated = allocateSeq(cache([], 3), 10);
    expect(allocated.seq).toBe(11);
    expect(allocated.cache.seq).toBe(11);
  });
});

describe('enqueuePatch', () => {
  it('同一题合并为一条，省略的字段保留先前的值', () => {
    let next = enqueuePatch(cache(), patch('q1', 1, { answer: { keys: ['A'] }, durationSec: 5 }));
    next = enqueuePatch(next, patch('q2', 2, { answer: { keys: ['B'] } }));
    next = enqueuePatch(next, patch('q1', 3, { markedForReview: true }));

    expect(next.pending).toEqual([
      patch('q2', 2, { answer: { keys: ['B'] } }),
      patch('q1', 3, { answer: { keys: ['A'] }, durationSec: 5, markedForReview: true }),
    ]);
  });

  it('清空答案以 null 覆盖原答案', () => {
    const next = enqueuePatch(cache([patch('q1', 1, { answer: { keys: ['A'] } })]), patch('q1', 2, { answer: null }));
    expect(next.pending).toEqual([patch('q1', 2, { answer: null })]);
  });
});

describe('acknowledgePatches', () => {
  it('移除已送达的作答，保留发送期间更新的同题作答', () => {
    const sent = [patch('q1', 1), patch('q2', 2)];
    const current = cache([patch('q1', 3), patch('q2', 2), patch('q3', 4)]);
    expect(acknowledgePatches(current, sent).pending).toEqual([patch('q1', 3), patch('q3', 4)]);
  });
});

describe('dropPatches', () => {
  it('按题目移除作答', () => {
    expect(dropPatches(cache([patch('q1', 1), patch('q2', 2)]), ['q1']).pending).toEqual([patch('q2', 2)]);
  });
});
