/**
 * 日期时间工具函数
 */

/**
 * 格式化日期时间
 * @param date 日期对象、时间戳或日期字符串
 * @param format 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 *
 * 支持的格式化占位符：
 * - YYYY: 四位年份
 * - MM: 两位月份 (01-12)
 * - DD: 两位日期 (01-31)
 * - HH: 两位小时 (00-23)
 * - mm: 两位分钟 (00-59)
 * - ss: 两位秒数 (00-59)
 *
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

  // 使用对象映射和正则表达式确保正确替换，避免顺序问题
  const replacements: Record<string, string> = {
    YYYY: String(year),
    MM: padZero(month),
    DD: padZero(day),
    HH: padZero(hour),
    mm: padZero(minute),
    ss: padZero(second),
  };

  // 按照占位符长度降序排列，确保先替换长的占位符
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match] || match);
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
 * 字符串转日期对象，日期部分统一为 YYYY/MM/DD 以兼容 iOS，ISO 格式（含 T）按原样解析
 * @param dateStr 日期字符串
 * @returns 日期对象或 null
 */
export function str2Date(dateStr: string): Date | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();
  const normalized = trimmed.includes('T')
    ? trimmed
    : trimmed
        .replace(/^(\d{4})年(\d{1,2})月(\d{1,2})日?/, '$1/$2/$3')
        .replace(/^(\d{4})-(\d{1,2})-(\d{1,2})/, '$1/$2/$3');

  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}
