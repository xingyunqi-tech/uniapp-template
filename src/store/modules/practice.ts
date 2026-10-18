import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  ApiError,
  PracticeMode,
  PracticeSessionStatus,
  abandonPracticeSession,
  createPracticeSession,
  getOngoingPracticeSessions,
  getPracticeSession,
  getPracticeSessionQuestions,
  isTransientError,
  savePracticeAnswers,
  selfAssessPracticeAnswer,
  submitPracticeSession,
  updatePracticeProgress,
  type AnswerCardItemDto,
  type AnswerPatchDto,
  type AnswerResultDto,
  type CreatePracticeSessionDto,
  type CreatePracticeSessionResultDto,
  type GetOngoingPracticeSessionsParams,
  type PracticeSessionDetailDto,
  type PracticeSessionDto,
  type RequestOptions,
  type SelfAssessment,
} from '@/api';
import { getBusinessErrorMessage } from '@/utils/business-error';
import { getDeviceId } from '@/utils/device';
import {
  acknowledgePatches,
  allocateSeq,
  clearAllAnswerCaches,
  clearAnswerCache,
  dropPatches,
  enqueuePatch,
  listCachedSessionIds,
  loadAnswerCache,
  readAnswerCache,
  saveAnswerCache,
  type AnswerCache,
} from '@/utils/practice-cache';
import { answerCardStatus, type CardStatus } from '@/utils/practice-card';
import { clockOffset, remainingSeconds, serverTime } from '@/utils/practice-clock';
import { flattenSegment, nextFetchFrom, SEGMENT_SIZE, type PracticeItem } from '@/utils/practice-segment';
import { buildPracticeAnswer, draftFromAnswer, type DraftAnswer } from '@/utils/question-answer';
import { showToast } from '@/utils/toast';

const SILENT: RequestOptions = { showError: false };
export const SYNC_INTERVAL_SEC = 10;
const MAX_BATCH = 200;
const SEGMENT_ATTEMPTS = 3;

export type PracticeEndReason = 'takenOver' | 'closed';

export type StartPracticeParams = Omit<CreatePracticeSessionDto, 'deviceId'>;

export interface SaveAnswerOptions {
  durationSec?: number;
  /** 作答发生的本地时间（毫秒），截止前的作答在截止后仍可写入缓存补交 */
  answeredAt?: number;
}

type SendOutcome = 'ok' | 'stop';

