import type { AnswerPatchDto } from '@/api';
import { storage, STORAGE_KEYS } from './storage';

/** 会话的未同步作答：deviceId 为写入时的设备，seq 为设备内已用的最大序号 */
export interface AnswerCache {
  deviceId: string;
  seq: number;
  pending: AnswerPatchDto[];
}

const CACHE_PREFIX = `${STORAGE_KEYS.PRACTICE_ANSWERS}:`;
const STORAGE_PREFIX = 'uni_';

function cacheKey(sessionId: string): string {
  return `${CACHE_PREFIX}${sessionId}`;
}

function isAnswerCache(value: unknown): value is AnswerCache {
  if (!value || typeof value !== 'object') return false;
  const cache = value as Partial<AnswerCache>;
  return typeof cache.deviceId === 'string' && typeof cache.seq === 'number' && Array.isArray(cache.pending);
}

export function loadAnswerCache(sessionId: string, deviceId: string): AnswerCache {
  const saved = storage.get<unknown>(cacheKey(sessionId));
  if (isAnswerCache(saved) && saved.deviceId === deviceId) return saved;
  return { deviceId, seq: 0, pending: [] };
}

export function saveAnswerCache(sessionId: string, cache: AnswerCache): void {
  storage.set(cacheKey(sessionId), cache);
}

export function clearAnswerCache(sessionId: string): void {
  storage.remove(cacheKey(sessionId));
}

/** 本地有作答缓存的会话 ID */
export function listCachedSessionIds(): string[] {
  const keys = storage.getInfo()?.keys ?? [];
  const prefix = `${STORAGE_PREFIX}${CACHE_PREFIX}`;
  return keys.filter(key => key.startsWith(prefix)).map(key => key.slice(prefix.length));
}

export function clearAllAnswerCaches(): void {
  listCachedSessionIds().forEach(clearAnswerCache);
}

/** 读取会话缓存，不存在或格式不符时为 null */
export function readAnswerCache(sessionId: string): AnswerCache | null {
  const saved = storage.get<unknown>(cacheKey(sessionId));
  return isAnswerCache(saved) ? saved : null;
}

/** 分配下一个序号，floor 为该题服务端已存的序号 */
export function allocateSeq(cache: AnswerCache, floor = 0): { cache: AnswerCache; seq: number } {
  const seq = Math.max(cache.seq, floor) + 1;
  return { cache: { ...cache, seq }, seq };
}

/** 同一题的未同步作答合并为一条，后写入的字段覆盖先写入的 */
export function enqueuePatch(cache: AnswerCache, patch: AnswerPatchDto): AnswerCache {
  const previous = cache.pending.find(item => item.questionId === patch.questionId);
  const defined = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
  const merged = { ...previous, ...defined } as AnswerPatchDto;
  return {
    ...cache,
    pending: [...cache.pending.filter(item => item.questionId !== patch.questionId), merged],
  };
}

/** 移除已送达的作答；发送期间同题又有更新（序号更大）的保留 */
export function acknowledgePatches(cache: AnswerCache, sent: AnswerPatchDto[]): AnswerCache {
  const sentSeq = new Map(sent.map(patch => [patch.questionId, patch.clientSeq]));
  return {
    ...cache,
    pending: cache.pending.filter(patch => {
      const seq = sentSeq.get(patch.questionId);
      return seq === undefined || patch.clientSeq > seq;
    }),
  };
}

export function dropPatches(cache: AnswerCache, questionIds: string[]): AnswerCache {
  const ids = new Set(questionIds);
  return { ...cache, pending: cache.pending.filter(patch => !ids.has(patch.questionId)) };
}
