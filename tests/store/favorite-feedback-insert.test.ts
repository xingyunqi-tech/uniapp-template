import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const api = vi.hoisted(() => ({
  getFavorites: vi.fn(),
  createFavorite: vi.fn(),
  toggleFavorite: vi.fn(),
  getFeedbacks: vi.fn(),
  getFeedback: vi.fn(),
  createFeedback: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { useFavoriteStore } = await import('@/store/modules/favorite');
const { useFeedbackStore } = await import('@/store/modules/feedback');

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
});

describe('收藏插入列表', () => {
  const favorite = (id: number, targetType: string) => ({ id, targetType, targetId: `t${id}` }) as never;

  it('新收藏符合当前筛选类型时插入', async () => {
    api.getFavorites.mockResolvedValue({ list: [favorite(1, 'product')], total: 1 });
    const store = useFavoriteStore();
    await store.fetchFavoriteList('product' as never, true);
    api.createFavorite.mockResolvedValue(favorite(2, 'product'));

    await store.addFavorite({ targetType: 'product', targetId: 't2' } as never);

    expect(store.favoriteList.map(f => f.id)).toEqual([2, 1]);
  });

  it('新收藏不符合当前筛选类型时不插入', async () => {
    api.getFavorites.mockResolvedValue({ list: [favorite(1, 'product')], total: 1 });
    const store = useFavoriteStore();
    await store.fetchFavoriteList('product' as never, true);
    api.toggleFavorite.mockResolvedValue({ isFavorited: true, favorite: favorite(2, 'article') });

    await store.toggle({ targetType: 'article', targetId: 't2' } as never);

    expect(store.favoriteList.map(f => f.id)).toEqual([1]);
  });

  it('列表尚未加载时不插入', async () => {
    const store = useFavoriteStore();
    api.createFavorite.mockResolvedValue(favorite(2, 'product'));

    await store.addFavorite({ targetType: 'product', targetId: 't2' } as never);

    expect(store.favoriteList).toEqual([]);
  });
});

describe('反馈', () => {
  const feedback = (id: number, type: string) => ({ id, type }) as never;

  it('新反馈符合当前筛选类型时插入，否则不插入', async () => {
    api.getFeedbacks.mockResolvedValue({ list: [feedback(1, 'bug')], total: 1 });
    const store = useFeedbackStore();
    await store.fetchFeedbackList('bug' as never, true);

    api.createFeedback.mockResolvedValueOnce(feedback(2, 'suggestion'));
    await store.submitFeedback({} as never);
    expect(store.feedbackList.map(f => f.id)).toEqual([1]);

    api.createFeedback.mockResolvedValueOnce(feedback(3, 'bug'));
    await store.submitFeedback({} as never);
    expect(store.feedbackList.map(f => f.id)).toEqual([3, 1]);
  });
});