function questionIdsOf(details: unknown): string[] {
  const ids = (details as { questionIds?: unknown } | null)?.questionIds;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

function isClosingError(error: unknown): boolean {
  const key = error instanceof ApiError ? error.errorKey : undefined;
  return key === 'sessionTakenOver' || key === 'sessionClosed';
}

export const usePracticeStore = defineStore('practice', () => {
  const session = ref<PracticeSessionDetailDto | null>(null);
  const card = ref<AnswerCardItemDto[]>([]);
  const items = ref<Record<number, PracticeItem>>({});
  const drafts = ref<Record<string, DraftAnswer>>({});
  const offset = ref(0);
  const now = ref(Date.now());
  const insufficient = ref(false);
  const isActiveDevice = ref(true);
  const endReason = ref<PracticeEndReason | null>(null);
  const pendingCount = ref(0);
  const syncError = ref(false);
  const submitting = ref(false);
  const ongoing = ref<PracticeSessionDto[]>([]);

  let cache: AnswerCache | null = null;
  let preparedId: string | null = null;
  let segmentTask: Promise<void> | null = null;
  let flushTask: Promise<boolean> | null = null;
  let flushQueued = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let ticks = 0;
  let lastProgress = -1;

  const mode = computed(() => session.value?.mode ?? null);
  const isMock = computed(() => mode.value === PracticeMode.MOCK);
  const isMemorize = computed(() => mode.value === PracticeMode.MEMORIZE);
  const inProgress = computed(() => session.value?.status === PracticeSessionStatus.IN_PROGRESS);
  const total = computed(() => session.value?.questionCount ?? 0);
  const deadline = computed(() => {
    const value = session.value?.deadlineAt;
    return value ? new Date(value).getTime() : null;
  });
  const remaining = computed(() =>
    isMock.value && inProgress.value
      ? remainingSeconds(session.value?.deadlineAt ?? null, offset.value, now.value)
      : null,
  );
  const timeUp = computed(() => remaining.value === 0);
  const revealed = computed(() => !(isMock.value && inProgress.value));
  const writable = computed(
    () =>
      inProgress.value && !isMemorize.value && isActiveDevice.value && endReason.value === null && !submitting.value,
  );
  const canAnswer = computed(() => writable.value && !timeUp.value);
  const canSelfAssess = computed(() => {
    const current = session.value;
    if (!current || isMemorize.value || endReason.value !== null) return false;
    return isMock.value
      ? current.status === PracticeSessionStatus.SUBMITTED
      : current.status !== PracticeSessionStatus.ABANDONED;
  });
  const cardByQuestion = computed(() => new Map(card.value.map(item => [item.questionId, item])));
  const cardByIndex = computed(() => new Map(card.value.map(item => [item.index, item])));
  const unansweredCount = computed(() => Math.max(0, total.value - card.value.filter(item => item.answered).length));

  function persist() {
    if (!session.value || !cache) return;
    if (cache.pending.length === 0 && cache.seq === 0) clearAnswerCache(session.value.id);
    else saveAnswerCache(session.value.id, cache);
    pendingCount.value = cache.pending.length;
  }

  function hasPendingAnswer(questionId: string): boolean {
    return cache?.pending.some(patch => patch.questionId === questionId && patch.answer !== undefined) ?? false;
  }

  function updateCard(questionId: string, changes: Partial<AnswerCardItemDto>) {
    card.value = card.value.map(item => (item.questionId === questionId ? { ...item, ...changes } : item));
  }

  function overlayPending(list: AnswerCardItemDto[]): AnswerCardItemDto[] {
    const pending = new Map((cache?.pending ?? []).map(patch => [patch.questionId, patch]));
    return list.map(item => {
      const patch = pending.get(item.questionId);
      if (!patch) return item;
      return {
        ...item,
        ...(patch.answer !== undefined && { answered: patch.answer !== null }),
        ...(patch.markedForReview !== undefined && { markedForReview: patch.markedForReview }),
      };
    });
  }

  function restorePendingDrafts(list: AnswerCardItemDto[]) {
    const types = new Map(list.map(item => [item.questionId, item.type]));
    const restored: Record<string, DraftAnswer> = {};
    for (const patch of cache?.pending ?? []) {
      const type = types.get(patch.questionId);
      if (type && patch.answer !== undefined) restored[patch.questionId] = draftFromAnswer(type, patch.answer);
    }
    drafts.value = { ...restored, ...drafts.value };
  }

  function applySession(detail: PracticeSessionDetailDto, reload: boolean) {
    const changed = session.value?.id !== detail.id;
    if (changed || reload) {
      items.value = {};
      drafts.value = {};
      segmentTask = null;
      endReason.value = null;
      syncError.value = false;
      lastProgress = -1;
      cache = loadAnswerCache(detail.id, getDeviceId());
    }
    if (changed) isActiveDevice.value = true;
    session.value = detail;
    offset.value = clockOffset(detail.serverNow);
    now.value = Date.now();
    card.value = overlayPending(detail.card);
    restorePendingDrafts(detail.card);
    pendingCount.value = cache?.pending.length ?? 0;
  }

  /** 创建或续考，返回会话可能已交卷或已放弃 */
  async function start(params: StartPracticeParams): Promise<CreatePracticeSessionResultDto> {
    const result = await createPracticeSession({ ...params, deviceId: getDeviceId() });
    applySession(result, true);
    insufficient.value = result.insufficient;
    isActiveDevice.value = result.isActiveDevice;
    preparedId = result.id;
    return result;
  }

  async function open(sessionId: string): Promise<PracticeSessionDetailDto> {
    if (preparedId === sessionId && session.value?.id === sessionId) {
      preparedId = null;
      return session.value;
    }
    preparedId = null;
    const detail = await getPracticeSession(sessionId);
    applySession(detail, true);
    insufficient.value = false;
    if ('isActiveDevice' in detail && typeof detail.isActiveDevice === 'boolean') {
      isActiveDevice.value = detail.isActiveDevice;
    }
    return detail;
  }

  async function refresh(): Promise<PracticeSessionDetailDto | null> {
    const current = session.value;
    if (!current) return null;
    const detail = await getPracticeSession(current.id, SILENT);
    if (session.value?.id === current.id) applySession(detail, false);
    return detail;
  }

  function mergeItems(list: PracticeItem[]) {
    const next = { ...items.value };
    list.forEach(item => (next[item.index] = item));
    items.value = next;
  }

  /** 加载浏览位置所在分段，并预取后续分段 */
  async function ensureItems(index: number): Promise<void> {
    for (let attempt = 0; attempt < SEGMENT_ATTEMPTS; attempt += 1) {
      if (segmentTask) {
        await segmentTask.catch(() => undefined);
        continue;
      }
      const current = session.value;
      if (!current) return;
      const from = nextFetchFrom(index, total.value, cursor => cursor in items.value);
      if (from === null) return;
      const sessionId = current.id;
      const task = getPracticeSessionQuestions(sessionId, { from, size: SEGMENT_SIZE }).then(segment => {
        if (session.value?.id === sessionId) mergeItems(flattenSegment(segment));
      });
      segmentTask = task;
      try {
        await task;
      } finally {
        if (segmentTask === task) segmentTask = null;
      }
    }
  }

  function itemOf(questionId: string): PracticeItem | undefined {
    const index = cardByQuestion.value.get(questionId)?.index;
    return index === undefined ? undefined : items.value[index];
  }

  function draftOf(item: PracticeItem): DraftAnswer {
    return drafts.value[item.question.id] ?? draftFromAnswer(item.question.type, item.answerState?.answer);
  }

  /** 不可作答时锁定；答完即判模式下已提交（含未同步）的题也锁定 */
  function isAnswerLocked(item: PracticeItem): boolean {
    if (!canAnswer.value) return true;
    if (isMock.value) return false;
    return (item.answerState?.answer ?? null) !== null || hasPendingAnswer(item.question.id);
  }

  function statusOf(index: number): CardStatus {
    const item = cardByIndex.value.get(index);
    return item ? answerCardStatus(item, revealed.value) : 'unanswered';
  }

  function setDraft(questionId: string, draft: DraftAnswer) {
    drafts.value = { ...drafts.value, [questionId]: draft };
  }

  function enqueue(fields: Omit<AnswerPatchDto, 'clientSeq' | 'clientAnsweredAt'>, answeredAt: number = Date.now()) {
    if (!cache) return;
    const floor = itemOf(fields.questionId)?.answerState?.clientSeq ?? 0;
    const allocated = allocateSeq(cache, floor);
    cache = enqueuePatch(allocated.cache, {
      ...fields,
      clientSeq: allocated.seq,
      clientAnsweredAt: new Date(serverTime(offset.value, answeredAt)).toISOString(),
    });
    persist();
  }

  function canWriteAt(answeredAt: number): boolean {
    if (canAnswer.value) return true;
    return (
      isMock.value && writable.value && deadline.value !== null && serverTime(offset.value, answeredAt) < deadline.value
    );
  }

  /** 草稿写入作答：模考进入缓存批量同步，答完即判立即提交 */
  async function saveAnswer(questionId: string, options: SaveAnswerOptions = {}): Promise<void> {
    const item = itemOf(questionId);
    const answeredAt = options.answeredAt ?? Date.now();
    if (!item || !canWriteAt(answeredAt) || (!isMock.value && isAnswerLocked(item))) return;
    const answer = buildPracticeAnswer(item.question.type, drafts.value[questionId]);
    if (!isMock.value && answer === null) return;
    const { durationSec } = options;
    enqueue(
      { questionId, answer, ...(durationSec !== undefined && { durationSec: Math.round(durationSec) }) },
      answeredAt,
    );
    updateCard(questionId, { answered: answer !== null });
    if (!isMock.value) await flush();
  }

  async function toggleMark(questionId: string): Promise<void> {
    const entry = cardByQuestion.value.get(questionId);
    if (!entry || !canAnswer.value) return;
    if (!items.value[entry.index]) await ensureItems(entry.index);
    if (!canAnswer.value) return;
    const markedForReview = !entry.markedForReview;
    enqueue({ questionId, markedForReview });
    updateCard(questionId, { markedForReview });
    if (!isMock.value) await flush();
  }

  function applyResults(results: AnswerResultDto[]) {
    const nextItems = { ...items.value };
    const nextDrafts = { ...drafts.value };
    for (const result of results) {
      const index = cardByQuestion.value.get(result.questionId)?.index;
      const item = index === undefined ? undefined : nextItems[index];
      if (index !== undefined && item) {
        nextItems[index] = {
          ...item,
          answerState: result.answerState ?? item.answerState,
          solution: result.solution ?? item.solution,
          hiddenReason: result.hiddenReason,
        };
      }
      if (hasPendingAnswer(result.questionId)) continue;
      if (!isMock.value) delete nextDrafts[result.questionId];
      const state = result.answerState;
      updateCard(result.questionId, {
        hiddenReason: result.hiddenReason,
        ...(state && {
          answered: state.answer !== null,
          isCorrect: state.isCorrect,
          isPartial: state.isPartial,
          selfAssessment: state.selfAssessment,
          markedForReview: state.markedForReview,
        }),
      });
    }
    items.value = nextItems;
    drafts.value = nextDrafts;
  }

  function end(reason: PracticeEndReason) {
    const current = session.value;
    if (current) clearAnswerCache(current.id);
    if (cache) cache = { ...cache, pending: [] };
    pendingCount.value = 0;
    endReason.value = reason;
    stopAutoSync();
  }

  function blockQuestions(questionIds: string[]) {
    const ids = new Set(questionIds);
    const nextItems = { ...items.value };
    Object.values(nextItems).forEach(item => {
      if (ids.has(item.question.id)) nextItems[item.index] = { ...item, hiddenReason: 'mockInProgress' };
    });
    items.value = nextItems;
    card.value = card.value.map(item =>
      ids.has(item.questionId) ? { ...item, answered: false, hiddenReason: 'mockInProgress' } : item,
    );
    const nextDrafts = { ...drafts.value };
    questionIds.forEach(id => delete nextDrafts[id]);
    drafts.value = nextDrafts;
  }

  function rollbackQuestion(questionId: string) {
    const item = itemOf(questionId);
    const nextDrafts = { ...drafts.value };
    delete nextDrafts[questionId];
    drafts.value = nextDrafts;
    updateCard(questionId, {
      answered: (item?.answerState?.answer ?? null) !== null,
      markedForReview: item?.answerState?.markedForReview ?? false,
    });
  }

  /** 模考截止竞态：确认会话已结束或已过自动交卷时间后才清缓存 */
  async function confirmClosed(): Promise<boolean> {
    try {
      const detail = await refresh();
      if (!detail) return true;
      const autoSubmitAt = detail.autoSubmitAt ? new Date(detail.autoSubmitAt).getTime() : null;
      return (
        detail.status !== PracticeSessionStatus.IN_PROGRESS ||
        (autoSubmitAt !== null && serverTime(offset.value) >= autoSubmitAt)
      );
    } catch {
      return false;
    }
  }

  async function handleSyncError(error: unknown, batch: AnswerPatchDto[]): Promise<SendOutcome> {
    const errorKey = error instanceof ApiError ? error.errorKey : undefined;
    if (errorKey === 'sessionTakenOver') {
      end('takenOver');
      return 'stop';
    }
    if (errorKey === 'sessionClosed') {
      if (!isMock.value || (await confirmClosed())) {
        end('closed');
      } else {
        syncError.value = true;
      }
      return 'stop';
    }
    if (!cache) return 'stop';
    if (errorKey === 'questionInMockInProgress') {
      const listed = questionIdsOf((error as ApiError).details);
      const ids = listed.length > 0 ? listed : batch.map(patch => patch.questionId);
      cache = dropPatches(cache, ids);
      persist();
      blockQuestions(ids);
      showToast(getBusinessErrorMessage(errorKey));
      flushQueued = true;
      return 'ok';
    }
    if (isTransientError(error)) {
      syncError.value = true;
      return 'stop';
    }
    if (batch.length > 1) {
      for (const patch of batch) {
        if ((await sendBatch([patch])) === 'stop') return 'stop';
      }
      return 'ok';
    }
    cache = dropPatches(
      cache,
      batch.map(patch => patch.questionId),
    );
    persist();
    batch.forEach(patch => rollbackQuestion(patch.questionId));
    showToast((error as Error)?.message || '作答保存失败');
    return 'ok';
  }

  async function sendBatch(batch: AnswerPatchDto[]): Promise<SendOutcome> {
    const current = session.value;
    if (!current || !cache || endReason.value !== null) return 'stop';
    const sessionId = current.id;
    try {
      const result = await savePracticeAnswers(
        sessionId,
        { deviceId: cache.deviceId, ...(isMock.value && { offline: true }), answers: batch },
        SILENT,
      );
      if (session.value?.id !== sessionId || !cache) return 'stop';
      cache = acknowledgePatches(cache, batch);
      persist();
      offset.value = clockOffset(result.serverNow);
      syncError.value = false;
      applyResults(result.results);
      if (result.skippedQuestionIds.length > 0) {
        showToast(`${result.skippedQuestionIds.length} 道题作答时间晚于截止时间，未计入成绩`);
      }
      return 'ok';
    } catch (error) {
      if (session.value?.id !== sessionId) return 'stop';
      return handleSyncError(error, batch);
    }
  }

  async function sendPending(): Promise<boolean> {
    if (!session.value || !cache || cache.pending.length === 0 || endReason.value !== null) return true;
    const outcome = await sendBatch(cache.pending.slice(0, MAX_BATCH));
    if (outcome === 'stop') return false;
    if (cache && cache.pending.length > 0) flushQueued = true;
    return true;
  }

  /** 同步未提交的作答；同步中再次调用时合并为下一轮；返回最后一轮是否成功 */
  function flush(): Promise<boolean> {
    if (flushTask) {
      flushQueued = true;
      return flushTask;
    }
    const task = (async () => {
      let ok: boolean;
      do {
        flushQueued = false;
        ok = await sendPending();
      } while (ok && flushQueued && pendingCount.value > 0);
      return ok;
    })().finally(() => {
      if (flushTask === task) flushTask = null;
    });
    flushTask = task;
    return task;
  }

  async function selfAssess(questionId: string, selfAssessment: SelfAssessment): Promise<void> {
    const current = session.value;
    if (!current || !canSelfAssess.value) return;
    const result = await selfAssessPracticeAnswer(current.id, { questionId, selfAssessment });
    if (session.value?.id === current.id) applyResults([result]);
  }

  /** 交卷或结束练习：先同步全部作答，未同步完成时抛错；进行中锁定作答 */
  async function submit(): Promise<PracticeSessionDetailDto> {
    const current = session.value;
    if (!current) throw new Error('练习不存在');
    if (submitting.value) throw new Error('正在提交');
    submitting.value = true;
    try {
      if (pendingCount.value > 0) {
        await flush();
        if (endReason.value !== null) throw new Error('练习已结束');
        if (pendingCount.value > 0) throw new Error('作答尚未同步，请检查网络后重试');
      }
      const detail = await submitPracticeSession(current.id);
      clearAnswerCache(current.id);
      stopAutoSync();
      if (session.value?.id === current.id) applySession(detail, true);
      return detail;
    } finally {
      submitting.value = false;
    }
  }

  async function abandon(): Promise<PracticeSessionDetailDto> {
    const current = session.value;
    if (!current) throw new Error('练习不存在');
    const detail = await abandonPracticeSession(current.id);
    clearAnswerCache(current.id);
    if (cache) cache = { ...cache, pending: [] };
    stopAutoSync();
    if (session.value?.id === current.id) applySession(detail, false);
    return detail;
  }

  function updateProgress(index: number) {
    const current = session.value;
    if (!current || !inProgress.value || index === lastProgress || index < 0 || index >= total.value) return;
    lastProgress = index;
    updatePracticeProgress(current.id, { lastIndex: index }, SILENT).catch(() => {
      if (lastProgress === index) lastProgress = -1;
    });
  }

  function tick() {
    now.value = Date.now();
    ticks += 1;
    if (ticks % SYNC_INTERVAL_SEC === 0 && pendingCount.value > 0) {
      flush().catch(() => undefined);
    }
  }

  function startAutoSync() {
    stopAutoSync();
    ticks = 0;
    now.value = Date.now();
    timer = setInterval(tick, 1000);
  }

  function stopAutoSync() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  async function syncDetachedCache(sessionId: string, saved: AnswerCache): Promise<void> {
    try {
      const batch = saved.pending.slice(0, MAX_BATCH);
      await savePracticeAnswers(sessionId, { deviceId: saved.deviceId, offline: true, answers: batch }, SILENT);
      const next = acknowledgePatches(saved, batch);
      if (next.pending.length === 0) clearAnswerCache(sessionId);
      else saveAnswerCache(sessionId, next);
    } catch (error) {
      if (isClosingError(error) || !isTransientError(error)) clearAnswerCache(sessionId);
    }
  }

  /** 不在进行中列表的会话：没有待同步作答的删除缓存，有的尝试补交 */
  function evictCaches(activeIds: string[]): Promise<void> {
    const keep = new Set(activeIds);
    if (session.value) keep.add(session.value.id);
    const tasks = listCachedSessionIds()
      .filter(id => !keep.has(id))
      .map(id => {
        const saved = readAnswerCache(id);
        if (!saved || saved.pending.length === 0) {
          clearAnswerCache(id);
          return Promise.resolve();
        }
        return syncDetachedCache(id, saved);
      });
    return Promise.all(tasks).then(() => undefined);
  }

  async function fetchOngoing(params?: GetOngoingPracticeSessionsParams): Promise<PracticeSessionDto[]> {
    const list = await getOngoingPracticeSessions(params, SILENT);
    ongoing.value = list;
    evictCaches(list.map(item => item.id)).catch(() => undefined);
    return list;
  }

  function reset() {
    stopAutoSync();
    clearAllAnswerCaches();
    session.value = null;
    card.value = [];
    items.value = {};
    drafts.value = {};
    insufficient.value = false;
    isActiveDevice.value = true;
    endReason.value = null;
    pendingCount.value = 0;
    syncError.value = false;
    submitting.value = false;
    ongoing.value = [];
    cache = null;
    preparedId = null;
    segmentTask = null;
    flushTask = null;
    flushQueued = false;
    lastProgress = -1;
  }

  return {
    session,
    card,
    items,
    drafts,
    offset,
    now,
    insufficient,
    isActiveDevice,
    endReason,
    pendingCount,
    syncError,
    submitting,
    ongoing,
    mode,
    isMock,
    isMemorize,
    inProgress,
    total,
    remaining,
    timeUp,
    revealed,
    canAnswer,
    canSelfAssess,
    cardByQuestion,
    cardByIndex,
    unansweredCount,
    start,
    open,
    refresh,
    ensureItems,
    itemOf,
    draftOf,
    isAnswerLocked,
    statusOf,
    setDraft,
    saveAnswer,
    toggleMark,
    flush,
    selfAssess,
    submit,
    abandon,
    updateProgress,
    startAutoSync,
    stopAutoSync,
    fetchOngoing,
    reset,
  };
});
