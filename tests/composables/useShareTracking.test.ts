import { beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
  load: undefined as undefined | ((query: Record<string, string>) => void),
}));

const stores = vi.hoisted(() => ({
  fetchShareByCode: vi.fn(),
  trackShareAction: vi.fn(),
}));

vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (callback: typeof hooks.load) => {
    hooks.load = callback;
  },
}));

vi.mock('@/store', () => ({
  useShareStore: () => ({ fetchShareByCode: stores.fetchShareByCode, trackShareAction: stores.trackShareAction }),
}));

const { useShareTracking } = await import('@/composables/useShareTracking');

beforeEach(() => {
  stores.fetchShareByCode.mockReset().mockResolvedValue({ shareCode: 'FROM' });
  stores.trackShareAction.mockReset().mockResolvedValue(undefined);
});

describe('useShareTracking', () => {
  it('带分享码进入时记录来源、获取分享记录并追踪浏览', async () => {
    const { isFromShare, shareCode } = useShareTracking();

    hooks.load?.({ sc: 'FROM' });

    await vi.waitFor(() => expect(stores.trackShareAction).toHaveBeenCalledWith('FROM', 'VIEW', expect.any(Object)));
    expect(stores.fetchShareByCode).toHaveBeenCalledWith('FROM');
    expect(isFromShare.value).toBe(true);
    expect(shareCode.value).toBe('FROM');
  });

  it('从小程序码 scene 中读取分享码', async () => {
    const { isFromShare, shareCode } = useShareTracking();

    hooks.load?.({ scene: 'sc%3DFROM%26id%3D1' });

    await vi.waitFor(() => expect(stores.trackShareAction).toHaveBeenCalledWith('FROM', 'VIEW', expect.any(Object)));
    expect(stores.fetchShareByCode).toHaveBeenCalledWith('FROM');
    expect(isFromShare.value).toBe(true);
    expect(shareCode.value).toBe('FROM');
  });

  it('无分享码时不请求分享记录', () => {
    const { isFromShare } = useShareTracking();

    hooks.load?.({ scene: 'id%3D1' });

    expect(stores.fetchShareByCode).not.toHaveBeenCalled();
    expect(isFromShare.value).toBe(false);
  });
});
