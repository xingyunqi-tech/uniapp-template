import { describe, expect, it } from 'vitest';
import type { PublicKnowledgePointTreeNodeDto } from '@/api';
import { flattenKnowledgeTree, knowledgeMasteryText, knowledgeProgressText } from '@/utils/knowledge-tree';

function node(
  id: string,
  children: PublicKnowledgePointTreeNodeDto[] = [],
  progress: PublicKnowledgePointTreeNodeDto['progress'] = null,
): PublicKnowledgePointTreeNodeDto {
  return {
    id,
    subjectId: 's1',
    parentId: null,
    name: id,
    level: 1,
    sort: 0,
    path: `/${id}/`,
    isLeaf: children.length === 0,
    questionCount: 10,
    createdAt: '',
    updatedAt: '',
    children,
    progress,
  };
}

const tree = [node('a', [node('a1', [node('a1x')]), node('a2')]), node('b')];

describe('flattenKnowledgeTree', () => {
  it('未展开时只显示第一级', () => {
    expect(flattenKnowledgeTree(tree, new Set()).map(row => row.node.id)).toEqual(['a', 'b']);
  });

  it('展开的节点在其后显示子节点并记录层级', () => {
    const rows = flattenKnowledgeTree(tree, new Set(['a', 'a1']));

    expect(rows.map(row => [row.node.id, row.depth, row.expanded])).toEqual([
      ['a', 0, true],
      ['a1', 1, true],
      ['a1x', 2, false],
      ['a2', 1, false],
      ['b', 0, false],
    ]);
  });

  it('父节点未展开时子节点的展开状态不生效', () => {
    expect(flattenKnowledgeTree(tree, new Set(['a1'])).map(row => row.node.id)).toEqual(['a', 'b']);
  });

  it('叶子节点没有子节点也不会展开', () => {
    const [row] = flattenKnowledgeTree([node('leaf')], new Set(['leaf']));

    expect(row).toMatchObject({ hasChildren: false, expanded: false });
  });

  it('只有子孙节点挂题时父节点也标记为有题', () => {
    const empty = (id: string, children: PublicKnowledgePointTreeNodeDto[] = []) => ({
      ...node(id, children),
      questionCount: 0,
    });
    const rows = flattenKnowledgeTree(
      [empty('a', [empty('a1', [node('a1x')])]), empty('b', [empty('b1')])],
      new Set(['a', 'a1', 'b']),
    );

    expect(rows.map(row => [row.node.id, row.hasQuestions])).toEqual([
      ['a', true],
      ['a1', true],
      ['a1x', true],
      ['b', false],
      ['b1', false],
    ]);
  });
});

function progress(overrides: Partial<NonNullable<PublicKnowledgePointTreeNodeDto['progress']>> = {}) {
  return { answeredQuestionCount: 3, questionCount: 8, answered: 6, correct: 4, mastery: 62.5, ...overrides };
}

describe('knowledgeProgressText', () => {
  it('进度为 null 时不显示', () => {
    expect(knowledgeProgressText(node('a'))).toBe('');
  });

  it('显示子树内已做题数与题目数', () => {
    expect(knowledgeProgressText(node('a', [], progress()))).toBe('已做 3/8');
  });
});

describe('knowledgeMasteryText', () => {
  it('进度为 null 时不显示', () => {
    expect(knowledgeMasteryText(node('a'))).toBe('');
  });

  it('掌握度取整显示百分比', () => {
    expect(knowledgeMasteryText(node('a', [], progress({ mastery: 62.5 })))).toBe('掌握度 63%');
  });

  it('掌握度为 null 时显示数据不足', () => {
    expect(knowledgeMasteryText(node('a', [], progress({ mastery: null })))).toBe('数据不足');
  });
});
