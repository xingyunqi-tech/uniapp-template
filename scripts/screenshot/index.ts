/**
 * H5 页面截图：启动本地静态服务托管 H5 构建产物，用模拟接口数据渲染页面并截图，用于改动前后的视觉对比
 *
 * 用法：
 *   pnpm build:h5 （包含组件演示页需用 npx uni build -p h5 --mode development）
 *   pnpm screenshot [页面路径...] [--dark] [--full] [--mock=data|empty|error] [--press=选择器] [--out=目录]
 *
 * 示例：
 *   pnpm screenshot /pages/mine/index --press=.u-menu-item
 *   pnpm screenshot /pages-sub/order/list/index --mock=empty
 */
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { resolveMock, type MockMode } from './mocks';

const ROOT = resolve(import.meta.dirname, '../..');
const DIST = join(ROOT, 'dist/build/h5');
const PORT = 4799;
const ORIGIN = `http://localhost:${PORT}`;

const DEFAULT_PAGES = [
  '/pages/index/index',
  '/pages/mine/index',
  '/pages-sub/order/list/index',
  '/pages-sub/order/detail/index?id=2',
  '/pages-sub/user/address/index',
  '/pages-sub/user/address-edit/index',
  '/pages-sub/user/profile/index',
  '/pages-sub/user/settings/index',
  '/pages-sub/user/favorite/index',
  '/pages-sub/user/notifications/index',
  '/pages-sub/user/password/index',
  '/pages-sub/other/feedback/index',
  '/pages/error/index',
];

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

function parseArgs(argv: string[]) {
  const flags = new Map<string, string>();
  const pages: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, value = 'true'] = arg.slice(2).split('=');
      flags.set(key, value);
    } else {
      pages.push(arg);
    }
  }
  return {
    pages: pages.length > 0 ? pages : DEFAULT_PAGES,
    dark: flags.has('dark'),
    full: flags.has('full'),
    mock: (flags.get('mock') ?? 'data') as MockMode,
    press: flags.get('press'),
    out: resolve(ROOT, flags.get('out') ?? 'screenshots'),
  };
}

/** 静态服务，未命中的路径回退到 index.html（H5 history 路由） */
function serve() {
  return createServer(async (req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let body: Buffer;
    let type = MIME[extname(path)] ?? 'application/octet-stream';
    try {
      body = await readFile(join(DIST, path));
    } catch {
      body = await readFile(join(DIST, 'index.html'));
      type = 'text/html';
    }
    res.writeHead(200, { 'content-type': type }).end(body);
  }).listen(PORT);
}

function fileName(page: string, opts: { dark: boolean; mock: MockMode }) {
  const base = page.replace(/^\//, '').replace(/[/?=&]+/g, '_');
  return [base, opts.mock !== 'data' && opts.mock, opts.dark && 'dark'].filter(Boolean).join('.');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('未找到 H5 构建产物，请先运行 pnpm build:h5');
    process.exit(1);
  }
  await mkdir(opts.out, { recursive: true });

  const server = serve();
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // 非本地请求一律走模拟数据，未模拟的直接中断，避免访问真实后端
  await context.route(
    url => !url.href.startsWith(ORIGIN),
    route => {
      const mock = resolveMock(new URL(route.request().url()).pathname, opts.mock);
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
      if (mock === 'error') {
        return route.fulfill({
          status: 500,
          headers,
          json: { code: 500, message: 'Internal Server Error', data: null },
        });
      }
      return mock ? route.fulfill({ status: 200, headers, json: mock }) : route.abort();
    },
  );

  // 模拟已登录与主题，uni H5 的存储格式为 { type, data }
  await context.addInitScript(dark => {
    localStorage.setItem('uni_token', JSON.stringify({ type: 'string', data: 'screenshot' }));
    if (dark) {
      localStorage.setItem(
        'global',
        JSON.stringify({ type: 'string', data: JSON.stringify({ currentTheme: 'dark', followSystemTheme: false }) }),
      );
    }
  }, opts.dark);

  const page = await context.newPage();
  for (const target of opts.pages) {
    await page.goto(ORIGIN + target);
    await page.waitForTimeout(1800);
    const name = fileName(target, opts);
    await page.screenshot({ path: join(opts.out, `${name}.png`), fullPage: opts.full });

    if (opts.press) {
      const box = await page.locator(opts.press).first().boundingBox();
      if (box) {
        const cdp = await context.newCDPSession(page);
        const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
        await page.waitForTimeout(150);
        await page.screenshot({ path: join(opts.out, `${name}.pressed.png`) });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      }
    }
    console.log(`✓ ${name}`);
  }

  await browser.close();
  server.close();
  console.log(`截图已保存到 ${opts.out}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
