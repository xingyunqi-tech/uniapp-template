/**
 * 日期时间工具函数
 */

/**
 * 格式化日期时间
 * @param date 日期对象、时间戳或日期字符串
 * @param format 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDateTime(date: Date | number | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();

  const padZero = (num: number): string => String(num).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', padZero(month))
    .replace('DD', padZero(day))
    .replace('HH', padZero(hour))
    .replace('mm', padZero(minute))
    .replace('ss', padZero(second))
    .replace('M', String(month))
    .replace('D', String(day))
    .replace('H', String(hour))
    .replace('m', String(minute))
    .replace('s', String(second));
}

/**
 * 格式化相对时间
 * @param date 日期对象、时间戳或日期字符串
 * @returns 相对时间字符串，如 "刚刚"、"5分钟前"
 */
export function formatRelativeTime(date: Date | number | string): string {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  const now = Date.now();
  const diff = now - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 30) {
    return `${days}天前`;
  } else if (months < 12) {
    return `${months}个月前`;
  } else {
    return `${years}年前`;
  }
}

/**
 * 字符串转日期对象
 * @param dateStr 日期字符串
 * @returns 日期对象或 null
 */
export function str2Date(dateStr: string): Date | null {
  if (!dateStr) return null;

  // 处理各种常见格式
  const normalized = dateStr.replace(/年|月/g, '-').replace(/日/g, '').replace(/\//g, '-').trim();

  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}
