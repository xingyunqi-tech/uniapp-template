/// <reference types="@dcloudio/types" />
/// <reference types="@uni-helper/uni-app-types" />
/// <reference types="@uni-helper/uni-ui-types" />

// 扩展 uni 命名空间
declare namespace UniApp {
  // 可以在这里扩展 UniApp 类型
}

/** uni-icons 图标类型 */
type UniIconsType = UniHelper.UniIconsType;

/** uni-data-picker 值类型 (实际支持数组，但类型定义不完整) */
type UniDataPickerValueArray = Array<string | number>;

// 小程序全局变量
declare const wx: any;
declare const my: any;
declare const swan: any;
declare const tt: any;
declare const qq: any;
