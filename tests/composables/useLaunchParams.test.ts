import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { defineComponent, getCurrentInstance, h } from 'vue';
import { mount } from '@vue/test-utils';

const hooks = vi.hoisted(() => ({
  load: undefined as undefined | ((query: Record<string, unknown>) => void),
}));

vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (callback: typeof hooks.load) => {
    hooks.load = callback;
  },
}));

const { parseSceneParams, resolveLaunchParams, useLaunchParams } = await import('@/composables/useLaunchParams');

type UseLaunchParamsResult = ReturnType<typeof useLaunchParams>;

const getCurrentPagesMock = getCurrentPages as unknown as Mock;

afterEach(() => {
  getCurrentPagesMock.mockReset().mockReturnValue([]);
});

/** 挂载页面根组件，pageCtx 模拟 uni-app 注入到页面实例上的字段，inChild 时在子组件中调用 */
function mountPage(pageCtx: Record<string, unknown>, inChild = false): UseLaunchParamsResult {
  let result!: UseLaunchParamsResult;
  const Child = defineComponent({
    setup() {
      result = useLaunchParams();
      return () => null;
    },
  });
  const Page = defineComponent({
    setup() {
      const { ctx } = getCurrentInstance() as unknown as { ctx: Record<string, unknown> };
      Object.assign(ctx, { $mpType: 'page', ...pageCtx });
      if (!inChild) result = useLaunchParams();
      return () => (inChild ? h(Child) : null);
    },
  });
  mount(Page);
  return result;
}

describe('parseSceneParams', () => {
  it('按 k=v&k2=v2 解析', () => {
    expect(parseSceneParams('sc=AB12&id=9')).toEqual({ sc: 'AB12', id: '9' });
  });

  it('解析时不解码值', () => {
    expect(parseSceneParams('p=100%25')).toEqual({ p: '100%25' });
  });

  it('不含 = 时整体保留为 scene', () => {
    expect(parseSceneParams('AB12')).toEqual({ scene: 'AB12' });
  });

  it('值按第一个 = 拆分，忽略空键，无值的键取空串', () => {
    expect(parseSceneParams('a=1=2&=x&flag')).toEqual({ a: '1=2', flag: '' });
  });

  it('空值返回空对象', () => {
    expect(parseSceneParams('')).toEqual({});
    expect(parseSceneParams(undefined)).toEqual({});
  });
});

describe('resolveLaunchParams', () => {
  it('普通参数解码，scene 解码后展开合并', () => {
    expect(resolveLaunchParams({ from: '%E6%B5%B7%E6%8A%A5', scene: 'sc%3DAB12%26id%3D9' })).toEqual({
      from: '海报',
      sc: 'AB12',
      id: '9',
    });
  });

  it('scene 编码格式错误时按原值解析', () => {
    expect(resolveLaunchParams({ scene: 'p=100%&id=1' })).toEqual({ p: '100%', id: '1' });
  });

  it('按传入的解码函数处理，H5 与 App 已解码的参数不二次解码', () => {
    expect(resolveLaunchParams({ name: 'a%25b', scene: 'k=100%25' }, value => value)).toEqual({
      name: 'a%25b',
      k: '100%25',
    });
  });

  it('同名时普通参数优先', () => {
    expect(resolveLaunchParams({ id: '2', scene: 'id%3D1' })).toEqual({ id: '2' });
  });

  it('非字符串值转为字符串，跳过 undefined', () => {
    expect(resolveLaunchParams({ id: 1, empty: undefined })).toEqual({ id: '1' });
  });

  it('无参数时返回空对象', () => {
    expect(resolveLaunchParams(undefined)).toEqual({});
  });
});

describe('useLaunchParams', () => {
  it('onLoad 后提供合并后的参数', () => {
    const { params, get } = useLaunchParams();
    expect(get('sc')).toBeUndefined();

    hooks.load?.({ id: '7', scene: 'sc%3DAB12' });

    expect(params.value).toEqual({ id: '7', sc: 'AB12' });
    expect(get('sc')).toBe('AB12');
    expect(get('missing')).toBeUndefined();
  });

  it('自身 onLoad 执行前读取所在页面 $scope.options', () => {
    const { params, get } = mountPage({ $scope: { options: { id: '3', scene: 'sc%3DAB12' } } });

    expect(get('id')).toBe('3');
    expect(get('sc')).toBe('AB12');
    expect(params.value).toEqual({ id: '3', sc: 'AB12' });
  });

  it('$scope 无参数时读取所在页面 $page.options', () => {
    const { get } = mountPage({ $page: { options: { id: '4' } } });

    expect(get('id')).toBe('4');
  });

  it('子组件中沿 parent 读取所在页面参数', () => {
    const { get } = mountPage({ $scope: { options: { id: '5' } } }, true);

    expect(get('id')).toBe('5');
  });

  it('不读取页面栈栈顶其他页面的参数', () => {
    getCurrentPagesMock.mockReturnValue([{ route: 'pages/other/index', options: { id: '99' } }]);

    expect(mountPage({}).params.value).toEqual({});
    expect(useLaunchParams().params.value).toEqual({});
  });

  it('onLoad 后参数响应式更新', () => {
    const { params } = mountPage({ $scope: { options: { id: '3' } } });
    expect(params.value).toEqual({ id: '3' });

    hooks.load?.({ id: '8' });

    expect(params.value).toEqual({ id: '8' });
  });
});
