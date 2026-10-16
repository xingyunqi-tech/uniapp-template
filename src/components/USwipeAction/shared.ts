/** 页面实例 → 该页面当前展开实例的收起函数 */
const openedByPage = new WeakMap<object, () => void>();

/** 不在页面栈中（如测试环境）时共用的归属 */
const NO_PAGE = {};

/** 记录当前展开的实例，并收起同一页面中已展开的其他实例 */
export function markOpened(page: object | undefined, close: () => void) {
  const key = page ?? NO_PAGE;
  const opened = openedByPage.get(key);
  if (opened && opened !== close) opened();
  openedByPage.set(key, close);
}

export function markClosed(page: object | undefined, close: () => void) {
  const key = page ?? NO_PAGE;
  if (openedByPage.get(key) === close) openedByPage.delete(key);
}
