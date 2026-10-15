import { defineManifestConfig } from '@uni-helper/vite-plugin-uni-manifest';

export default defineManifestConfig({
  name: 'UniApp Template',
  appid: '__UNI__XXXXXXX',
  description: 'Uni-app 多端应用模板，支持 H5、微信小程序、支付宝小程序、App',
  versionName: '1.0.0',
  versionCode: '100',
  transformPx: false,

  /* 微信小程序配置 */
  'mp-weixin': {
    appid: 'wx527069a3e01ad680',
    __usePrivacyCheck__: true,
    darkmode: true,
    themeLocation: 'theme.json',
    setting: {
      urlCheck: false,
      es6: true,
      postcss: true,
      minified: true,
    },
    usingComponents: true,
    // virtualHost 组件把父级传入的 class / style 合并到根节点（UButton 依赖）
    mergeVirtualHostAttributes: true,
    // 按需注入组件，优化启动性能
    lazyCodeLoading: 'requiredComponents',
    // 分包优化
    optimization: {
      subPackages: true,
    },
  },

  /* 支付宝小程序配置 */
  'mp-alipay': {
    appid: '2021006117665527',
    usingComponents: true,
    // 启用 component2 编译模式
    component2: true,
    // virtualHost 组件把父级传入的 class / style 合并到根节点（UButton 依赖）
    mergeVirtualHostAttributes: true,
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
    title: 'UniApp Template',
    darkmode: true,
    themeLocation: 'theme.json',
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
    darkmode: true,
    themeLocation: 'theme.json',
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
