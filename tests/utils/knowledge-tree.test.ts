import { describe, expect, it } from 'vitest';
import type { PublicKnowledgePointTreeNodeDto } from '@/api';
import { flattenKnowledgeTree, knowledgeProgressText } from '@/utils/knowledge-tree';

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
});

describe('knowledgeProgressText', () => {
  it('进度为 null 时不显示', () => {
    expect(knowledgeProgressText(node('a'))).toBe('');
  });

  it('有做题数时显示已做题数', () => {
    expect(knowledgeProgressText(node('a', [], { answered: 3 }))).toBe('已做 3/10');
  });
});
