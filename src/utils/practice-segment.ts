import {
  QuestionType,
  type AnswerStateDto,
  type HiddenReason,
  type PracticeQuestionDto,
  type PracticeQuestionUnitDto,
  type QuestionSolutionDto,
  type SessionQuestionsDto,
} from '@/api';
import { toQuestionView, type QuestionView } from './question-content';

export const SEGMENT_SIZE = 10;
/** 距已加载范围末尾不足该题数时预取下一段 */
export const SEGMENT_PREFETCH = 2;

/** 会话中的一道可作答题 */
export interface PracticeItem {
  index: number;
  question: QuestionView;
  /** 所属材料题，独立题为空 */
  material: QuestionView | null;
  answerState: AnswerStateDto | null;
  solution: QuestionSolutionDto | null;
  hiddenReason: HiddenReason | null;
}

function toItem(
  index: number,
  dto: PracticeQuestionDto | PracticeQuestionUnitDto,
  material: QuestionView | null,
): PracticeItem {
  return {
    index,
    question: toQuestionView(dto),
    material,
    answerState: dto.answerState,
    solution: dto.solution,
    hiddenReason: dto.hiddenReason,
  };
}

/** 分段题目展开为按会话序号排列的可作答题，材料题的小题共享材料 */
export function flattenSegment(segment: Pick<SessionQuestionsDto, 'from' | 'units'>): PracticeItem[] {
  const items: PracticeItem[] = [];
  for (const unit of segment.units) {
    if (unit.type === QuestionType.MATERIAL) {
      const material = { ...toQuestionView(unit), children: [] };
      (unit.children ?? []).forEach(child => items.push(toItem(segment.from + items.length, child, material)));
    } else {
      items.push(toItem(segment.from + items.length, unit, null));
    }
  }
  return items;
}

/** 单题页渲染用：材料题只带当前小题 */
export function pageQuestionOf(item: PracticeItem): QuestionView {
  return item.material ? { ...item.material, children: [item.question] } : item.question;
}

/** 浏览到 index 时需要拉取的起始位置：当前题或预取范围内第一道未加载的题，均已加载时为 null */
export function nextFetchFrom(
  index: number,
  total: number,
  isLoaded: (index: number) => boolean,
  prefetch: number = SEGMENT_PREFETCH,
): number | null {
  const start = Math.max(0, index - 1);
  const end = Math.min(total - 1, index + prefetch);
  if (index >= 0 && index < total && !isLoaded(index)) return index;
  for (let cursor = start; cursor <= end; cursor += 1) {
    if (!isLoaded(cursor)) return cursor;
  }
  return null;
}

export const SWIPER_SLOTS = 3;

/** 3 格循环 swiper 中各格对应的题目序号，越界为 -1 */
export function slotIndexes(currentIndex: number, swiperCurrent: number, total: number): number[] {
  return Array.from({ length: SWIPER_SLOTS }, (_, slot) => {
    const offset = (slot - swiperCurrent + SWIPER_SLOTS) % SWIPER_SLOTS;
    const index = currentIndex + (offset === 0 ? 0 : offset === 1 ? 1 : -1);
    return index >= 0 && index < total ? index : -1;
  });
}

/** 由 swiper 前后两次 current 推算翻页方向：1 下一题，-1 上一题，0 未翻页 */
export function swipeDirection(previous: number, next: number): -1 | 0 | 1 {
  if (previous === next) return 0;
  return (next - previous + SWIPER_SLOTS) % SWIPER_SLOTS === 1 ? 1 : -1;
}
