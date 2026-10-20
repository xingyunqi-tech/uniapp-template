import type { PublicKnowledgePointTreeNodeDto } from '@/api';
import { formatMastery, MASTERY_INSUFFICIENT_TEXT } from './study-stats';

export interface KnowledgeTreeRow {
  node: PublicKnowledgePointTreeNodeDto;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  /** 自身或子孙节点有已发布题目 */
  hasQuestions: boolean;
}

/** 自身或子孙节点是否有已发布题目 */
export function hasKnowledgeQuestions(node: PublicKnowledgePointTreeNodeDto): boolean {
  return node.questionCount > 0 || node.children.some(hasKnowledgeQuestions);
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
    const row: KnowledgeTreeRow = { node, depth, hasChildren, expanded, hasQuestions: hasKnowledgeQuestions(node) };
    return expanded ? [row, ...flattenKnowledgeTree(node.children, expandedIds, depth + 1)] : [row];
  });
}

/** 已做题数 / 题目数，个人进度为 null 时返回空字符串 */
export function knowledgeProgressText(node: PublicKnowledgePointTreeNodeDto): string {
  const progress = node.progress;
  return progress ? `已做 ${progress.answeredQuestionCount}/${progress.questionCount}` : '';
}

/** 掌握度文字，作答不足时为「数据不足」，个人进度为 null 时返回空字符串 */
export function knowledgeMasteryText(node: PublicKnowledgePointTreeNodeDto): string {
  const progress = node.progress;
  if (!progress) return '';
  return progress.mastery === null ? MASTERY_INSUFFICIENT_TEXT : `掌握度 ${formatMastery(progress.mastery)}`;
}
