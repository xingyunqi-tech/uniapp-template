import {
  PracticeMode,
  PracticeSessionStatus,
  QuestionType,
  type AnswerCardItemDto,
  type AnswerStateDto,
  type CreatePracticeSessionResultDto,
  type PracticeQuestionDto,
  type PracticeQuestionUnitDto,
} from '@/api';

export function practiceQuestion(id: string, overrides: Partial<PracticeQuestionDto> = {}): PracticeQuestionDto {
  return {
    id,
    subjectId: 'sub1',
    parentId: null,
    type: QuestionType.SINGLE,
    version: 1,
    stem: `题目 ${id}`,
    options: [
      { key: 'A', content: '甲' },
      { key: 'B', content: '乙' },
    ],
    material: null,
    audioFileId: null,
    audioUrl: null,
    blankCount: null,
    difficulty: 1,
    knowledgePointIds: [],
    isFree: true,
    sort: 0,
    answerState: null,
    solution: null,
    hiddenReason: null,
    ...overrides,
  };
}

export function materialUnit(id: string, children: PracticeQuestionDto[]): PracticeQuestionUnitDto {
  return {
    ...practiceQuestion(id, {
      type: QuestionType.MATERIAL,
      stem: '',
      options: null,
      material: `材料 ${id}`,
      audioUrl: `https://cdn.example.com/${id}.mp3`,
    }),
    children: children.map(child => ({ ...child, parentId: id })),
  };
}

export function answerState(overrides: Partial<AnswerStateDto> = {}): AnswerStateDto {
  return {
    answer: { keys: ['A'] },
    isCorrect: null,
    isPartial: false,
    score: null,
    selfAssessment: null,
    markedForReview: false,
    durationSec: 0,
    clientSeq: 1,
    answeredAt: '2026-01-01T00:00:00.000Z',
    gradedAt: null,
    ...overrides,
  };
}

export function cardItem(index: number, overrides: Partial<AnswerCardItemDto> = {}): AnswerCardItemDto {
  return {
    index,
    questionId: `q${index}`,
    materialId: null,
    type: QuestionType.SINGLE,
    answered: false,
    isCorrect: null,
    isPartial: false,
    selfAssessment: null,
    markedForReview: false,
    hiddenReason: null,
    ...overrides,
  };
}

export function sessionResult(overrides: Partial<CreatePracticeSessionResultDto> = {}): CreatePracticeSessionResultDto {
  const questionCount = overrides.questionCount ?? overrides.card?.length ?? 3;
  return {
    id: 's1',
    subjectId: 'sub1',
    mode: PracticeMode.CHAPTER,
    paperId: null,
    dailyDate: null,
    scope: {},
    status: PracticeSessionStatus.IN_PROGRESS,
    questionCount,
    answeredCount: 0,
    correctCount: 0,
    durationSec: 0,
    lastIndex: 0,
    startedAt: '2026-01-01T08:00:00.000Z',
    deadlineAt: null,
    autoSubmitAt: null,
    submittedAt: null,
    submitType: null,
    lastActiveAt: '2026-01-01T08:00:00.000Z',
    isFirstAttempt: false,
    scoringScheme: null,
    score: null,
    totalScore: null,
    pendingGrading: false,
    serverNow: '2026-01-01T08:00:00.000Z',
    card: Array.from({ length: questionCount }, (_, index) => cardItem(index)),
    insufficient: false,
    isActiveDevice: true,
    ...overrides,
  };
}
