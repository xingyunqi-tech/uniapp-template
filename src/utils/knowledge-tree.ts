import type { PublicKnowledgePointTreeNodeDto } from '@/api';

export interface KnowledgeTreeRow {
  node: PublicKnowledgePointTreeNodeDto;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

/** 按展开状态展开为可见行，父节点在前 */
export function flattenKnowledgeTree(
  nodes: PublicKnowledgePointTreeNodeDto[],
  expandedIds: ReadonlySet<string>,
  depth = 0,
): KnowledgeTreeRow[] {
  return nodes.flatMap(node => {
    const hasChildren = node.children.length > 0;
    const expanded = hasChildren && expandedIds.has(node.id);
    const row: KnowledgeTreeRow = { node, depth, hasChildren, expanded };
    return expanded ? [row, ...flattenKnowledgeTree(node.children, expandedIds, depth + 1)] : [row];
  });
}

/** 个人进度为 null 或缺少做题数时返回空字符串 */
export function knowledgeProgressText(node: PublicKnowledgePointTreeNodeDto): string {
  const answered = node.progress?.answered;
  return typeof answered === 'number' ? `已做 ${answered}/${node.questionCount}` : '';
}
