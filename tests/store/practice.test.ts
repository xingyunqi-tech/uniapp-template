import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ApiError } from '@/api/core/alova';
import { PracticeMode, PracticeSessionStatus, QuestionType, type SessionQuestionsDto } from '@/api';
import { loadAnswerCache, saveAnswerCache } from '@/utils/practice-cache';
import { answerState, cardItem, materialUnit, practiceQuestion, sessionResult } from '../fixtures/practice';

const api = vi.hoisted(() => ({
  createPracticeSession: vi.fn(),
  getPracticeSession: vi.fn(),
  getPracticeSessionQuestions: vi.fn(),
  savePracticeAnswers: vi.fn(),
  selfAssessPracticeAnswer: vi.fn(),
  submitPracticeSession: vi.fn(),
  abandonPracticeSession: vi.fn(),
  updatePracticeProgress: vi.fn(),
  getOngoingPracticeSessions: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

vi.mock('@/utils/device', () => ({ getDeviceId: () => 'device-1' }));

const { usePracticeStore } = await import('@/store/modules/practice');

const SERVER_NOW = '2026-01-01T08:00:00.000Z';

function segment(from: number, ids: string[], total = 3): SessionQuestionsDto {
  return { from, size: ids.length, total, units: ids.map(id => practiceQuestion(id)) };
}

function saved(results: { questionId: string }[] = [], skippedQuestionIds: string[] = []) {
  return {
    serverNow: SERVER_NOW,
    results: results.map(result => ({ answerState: null, solution: null, hiddenReason: null, ...result })),
    skippedQuestionIds,
  };
}

async function startWith(overrides: Parameters<typeof sessionResult>[0] = {}) {
  const store = usePracticeStore();
  api.createPracticeSession.mockResolvedValueOnce(sessionResult(overrides));
  api.getPracticeSessionQuestions.mockResolvedValueOnce(segment(0, ['q0', 'q1', 'q2']));
  await store.start({ mode: overrides.mode ?? PracticeMode.CHAPTER, subjectId: 'sub1' });
  await store.ensureItems(0);
  return store;
}

function mockSession(overrides: Parameters<typeof sessionResult>[0] = {}) {
  return startWith({
    mode: PracticeMode.MOCK,
    paperId: 'p1',
    deadlineAt: '2026-01-01T09:00:00.000Z',
    autoSubmitAt: '2026-01-01T09:05:00.000Z',
    ...overrides,
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
  api.updatePracticeProgress.mockResolvedValue({});
  vi.mocked(uni.showToast).mockClear();
  uni.removeStorageSync('uni_practiceAnswers:s1');
  vi.useFakeTimers();
  vi.setSystemTime(new Date(SERVER_NOW));
});

afterEach(() => {
  usePracticeStore().stopAutoSync();
  vi.useRealTimers();
});

describe('start / open', () => {
  it('创建会话时携带设备标识，打开刚创建的会话不重复请求', async () => {
    const store = usePracticeStore();
    api.createPracticeSession.mockResolvedValueOnce(sessionResult({ insufficient: true }));

    await store.start({ mode: PracticeMode.RANDOM, subjectId: 'sub1' });
    await store.open('s1');

    expect(api.createPracticeSession).toHaveBeenCalledWith({
      mode: PracticeMode.RANDOM,
      subjectId: 'sub1',
      deviceId: 'device-1',
    });
    expect(api.getPracticeSession).not.toHaveBeenCalled();
    expect(store.insufficient).toBe(true);
    expect(store.total).toBe(3);
  });

  it('打开其他会话时拉取详情', async () => {
    const store = usePracticeStore();
    api.getPracticeSession.mockResolvedValueOnce(sessionResult({ id: 's2' }));

    await store.open('s2');

    expect(api.getPracticeSession).toHaveBeenCalledWith('s2');
    expect(store.session?.id).toBe('s2');
  });

  it('按缓存恢复未同步的作答到答题卡与草稿', async () => {
    saveAnswerCache('s1', {
      deviceId: 'device-1',
      seq: 4,
      pending: [
        { questionId: 'q1', answer: { keys: ['B'] }, clientSeq: 4, clientAnsweredAt: SERVER_NOW },
        { questionId: 'q2', markedForReview: true, clientSeq: 3, clientAnsweredAt: SERVER_NOW },
      ],
    });
    const store = usePracticeStore();
    api.getPracticeSession.mockResolvedValueOnce(sessionResult({ mode: PracticeMode.MOCK }));

    await store.open('s1');

    expect(store.pendingCount).toBe(2);
    expect(store.card[1].answered).toBe(true);
    expect(store.card[2].markedForReview).toBe(true);
    expect(store.drafts.q1).toEqual({ keys: ['B'] });
  });
});

describe('ensureItems', () => {
  it('分段拉取当前位置并按材料展开', async () => {
    const store = usePracticeStore();
    api.createPracticeSession.mockResolvedValueOnce(sessionResult({ questionCount: 4 }));
    api.getPracticeSessionQuestions.mockResolvedValueOnce({
      from: 0,
      size: 4,
      total: 4,
      units: [
        practiceQuestion('q0'),
        materialUnit('m1', [practiceQuestion('q1'), practiceQuestion('q2')]),
        practiceQuestion('q3'),
      ],
    });
    await store.start({ mode: PracticeMode.CHAPTER, subjectId: 'sub1' });

    await store.ensureItems(0);

    expect(api.getPracticeSessionQuestions).toHaveBeenCalledWith('s1', { from: 0, size: 10 });
    expect(Object.keys(store.items)).toEqual(['0', '1', '2', '3']);
    expect(store.items[2].material?.id).toBe('m1');
  });

  it('并发调用只发出一次请求，已加载时不再请求', async () => {
    const store = await startWith();
    await Promise.all([store.ensureItems(1), store.ensureItems(2)]);
    expect(api.getPracticeSessionQuestions).toHaveBeenCalledTimes(1);
  });

  it('接近已加载范围末尾时预取下一段', async () => {
    const store = usePracticeStore();
    api.createPracticeSession.mockResolvedValueOnce(sessionResult({ questionCount: 20 }));
    api.getPracticeSessionQuestions
      .mockResolvedValueOnce(segment(0, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 20))
      .mockResolvedValueOnce(segment(10, ['k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't'], 20));
    await store.start({ mode: PracticeMode.CHAPTER, subjectId: 'sub1' });
    await store.ensureItems(0);

    await store.ensureItems(8);

    expect(api.getPracticeSessionQuestions).toHaveBeenLastCalledWith('s1', { from: 10, size: 10 });
    expect(store.items[19].question.id).toBe('t');
  });

  it('请求失败时抛出错误', async () => {
    const store = usePracticeStore();
    api.createPracticeSession.mockResolvedValueOnce(sessionResult());
    api.getPracticeSessionQuestions.mockRejectedValue(new ApiError('失败', 500));
    await store.start({ mode: PracticeMode.CHAPTER, subjectId: 'sub1' });

    await expect(store.ensureItems(0)).rejects.toThrow('失败');
  });
});

describe('答完即判', () => {
  it('提交后立即同步并展示判分与解析', async () => {
    const store = await startWith();
    api.savePracticeAnswers.mockResolvedValueOnce(
      saved([
        {
          questionId: 'q0',
          answerState: answerState({ answer: { keys: ['B'] }, isCorrect: false, gradedAt: SERVER_NOW }),
          solution: { answer: { keys: ['A'] }, analysis: '解析' },
        } as never,
      ]),
    );

    store.setDraft('q0', { keys: ['B'] });
    await store.saveAnswer('q0', { durationSec: 12.4 });

    expect(api.savePracticeAnswers).toHaveBeenCalledWith(
      's1',
      {
        deviceId: 'device-1',
        answers: [
          { questionId: 'q0', answer: { keys: ['B'] }, durationSec: 12, clientSeq: 1, clientAnsweredAt: SERVER_NOW },
        ],
      },
      { showError: false },
    );
    expect(store.items[0].solution?.analysis).toBe('解析');
    expect(store.statusOf(0)).toBe('wrong');
    expect(store.pendingCount).toBe(0);
    expect(store.isAnswerLocked(store.items[0])).toBe(true);
  });

  it('空答案不提交', async () => {
    const store = await startWith();
    await store.saveAnswer('q0');
    expect(api.savePracticeAnswers).not.toHaveBeenCalled();
  });

  it('网络失败时保留在本地缓存，题目按已提交锁定', async () => {
    const store = await startWith();
    api.savePracticeAnswers.mockRejectedValueOnce(new Error('request:fail'));

    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');

    expect(store.pendingCount).toBe(1);
    expect(store.syncError).toBe(true);
    expect(store.card[0].answered).toBe(true);
    expect(store.isAnswerLocked(store.items[0])).toBe(true);
    expect(loadAnswerCache('s1', 'device-1').pending).toHaveLength(1);
  });

  it('题目在进行中的模考里时剔除该题并重发其余作答', async () => {
    const store = await startWith();
    api.savePracticeAnswers.mockRejectedValueOnce(new Error('offline'));
    store.setDraft('q1', { keys: ['A'] });
    await store.saveAnswer('q1');
    api.savePracticeAnswers
      .mockRejectedValueOnce(
        new ApiError('该题正在模拟考试中', 409, undefined, 'questionInMockInProgress', {
          errorKey: 'questionInMockInProgress',
          questionIds: ['q0'],
        }),
      )
      .mockResolvedValueOnce(saved([{ questionId: 'q1' }]));

    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');

    expect(api.savePracticeAnswers).toHaveBeenCalledTimes(3);
    expect(
      api.savePracticeAnswers.mock.calls[2][1].answers.map((patch: { questionId: string }) => patch.questionId),
    ).toEqual(['q1']);
    expect(store.items[0].hiddenReason).toBe('mockInProgress');
    expect(store.card[0].answered).toBe(false);
    expect(store.pendingCount).toBe(0);
  });

  it('主观题自评后更新答题卡', async () => {
    const store = await startWith();
    api.selfAssessPracticeAnswer.mockResolvedValueOnce({
      questionId: 'q0',
      answerState: answerState({ answer: { text: '作答' }, isCorrect: false, selfAssessment: 'UNKNOWN' }),
      solution: { answer: { reference: '参考', points: [] }, analysis: null },
      hiddenReason: null,
    });

    await store.selfAssess('q0', 'UNKNOWN');

    expect(api.selfAssessPracticeAnswer).toHaveBeenCalledWith('s1', { questionId: 'q0', selfAssessment: 'UNKNOWN' });
    expect(store.card[0]).toMatchObject({ answered: true, isCorrect: false, selfAssessment: 'UNKNOWN' });
  });
});

describe('模拟考试作答同步', () => {
  it('作答写入缓存，每 10 秒批量同步', async () => {
    const store = await mockSession();
    api.savePracticeAnswers.mockResolvedValue(saved([{ questionId: 'q0' }, { questionId: 'q1' }]));
    store.startAutoSync();

    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    store.setDraft('q1', { keys: ['B'] });
    await store.saveAnswer('q1');
    expect(api.savePracticeAnswers).not.toHaveBeenCalled();
    expect(store.card[0].answered).toBe(true);
    expect(store.statusOf(0)).toBe('answered');

    await vi.advanceTimersByTimeAsync(10_000);

    expect(api.savePracticeAnswers).toHaveBeenCalledTimes(1);
    expect(
      api.savePracticeAnswers.mock.calls[0][1].answers.map((patch: { clientSeq: number }) => patch.clientSeq),
    ).toEqual([1, 2]);
    expect(store.pendingCount).toBe(0);
  });

  it('序号从该题服务端已存序号之后递增', async () => {
    const store = usePracticeStore();
    api.createPracticeSession.mockResolvedValueOnce(
      sessionResult({ mode: PracticeMode.MOCK, deadlineAt: '2026-01-01T09:00:00.000Z' }),
    );
    api.getPracticeSessionQuestions.mockResolvedValueOnce({
      from: 0,
      size: 3,
      total: 3,
      units: [
        practiceQuestion('q0', { answerState: answerState({ clientSeq: 41 }) }),
        practiceQuestion('q1'),
        practiceQuestion('q2'),
      ],
    });
    await store.start({ mode: PracticeMode.MOCK, subjectId: 'sub1', paperId: 'p1' });
    await store.ensureItems(0);

    store.setDraft('q0', {});
    await store.saveAnswer('q0');

    expect(loadAnswerCache('s1', 'device-1').pending).toEqual([
      { questionId: 'q0', answer: null, clientSeq: 42, clientAnsweredAt: SERVER_NOW },
    ]);
    expect(store.card[0].answered).toBe(false);
  });

  it('标记只提交 markedForReview', async () => {
    const store = await mockSession();
    await store.toggleMark('q2');
    expect(store.card[2].markedForReview).toBe(true);
    expect(loadAnswerCache('s1', 'device-1').pending).toEqual([
      { questionId: 'q2', markedForReview: true, clientSeq: 1, clientAnsweredAt: SERVER_NOW },
    ]);
  });

  it('作答时间按 serverNow 校准', async () => {
    vi.setSystemTime(new Date('2026-01-01T08:10:00.000Z'));
    const store = await mockSession();

    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');

    expect(loadAnswerCache('s1', 'device-1').pending[0].clientAnsweredAt).toBe(SERVER_NOW);
    expect(store.remaining).toBe(3600);
  });

  it('截止后本地锁定作答，补交时标记 offline 并提示被跳过的题', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    store.startAutoSync();
    await vi.advanceTimersByTimeAsync(0);

    vi.setSystemTime(new Date('2026-01-01T09:00:00.000Z'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(store.timeUp).toBe(true);
    expect(store.canAnswer).toBe(false);
    store.setDraft('q1', { keys: ['A'] });
    await store.saveAnswer('q1');
    expect(store.pendingCount).toBe(1);

    api.savePracticeAnswers.mockResolvedValueOnce(saved([], ['q0']));
    await store.flush();

    expect(api.savePracticeAnswers.mock.calls[0][1]).toMatchObject({ deviceId: 'device-1', offline: true });
    expect(uni.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '1 道题作答时间晚于截止时间，未计入成绩' }),
    );
  });

  it('会话被接管时清空缓存并结束答题', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    api.savePracticeAnswers.mockRejectedValueOnce(new ApiError('已接管', 409, undefined, 'sessionTakenOver'));

    const ok = await store.flush();

    expect(ok).toBe(false);
    expect(store.endReason).toBe('takenOver');
    expect(store.pendingCount).toBe(0);
    expect(store.canAnswer).toBe(false);
    expect(loadAnswerCache('s1', 'device-1').pending).toEqual([]);
  });

  it('模考同步一律标记 offline', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    api.savePracticeAnswers.mockResolvedValueOnce(saved([{ questionId: 'q0' }]));

    await store.flush();

    expect(api.savePracticeAnswers.mock.calls[0][1]).toMatchObject({ offline: true });
  });

  it('会话已关闭且确认已交卷时清缓存并结束答题', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    api.savePracticeAnswers.mockRejectedValueOnce(new ApiError('已关闭', 409, undefined, 'sessionClosed'));
    api.getPracticeSession.mockResolvedValueOnce(
      sessionResult({ mode: PracticeMode.MOCK, status: PracticeSessionStatus.SUBMITTED }),
    );

    await store.flush();

    expect(store.endReason).toBe('closed');
    expect(loadAnswerCache('s1', 'device-1').pending).toEqual([]);
  });

  it('截止竞态下收到 sessionClosed 但会话仍在补交窗口内时保留作答并重试', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    vi.setSystemTime(new Date('2026-01-01T09:01:00.000Z'));
    api.savePracticeAnswers
      .mockRejectedValueOnce(new ApiError('已关闭', 409, undefined, 'sessionClosed'))
      .mockResolvedValueOnce(saved([{ questionId: 'q0' }]));
    api.getPracticeSession.mockResolvedValueOnce(
      sessionResult({
        mode: PracticeMode.MOCK,
        deadlineAt: '2026-01-01T09:00:00.000Z',
        autoSubmitAt: '2026-01-01T09:05:00.000Z',
        serverNow: '2026-01-01T09:01:00.000Z',
      }),
    );

    expect(await store.flush()).toBe(false);
    expect(store.endReason).toBeNull();
    expect(store.pendingCount).toBe(1);

    expect(await store.flush()).toBe(true);
    expect(store.pendingCount).toBe(0);
  });

  it('已过自动交卷时间时 sessionClosed 结束答题', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    api.savePracticeAnswers.mockRejectedValueOnce(new ApiError('已关闭', 409, undefined, 'sessionClosed'));
    api.getPracticeSession.mockResolvedValueOnce(
      sessionResult({
        mode: PracticeMode.MOCK,
        deadlineAt: '2026-01-01T09:00:00.000Z',
        autoSubmitAt: '2026-01-01T09:05:00.000Z',
        serverNow: '2026-01-01T09:06:00.000Z',
      }),
    );

    await store.flush();

    expect(store.endReason).toBe('closed');
  });

  it('批量被整批拒绝时逐条重发，只丢弃无效的一条并回滚该题', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    store.setDraft('q1', { keys: ['B'] });
    await store.saveAnswer('q1');
    api.savePracticeAnswers
      .mockRejectedValueOnce(new ApiError('答案与题目不符', 422))
      .mockRejectedValueOnce(new ApiError('答案与题目不符', 422))
      .mockResolvedValueOnce(saved([{ questionId: 'q1' }]));

    await store.flush();

    const sent = api.savePracticeAnswers.mock.calls.map(call =>
      call[1].answers.map((patch: { questionId: string }) => patch.questionId),
    );
    expect(sent).toEqual([['q0', 'q1'], ['q0'], ['q1']]);
    expect(store.pendingCount).toBe(0);
    expect(store.card[0].answered).toBe(false);
    expect(store.drafts.q0).toBeUndefined();
    expect(store.card[1].answered).toBe(true);
    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '答案与题目不符' }));
  });

  it('逐条重发遇到网络错误时停止并保留剩余作答', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    store.setDraft('q1', { keys: ['B'] });
    await store.saveAnswer('q1');
    api.savePracticeAnswers
      .mockRejectedValueOnce(new ApiError('答案与题目不符', 422))
      .mockRejectedValueOnce(new Error('request:fail'));

    expect(await store.flush()).toBe(false);
    expect(store.pendingCount).toBe(2);
  });

  it('截止前的作答在截止后仍可写入缓存补交', async () => {
    const store = await mockSession();
    vi.setSystemTime(new Date('2026-01-01T09:00:01.000Z'));
    store.startAutoSync();
    await vi.advanceTimersByTimeAsync(1000);
    expect(store.timeUp).toBe(true);

    store.setDraft('q0', { text: 'x', keys: ['A'] });
    await store.saveAnswer('q0', { answeredAt: new Date('2026-01-01T08:59:59.000Z').getTime() });
    store.setDraft('q1', { keys: ['A'] });
    await store.saveAnswer('q1');

    expect(loadAnswerCache('s1', 'device-1').pending).toEqual([
      { questionId: 'q0', answer: { keys: ['A'] }, clientSeq: 1, clientAnsweredAt: '2026-01-01T08:59:59.000Z' },
    ]);
  });

  it('同步中再次调用合并为下一轮，发送期间的更新不被确认丢弃', async () => {
    const store = await mockSession();
    let resolveFirst: (value: unknown) => void = () => undefined;
    api.savePracticeAnswers
      .mockImplementationOnce(() => new Promise(resolve => (resolveFirst = resolve)))
      .mockResolvedValueOnce(saved([{ questionId: 'q0' }]));

    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    const first = store.flush();
    store.setDraft('q0', { keys: ['B'] });
    await store.saveAnswer('q0');
    const second = store.flush();
    resolveFirst(saved([{ questionId: 'q0' }]));
    await Promise.all([first, second]);

    expect(api.savePracticeAnswers).toHaveBeenCalledTimes(2);
    expect(api.savePracticeAnswers.mock.calls[1][1].answers).toEqual([
      { questionId: 'q0', answer: { keys: ['B'] }, clientSeq: 2, clientAnsweredAt: SERVER_NOW },
    ]);
    expect(store.pendingCount).toBe(0);
  });
});

