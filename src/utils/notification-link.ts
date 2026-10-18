import { NotificationCategory, type Notification } from '@/api';
import { PAGES } from '@/constants/pages';

/** 通知点击后的跳转地址：优先 metadata.url，学习通知用 questionId 打开题目详情，没有时返回空字符串 */
export function notificationLinkOf(item: Pick<Notification, 'category' | 'metadata'>): string {
  const url = item.metadata?.url;
  if (typeof url === 'string' && url) return url;
  const questionId = item.metadata?.questionId;
  if (item.category === NotificationCategory.STUDY && typeof questionId === 'string' && questionId) {
    return `${PAGES.STUDY_QUESTION}?questionId=${encodeURIComponent(questionId)}`;
  }
  return '';
}
