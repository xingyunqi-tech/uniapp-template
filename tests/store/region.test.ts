import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const api = vi.hoisted(() => ({
  getProvinces: vi.fn(),
  getCities: vi.fn(),
  getDistricts: vi.fn(),
  getRegionByCode: vi.fn(),
  getRegionTree: vi.fn(),
}));

vi.mock('@/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

const { useRegionStore } = await import('@/store/modules/region');

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(api).forEach(fn => fn.mockReset());
});

describe('region store', () => {
  it('相同请求进行中时复用同一个请求', async () => {
    const pending = deferred<unknown[]>();
    api.getCities.mockReturnValue(pending.promise);
    const store = useRegionStore();

    const a = store.fetchCities('11');
    const b = store.fetchCities('11');
    pending.resolve([{ code: '1101', name: '北京市' }]);

    expect(await a).toBe(await b);
    expect(api.getCities).toHaveBeenCalledTimes(1);
  });

  it('并发请求时全部结束后 loading 才为 false', async () => {
    const provinces = deferred<unknown[]>();
    const cities = deferred<unknown[]>();
    api.getProvinces.mockReturnValue(provinces.promise);
    api.getCities.mockReturnValue(cities.promise);
    const store = useRegionStore();

    const p = store.fetchProvinces();
    const c = store.fetchCities('11');
    provinces.resolve([]);
    await p;
    expect(store.loading).toBe(true);

    cities.resolve([]);
    await c;
    expect(store.loading).toBe(false);
  });

  it('codesToNames 不为空编码发请求', async () => {
    api.getRegionByCode.mockImplementation(async (code: string) => ({ code, name: `名称${code}` }));
    const store = useRegionStore();

    await expect(store.codesToNames('11', '', '')).resolves.toEqual({ province: '名称11', city: '', district: '' });
    expect(api.getRegionByCode).toHaveBeenCalledTimes(1);

    api.getRegionByCode.mockClear();
    await store.codesToNames('', '', '');
    expect(api.getRegionByCode).not.toHaveBeenCalled();
  });
});
