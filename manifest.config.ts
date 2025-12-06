import { defineManifestConfig } from '@uni-helper/vite-plugin-uni-manifest';

export default defineManifestConfig({
  name: '',
  appid: '',
  description: '',
  versionName: '1.0.0',
  versionCode: '100',
  transformPx: false,

  /* 微信小程序配置 */
  'mp-weixin': {
    appid: '',
    setting: {
      urlCheck: false,
      es6: true,
      postcss: true,
      minified: true,
    },
    usingComponents: true,
    // 按需注入组件，优化启动性能
    lazyCodeLoading: 'requiredComponents',
    // 分包优化
    optimization: {
      subPackages: true,
    },
  },

  /* 支付宝小程序配置 */
  'mp-alipay': {
    usingComponents: true,
    // 启用 component2 编译模式
    component2: true,
  },

  /* 百度小程序配置 */
  'mp-baidu': {
    usingComponents: true,
  },

  /* 抖音小程序配置 */
  'mp-toutiao': {
    usingComponents: true,
  },

  /* H5 配置 */
  h5: {
    title: '',
    router: {
      mode: 'history',
      base: '/',
    },
    optimization: {
      treeShaking: {
        enable: true,
      },
    },
  },

  /* App 配置 */
  'app-plus': {
    usingComponents: true,
    nvueStyleCompiler: 'uni-app',
    compilerVersion: 3,
    splashscreen: {
      alwaysShowBeforeRender: true,
      waiting: true,
      autoclose: true,
      delay: 0,
    },
    modules: {},
    distribute: {
      android: {
        permissions: [],
      },
      ios: {},
      sdkConfigs: {},
    },
  },

  uniStatistics: {
    enable: false,
  },

  vueVersion: '3',
});
