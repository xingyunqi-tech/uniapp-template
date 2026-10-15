/**
 * 截图用的接口模拟数据，覆盖列表与详情页面
 */

export type MockMode = 'data' | 'empty' | 'error';

const now = new Date().toISOString();

const paginate = <T>(list: T[]) => ({ list, total: list.length, page: 1, limit: 20, totalPages: 1 });

const orders = [
  {
    id: 1,
    userId: 1,
    orderNo: 'ORD202601010001',
    status: 'UNPAID',
    totalAmount: 19900,
    refundedAmount: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    userId: 1,
    orderNo: 'ORD202601010002',
    status: 'PAID',
    paymentChannel: 'WECHAT',
    totalAmount: 5900,
    paidAmount: 5900,
    refundedAmount: 1000,
    paidAt: now,
    metadata: { note: '尽快发货' },
    createdAt: now,
    updatedAt: now,
  },
];

/** 列表接口，empty / error 模式只影响这些接口 */
const LIST_PATHS = /\/api\/v1\/(orders|favorites|notifications|addresses)$/;

const routes: [RegExp, () => unknown][] = [
  [/\/api\/v1\/orders\/\d+$/, () => orders[1]],
  [/\/api\/v1\/orders$/, () => paginate(orders)],
  [
    /\/api\/v1\/favorites$/,
    () =>
      paginate([
        { id: 1, targetType: 'ARTICLE', targetId: '1', title: '示例收藏一', image: '', createdAt: now },
        { id: 2, targetType: 'PRODUCT', targetId: '2', title: '示例收藏二', image: '', createdAt: now },
      ]),
  ],
  [/\/api\/v1\/notifications\/unread-count$/, () => 2],
  [/\/api\/v1\/notifications\/settings$/, () => []],
  [
    /\/api\/v1\/notifications$/,
    () =>
      paginate([
        { id: 1, title: '订单已发货', content: '您的订单已发货', category: 'ORDER', isRead: false, createdAt: now },
        {
          id: 2,
          title: '系统维护通知',
          content: '今晚 23:00 进行系统维护',
          category: 'SYSTEM',
          isRead: true,
          createdAt: now,
        },
      ]),
  ],
  [
    /\/api\/v1\/addresses$/,
    () =>
      paginate([
        {
          id: 1,
          name: '张三',
          phone: '13800000000',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          address: '科技园 1 号',
          isDefault: true,
        },
        {
          id: 2,
          name: '李四',
          phone: '13900000000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          address: '望京 1 号',
          isDefault: false,
        },
      ]),
  ],
];

/**
 * 按请求路径返回模拟响应体；返回 null 表示不模拟（请求被中断），返回 'error' 表示返回 500
 */
export function resolveMock(pathname: string, mode: MockMode): unknown {
  if (LIST_PATHS.test(pathname)) {
    if (mode === 'error') return 'error';
    if (mode === 'empty') return { code: 200, message: 'success', data: paginate([]) };
  }
  for (const [pattern, data] of routes) {
    if (pattern.test(pathname)) return { code: 200, message: 'success', data: data() };
  }
  return null;
}
