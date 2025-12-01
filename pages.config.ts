import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages';

export default defineUniPages({
  easycom: {
    autoscan: true,
    custom: {
      '^uni-(.*)': '@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue',
      '^u-(.*)': '@/components/U$1/index.vue',
    },
  },
  pages: [],
  subPackages: [],
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
