import { describe, expect, it } from 'vitest';
import { NotificationCategory } from '@/api';
import { PAGES } from '@/constants';
import { notificationLinkOf } from '@/utils/notification-link';

describe('notificationLinkOf', () => {
  it('有 url 时优先使用 url', () => {
    expect(
      notificationLinkOf({
        category: NotificationCategory.STUDY,
        metadata: { url: '/pages-sub/order/list/index', questionId: 'q1' },
      }),
    ).toBe('/pages-sub/order/list/index');
  });

  it('学习通知用 questionId 打开题目详情', () => {
    expect(
      notificationLinkOf({ category: NotificationCategory.STUDY, metadata: { errataId: 'e1', questionId: 'q 1' } }),
    ).toBe(`${PAGES.STUDY_QUESTION}?questionId=q%201`);
  });

  it('其他分类的 questionId 不生成跳转地址', () => {
    expect(notificationLinkOf({ category: NotificationCategory.SYSTEM, metadata: { questionId: 'q1' } })).toBe('');
  });

  it('没有可用的跳转信息时返回空字符串', () => {
    expect(notificationLinkOf({ category: NotificationCategory.STUDY })).toBe('');
    expect(notificationLinkOf({ category: NotificationCategory.STUDY, metadata: { url: '', questionId: 1 } })).toBe('');
  });
});
