/** 服务端时间减本地时间（毫秒） */
export function clockOffset(serverNow: string, localNow: number = Date.now()): number {
  const server = new Date(serverNow).getTime();
  return Number.isNaN(server) ? 0 : server - localNow;
}

export function serverTime(offset: number, localNow: number = Date.now()): number {
  return localNow + offset;
}

/** 距截止的剩余秒数，向上取整且不小于 0；没有截止时间时为 null */
export function remainingSeconds(
  deadlineAt: string | null,
  offset: number,
  localNow: number = Date.now(),
): number | null {
  if (!deadlineAt) return null;
  const deadline = new Date(deadlineAt).getTime();
  if (Number.isNaN(deadline)) return null;
  return Math.max(0, Math.ceil((deadline - serverTime(offset, localNow)) / 1000));
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** 倒计时：不足 1 小时为 MM:SS，否则 HH:MM:SS */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = `${pad(minutes)}:${pad(total % 60)}`;
  return hours > 0 ? `${pad(hours)}:${rest}` : rest;
}

/** 用时：不足 1 分钟为 z 秒，不足 1 小时为 y 分 z 秒，否则为 x 小时 y 分 */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) return `${hours} 小时 ${minutes} 分`;
  if (minutes > 0) return `${minutes} 分 ${rest} 秒`;
  return `${rest} 秒`;
}
