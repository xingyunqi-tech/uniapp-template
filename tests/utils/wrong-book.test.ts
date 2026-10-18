import { describe, expect, it } from 'vitest';
import {
  buildWrongBookParams,
  DEFAULT_WRONG_BOOK_FILTER,
  optionLabel,
  previewText,
  WRONG_SORT_OPTIONS,
  type WrongBookFilter,
} from '@/utils/wrong-book';

function filter(overrides: Partial<WrongBookFilter> = {}): WrongBookFilter {
  return { ...DEFAULT_WRONG_BOOK_FILTER, ...overrides };
}

const NOW = Date.parse('2026-10-17T02:00:00Z');

describe('buildWrongBookParams', () => {
  it('默认查询 ACTIVE，按最近答错倒序，不带其他筛选', () => {
    expect(buildWrongBookParams(filter(), NOW)).toEqual({
      status: 'ACTIVE',
      sortBy: 'lastWrongAt',
      order: 'DESC',
    });
  });

  it('带上科目、知识点与已移出状态', () => {
    expect(buildWrongBookParams(filter({ status: 'MASTERED', subjectId: 's1', knowledgePointId: 'k1' }), NOW)).toEqual(
      expect.objectContaining({ status: 'MASTERED', subjectId: 's1', knowledgePointId: 'k1' }),
    );
  });

  it('错误次数映射为上下限', () => {
    expect(buildWrongBookParams(filter({ count: 'once' }), NOW)).toMatchObject({ minWrongCount: 1, maxWrongCount: 1 });
    expect(buildWrongBookParams(filter({ count: 'twice' }), NOW)).toMatchObject({ minWrongCount: 2, maxWrongCount: 2 });
    const many = buildWrongBookParams(filter({ count: 'many' }), NOW);
    expect(many.minWrongCount).toBe(3);
    expect(many).not.toHaveProperty('maxWrongCount');
  });

  it('时间范围从东八区自然日零点起算', () => {
    expect(buildWrongBookParams(filter({ time: 'today' }), NOW).lastWrongFrom).toBe('2026-10-17T00:00:00+08:00');
    expect(buildWrongBookParams(filter({ time: 'week' }), NOW).lastWrongFrom).toBe('2026-10-11T00:00:00+08:00');
    expect(buildWrongBookParams(filter({ time: 'month' }), NOW).lastWrongFrom).toBe('2026-09-18T00:00:00+08:00');
  });

  it('UTC 已是前一天时仍按东八区当天计算', () => {
    const lateNight = Date.parse('2026-10-16T16:30:00Z');

    expect(buildWrongBookParams(filter({ time: 'today' }), lateNight).lastWrongFrom).toBe('2026-10-17T00:00:00+08:00');
  });

  it('排序方式映射为排序字段', () => {
    expect(buildWrongBookParams(filter({ sort: 'added' }), NOW).sortBy).toBe('firstWrongAt');
    expect(buildWrongBookParams(filter({ sort: 'count' }), NOW).sortBy).toBe('wrongCount');
  });
});

describe('optionLabel', () => {
  it('返回选项文字，未知值为空字符串', () => {
    expect(optionLabel(WRONG_SORT_OPTIONS, 'count')).toBe('错误次数最多');
    expect(optionLabel(WRONG_SORT_OPTIONS, 'unknown' as never)).toBe('');
  });
});

describe('previewText', () => {
  it('合并空白、替换图片并截断', () => {
    expect(previewText('第一行\n\n![图](https://a.com/x.png)  第二行')).toBe('第一行 [图片] 第二行');
    expect(previewText('一二三四五六', 4)).toBe('一二三四…');
  });

  it('去掉常见 Markdown 标记', () => {
    expect(previewText('## 标题\n> 引用 **加粗** *斜体* `代码` [链接](https://a.com)')).toBe(
      '标题 引用 加粗 斜体 代码 链接',
    );
    expect(previewText('- 甲\n- 乙\n1. 丙')).toBe('甲 乙 丙');
    expect(previewText('| A | B |')).toBe('A B');
  });

  it('公式显示为 [公式]，转义的 $ 保留为字符', () => {
    expect(previewText('求 $x^2+1$ 的值')).toBe('求 [公式] 的值');
    expect(previewText('已知 $$\\frac{1}{2}$$ 成立')).toBe('已知 [公式] 成立');
    expect(previewText('价格 \\$5 与 $ 10')).toBe('价格 $5 与 $ 10');
  });

  it('空内容返回空字符串', () => {
    expect(previewText(null)).toBe('');
    expect(previewText('   ')).toBe('');
  });
});