describe('submit / abandon / progress', () => {
  it('交卷前先同步作答，成功后清除缓存', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    api.savePracticeAnswers.mockResolvedValueOnce(saved([{ questionId: 'q0' }]));
    api.submitPracticeSession.mockResolvedValueOnce(
      sessionResult({ mode: PracticeMode.MOCK, status: PracticeSessionStatus.SUBMITTED }),
    );

    const detail = await store.submit();

    expect(api.savePracticeAnswers).toHaveBeenCalledBefore(api.submitPracticeSession);
    expect(detail.status).toBe(PracticeSessionStatus.SUBMITTED);
    expect(store.inProgress).toBe(false);
    expect(store.revealed).toBe(true);
    expect(uni.getStorageSync('uni_practiceAnswers:s1')).toBe('');
  });

  it('作答未同步完成时不交卷', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    api.savePracticeAnswers.mockRejectedValueOnce(new Error('request:fail'));

    await expect(store.submit()).rejects.toThrow('作答尚未同步');
    expect(api.submitPracticeSession).not.toHaveBeenCalled();
  });

  it('放弃会话后状态更新', async () => {
    const store = await startWith();
    api.abandonPracticeSession.mockResolvedValueOnce(sessionResult({ status: PracticeSessionStatus.ABANDONED }));

    await store.abandon();

    expect(store.session?.status).toBe(PracticeSessionStatus.ABANDONED);
    expect(store.canAnswer).toBe(false);
    expect(store.canSelfAssess).toBe(false);
  });

  it('浏览位置变化时上报，相同位置不重复上报', async () => {
    const store = await startWith();
    store.updateProgress(1);
    store.updateProgress(1);
    store.updateProgress(5);
    expect(api.updatePracticeProgress).toHaveBeenCalledTimes(1);
    expect(api.updatePracticeProgress).toHaveBeenCalledWith('s1', { lastIndex: 1 }, { showError: false });
  });
});

