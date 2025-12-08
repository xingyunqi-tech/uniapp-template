import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages';

export default defineUniPages({
  easycom: {
    autoscan: true,
    custom: {
      // uni-ui 组件
      '^uni-(.*)': '@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue',
      // 自定义组件 - PascalCase (UBanner -> @/components/UBanner/index.vue)
      '^(U[A-Z][a-zA-Z]*)$': '@/components/$1/index.vue',
      // AuthLayout 组件
      '^(AuthLayout)$': '@/components/$1/index.vue',
    },
  },
  pages: [],
  /**
   * 分包配置
   * 用于将小程序划分成不同的子包，减小主包体积
   * 主包大小限制：2M，总包大小限制：20M（微信小程序）
   *
   * 分包原则：
   * 1. TabBar 页面必须在主包
   * 2. 启动页面必须在主包
   * 3. 按业务模块划分分包
   * 4. 分包之间不能相互引用
   * 5. 主包可以引用分包资源
   *
   * 使用方法：
   * 1. 在 src/ 下创建分包目录，如 src/pages-sub/order/
   * 2. 在分包目录下创建页面，如 src/pages-sub/order/list/index.vue
   * 3. 页面会被自动扫描并添加到对应分包中
   */
  subPackages: [
    {
      root: 'pages-sub/order',
      pages: [],
    },
    {
      root: 'pages-sub/user',
      pages: [],
    },
    {
      root: 'pages-sub/other',
      pages: [],
    },
  ],
  globalStyle: {
    navigationBarTextStyle: 'black',
    navigationBarTitleText: 'UniApp',
    navigationBarBackgroundColor: '#ffffff',
    backgroundColor: '#f7f8fa',
    backgroundTextStyle: 'dark',
    enablePullDownRefresh: false,
    onReachBottomDistance: 50,
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#07c160',
    borderStyle: 'black',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'static/tabbar/home.png',
        selectedIconPath: 'static/tabbar/home-active.png',
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'static/tabbar/mine.png',
        selectedIconPath: 'static/tabbar/mine-active.png',
      },
    ],
  },
  condition: {
    current: 0,
    list: [
      {
        name: '首页',
        path: 'pages/index/index',
      },
      {
        name: '登录',
        path: 'pages/login/index',
      },
      {
        name: '注册',
        path: 'pages/register/index',
      },
      {
        name: '我的',
        path: 'pages/mine/index',
      },
    ],
  },
});
