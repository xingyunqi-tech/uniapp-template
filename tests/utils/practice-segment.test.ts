import { describe, expect, it } from 'vitest';
import { QuestionType } from '@/api';
import { flattenSegment, nextFetchFrom, pageQuestionOf, slotIndexes, swipeDirection } from '@/utils/practice-segment';
import { answerState, materialUnit, practiceQuestion } from '../fixtures/practice';

describe('flattenSegment', () => {
  it('按会话序号展开独立题与材料小题，小题共享材料', () => {
    const items = flattenSegment({
      from: 8,
      units: [
        practiceQuestion('q8', { answerState: answerState() }),
        materialUnit('m1', [practiceQuestion('q9'), practiceQuestion('q10')]),
      ],
    });

    expect(items.map(item => [item.index, item.question.id])).toEqual([
      [8, 'q8'],
      [9, 'q9'],
      [10, 'q10'],
    ]);
    expect(items[0].material).toBeNull();
    expect(items[0].answerState?.answer).toEqual({ keys: ['A'] });
    expect(items[1].material?.material).toBe('材料 m1');
    expect(items[1].material?.audioUrl).toBe('https://cdn.example.com/m1.mp3');
    expect(items[1].material?.children).toEqual([]);
  });
});

describe('pageQuestionOf', () => {
  it('材料题只带当前小题，独立题返回自身', () => {
    const [standalone, child] = flattenSegment({
      from: 0,
      units: [practiceQuestion('q0'), materialUnit('m1', [practiceQuestion('q1'), practiceQuestion('q2')])],
    });

    expect(pageQuestionOf(standalone).id).toBe('q0');
    const page = pageQuestionOf(child);
    expect(page.type).toBe(QuestionType.MATERIAL);
    expect(page.children.map(item => item.id)).toEqual(['q1']);
  });
});

describe('nextFetchFrom', () => {
  const loaded = (indexes: number[]) => (index: number) => indexes.includes(index);

  it('当前题未加载时从当前题拉取', () => {
    expect(nextFetchFrom(12, 30, loaded([0, 1, 2]))).toBe(12);
  });

  it('接近已加载范围末尾时预取下一段', () => {
    const first = Array.from({ length: 10 }, (_, index) => index);
    expect(nextFetchFrom(5, 30, loaded(first))).toBeNull();
    expect(nextFetchFrom(8, 30, loaded(first))).toBe(10);
  });

  it('向前翻页时补齐上一题', () => {
    expect(nextFetchFrom(10, 30, loaded([10, 11, 12]))).toBe(9);
  });

  it('预取不超出会话题数', () => {
    expect(nextFetchFrom(9, 10, loaded(Array.from({ length: 10 }, (_, index) => index)))).toBeNull();
  });
});

describe('slotIndexes / swipeDirection', () => {
  it('当前格为当前题，后一格为下一题，前一格为上一题', () => {
    expect(slotIndexes(5, 0, 10)).toEqual([5, 6, 4]);
    expect(slotIndexes(5, 1, 10)).toEqual([4, 5, 6]);
    expect(slotIndexes(5, 2, 10)).toEqual([6, 4, 5]);
  });

  it('越界的格为 -1', () => {
    expect(slotIndexes(0, 0, 3)).toEqual([0, 1, -1]);
    expect(slotIndexes(2, 1, 3)).toEqual([1, 2, -1]);
  });

  it('循环翻页方向', () => {
    expect(swipeDirection(0, 1)).toBe(1);
    expect(swipeDirection(2, 0)).toBe(1);
    expect(swipeDirection(0, 2)).toBe(-1);
    expect(swipeDirection(1, 0)).toBe(-1);
    expect(swipeDirection(1, 1)).toBe(0);
  });
});