describe('权限与状态', () => {
  it('背题模式不可作答与自评', async () => {
    const store = await startWith({ mode: PracticeMode.MEMORIZE });
    expect(store.canAnswer).toBe(false);
    expect(store.canSelfAssess).toBe(false);
  });

  it('进行中的模考不展示判分，交卷后可自评', async () => {
    const store = await mockSession({
      card: [cardItem(0, { type: QuestionType.SHORT_ANSWER, answered: true }), cardItem(1), cardItem(2)],
    });
    expect(store.revealed).toBe(false);
    expect(store.canSelfAssess).toBe(false);
    expect(store.statusOf(0)).toBe('answered');
    expect(store.unansweredCount).toBe(2);
  });

  it('获取未完成会话时透传排除的模式', async () => {
    const store = usePracticeStore();
    api.getOngoingPracticeSessions.mockResolvedValueOnce([sessionResult()]);
    await store.fetchOngoing({ excludeModes: [PracticeMode.DAILY] });
    expect(api.getOngoingPracticeSessions).toHaveBeenCalledWith({ excludeModes: ['DAILY'] }, { showError: false });
    expect(store.ongoing).toHaveLength(1);
  });

  it('不在列表中但服务端仍进行中的会话，待同步作答保留不补交', async () => {
    const patch = { questionId: 'q0', answer: { keys: ['A'] }, clientSeq: 1, clientAnsweredAt: SERVER_NOW };
    saveAnswerCache('daily', { deviceId: 'device-1', seq: 1, pending: [patch] });
    api.getOngoingPracticeSessions.mockResolvedValueOnce([sessionResult({ id: 'chapter' })]);
    api.getPracticeSession.mockResolvedValueOnce(sessionResult({ id: 'daily', mode: PracticeMode.DAILY }));
    const store = usePracticeStore();

    await store.fetchOngoing({ excludeModes: [PracticeMode.DAILY] });
    await vi.advanceTimersByTimeAsync(0);

    expect(api.getPracticeSession).toHaveBeenCalledWith('daily', { showError: false });
    expect(api.savePracticeAnswers).not.toHaveBeenCalled();
    expect(uni.getStorageSync('uni_practiceAnswers:daily')).not.toBe('');
  });

  it('查询会话状态遇到临时错误时保留待同步作答', async () => {
    const patch = { questionId: 'q0', answer: { keys: ['A'] }, clientSeq: 1, clientAnsweredAt: SERVER_NOW };
    saveAnswerCache('unknown', { deviceId: 'device-1', seq: 1, pending: [patch] });
    api.getOngoingPracticeSessions.mockResolvedValueOnce([]);
    api.getPracticeSession.mockRejectedValueOnce(new Error('request:fail'));
    const store = usePracticeStore();

    await store.fetchOngoing();
    await vi.advanceTimersByTimeAsync(0);

    expect(api.savePracticeAnswers).not.toHaveBeenCalled();
    expect(uni.getStorageSync('uni_practiceAnswers:unknown')).not.toBe('');
  });

  it('flushAll 补交本机全部待同步作答，返回仍未同步的条数', async () => {
    const patch = { questionId: 'q0', answer: { keys: ['A'] }, clientSeq: 1, clientAnsweredAt: SERVER_NOW };
    saveAnswerCache('synced', { deviceId: 'device-1', seq: 1, pending: [patch] });
    saveAnswerCache('offline', { deviceId: 'device-1', seq: 1, pending: [patch] });
    api.savePracticeAnswers.mockImplementation((id: string) =>
      id === 'synced' ? Promise.resolve(saved([{ questionId: 'q0' }])) : Promise.reject(new Error('request:fail')),
    );
    const store = usePracticeStore();

    expect(store.countUnsynced()).toBe(2);
    await expect(store.flushAll()).resolves.toBe(1);
    expect(uni.getStorageSync('uni_practiceAnswers:synced')).toBe('');
    expect(uni.getStorageSync('uni_practiceAnswers:offline')).not.toBe('');
  });

  it('flushAll 分批补交超过单批上限的待同步作答', async () => {
    const pending = Array.from({ length: 201 }, (_, i) => ({
      questionId: `q${i}`,
      answer: { keys: ['A'] },
      clientSeq: 1,
      clientAnsweredAt: SERVER_NOW,
    }));
    saveAnswerCache('large', { deviceId: 'device-1', seq: 1, pending });
    api.savePracticeAnswers.mockResolvedValue(saved([]));
    const store = usePracticeStore();

    await expect(store.flushAll()).resolves.toBe(0);
    expect(api.savePracticeAnswers.mock.calls.map(call => call[1].answers.length)).toEqual([200, 1]);
    expect(uni.getStorageSync('uni_practiceAnswers:large')).toBe('');
  });

  it('flushAll 没有待同步作答时不发请求', async () => {
    saveAnswerCache('idle', { deviceId: 'device-1', seq: 1, pending: [] });
    const store = usePracticeStore();

    await expect(store.flushAll()).resolves.toBe(0);
    expect(api.savePracticeAnswers).not.toHaveBeenCalled();
  });

  it('拉取未完成会话后清理已结束会话的缓存，有待同步作答的先补交', async () => {
    const patch = { questionId: 'q0', answer: { keys: ['A'] }, clientSeq: 1, clientAnsweredAt: SERVER_NOW };
    saveAnswerCache('active', { deviceId: 'device-1', seq: 1, pending: [] });
    saveAnswerCache('stale', { deviceId: 'device-1', seq: 3, pending: [] });
    saveAnswerCache('unsynced', { deviceId: 'device-1', seq: 1, pending: [patch] });
    saveAnswerCache('offline', { deviceId: 'device-1', seq: 1, pending: [patch] });
    api.getOngoingPracticeSessions.mockResolvedValueOnce([sessionResult({ id: 'active' })]);
    api.getPracticeSession.mockImplementation((id: string) =>
      Promise.resolve(sessionResult({ id, status: PracticeSessionStatus.SUBMITTED })),
    );
    api.savePracticeAnswers.mockImplementation((id: string) =>
      id === 'unsynced' ? Promise.resolve(saved([{ questionId: 'q0' }])) : Promise.reject(new Error('request:fail')),
    );
    const store = usePracticeStore();

    await store.fetchOngoing();
    await vi.advanceTimersByTimeAsync(0);

    expect(api.savePracticeAnswers).toHaveBeenCalledWith(
      'unsynced',
      { deviceId: 'device-1', offline: true, answers: [patch] },
      { showError: false },
    );
    expect(uni.getStorageSync('uni_practiceAnswers:active')).not.toBe('');
    expect(uni.getStorageSync('uni_practiceAnswers:stale')).toBe('');
    expect(uni.getStorageSync('uni_practiceAnswers:unsynced')).toBe('');
    expect(uni.getStorageSync('uni_practiceAnswers:offline')).not.toBe('');
    uni.removeStorageSync('uni_practiceAnswers:active');
    uni.removeStorageSync('uni_practiceAnswers:offline');
  });

  it('reset 清空会话状态与全部作答缓存', async () => {
    const store = await startWith();
    saveAnswerCache('other', { deviceId: 'device-1', seq: 1, pending: [] });
    store.reset();
    expect(store.session).toBeNull();
    expect(store.items).toEqual({});
    expect(uni.getStorageSync('uni_practiceAnswers:other')).toBe('');
  });

  it('被接管结束后再次进入同一会话可作答', async () => {
    const store = await mockSession();
    store.setDraft('q0', { keys: ['A'] });
    await store.saveAnswer('q0');
    api.savePracticeAnswers.mockRejectedValueOnce(new ApiError('已接管', 409, undefined, 'sessionTakenOver'));
    await store.flush();
    expect(store.endReason).toBe('takenOver');

    api.createPracticeSession.mockResolvedValueOnce(
      sessionResult({ mode: PracticeMode.MOCK, deadlineAt: '2026-01-01T09:00:00.000Z' }),
    );
    await store.start({ mode: PracticeMode.MOCK, subjectId: 'sub1', paperId: 'p1' });

    expect(store.endReason).toBeNull();
    expect(store.syncError).toBe(false);
    expect(store.canAnswer).toBe(true);
    store.updateProgress(0);
    expect(api.updatePracticeProgress).toHaveBeenCalledWith('s1', { lastIndex: 0 }, { showError: false });
  });

  it('打开会话时详情没有设备字段则保留原值', async () => {
    const store = await mockSession({ isActiveDevice: false });
    const detail: Partial<ReturnType<typeof sessionResult>> = sessionResult({ mode: PracticeMode.MOCK });
    delete detail.isActiveDevice;
    api.getPracticeSession.mockResolvedValueOnce(detail);

    await store.open('s1');

    expect(store.isActiveDevice).toBe(false);
  });

  it('分段未加载时标记先加载分段，序号取服务端值之后', async () => {
    const store = usePracticeStore();
    api.createPracticeSession.mockResolvedValueOnce(
      sessionResult({ mode: PracticeMode.MOCK, deadlineAt: '2026-01-01T09:00:00.000Z' }),
    );
    api.getPracticeSessionQuestions.mockResolvedValueOnce({
      from: 0,
      size: 3,
      total: 3,
      units: [
        practiceQuestion('q0'),
        practiceQuestion('q1'),
        practiceQuestion('q2', { answerState: answerState({ clientSeq: 7 }) }),
      ],
    });
    await store.start({ mode: PracticeMode.MOCK, subjectId: 'sub1', paperId: 'p1' });

    await store.toggleMark('q2');

    expect(loadAnswerCache('s1', 'device-1').pending[0].clientSeq).toBe(8);
  });

  it('交卷请求进行中锁定作答', async () => {
    const store = await mockSession();
    let resolveSubmit: (value: unknown) => void = () => undefined;
    api.submitPracticeSession.mockImplementationOnce(() => new Promise(resolve => (resolveSubmit = resolve)));

    const task = store.submit();
    expect(store.canAnswer).toBe(false);
    await expect(store.submit()).rejects.toThrow('正在提交');
    resolveSubmit(sessionResult({ mode: PracticeMode.MOCK, status: PracticeSessionStatus.SUBMITTED }));
    await task;
    expect(store.submitting).toBe(false);
  });
});
