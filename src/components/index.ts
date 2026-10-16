/**
 * 组件统一导出
 */

// ==================== 布局组件 ====================
// 认证页面布局 (登录、注册、忘记密码等)
export { default as AuthLayout } from './AuthLayout/index.vue';

// 自定义导航栏 (用于 navigationStyle: custom 页面)
export { default as UNavBar } from './UNavBar/index.vue';

// ==================== 基础组件 ====================
// 图标 (基于 uni-icons 封装，尺寸默认 rpx)
export { default as UIcon } from './UIcon/index.vue';
export type { UIconProps, IconName } from './UIcon/index.vue';

// 操作菜单组件 (底部弹出选项列表)
export { default as UActionSheet } from './UActionSheet/index.vue';
export type { ActionItem } from './UActionSheet/index.vue';

// 横幅/通知组件
export { default as UBanner } from './UBanner/index.vue';

// 空状态组件 (uni-ui 无此组件)
export { default as UEmpty } from './UEmpty/index.vue';

// 卡片容器 (背景、圆角、阴影、内边距、可选标题栏)
export { default as UCard } from './UCard/index.vue';
export type { UCardProps } from './UCard/index.vue';

// 倒计时
export { default as UCountdown } from './UCountdown/index.vue';
export type { UCountdownProps, CountdownTimeData } from './UCountdown/index.vue';

// 左滑操作
export { default as USwipeAction } from './USwipeAction/index.vue';
export type { USwipeActionProps, SwipeActionOption, SwipeActionType } from './USwipeAction/index.vue';

// 页面状态容器 (加载中、出错重试、空状态)
export { default as UPageState } from './UPageState/index.vue';
export type { UPageStateProps, PageStateType } from './UPageState/index.vue';

// 页面内对话框 (配合 useDialog 调用)
export { default as UDialog } from './UDialog/index.vue';
export type { UDialogProps } from './UDialog/index.vue';

// 分页列表状态容器 (首次加载、空状态、失败重试、加载更多)
export { default as UList } from './UList/index.vue';
export type { UListProps } from './UList/index.vue';

// 按钮 (类型、尺寸、加载与禁用状态、小程序 open-type)
export { default as UButton } from './UButton/index.vue';
export type { UButtonProps, ButtonType, ButtonSize } from './UButton/index.vue';

// 固定位置按钮
export { default as UFixedButton } from './UFixedButton/index.vue';

// 图片组件 (封装懒加载、错误处理、重试)
export { default as UImage } from './UImage/index.vue';
export type { Props as UImageProps, ImageMode } from './UImage/index.vue';

// 加载动画组件 (支持命令式 API: showLoading/hideLoading)
export { default as ULoading } from './ULoading/index.vue';
export type { ULoadingProps, LoadingType, SpinnerType } from './ULoading/index.vue';

// 通知公告栏 (基于 uni-notice-bar 封装)
export { default as UNoticeBar } from './UNoticeBar/index.vue';
export type { NoticeBarType } from './UNoticeBar/index.vue';

// 弹出层组件 (基于 uni-popup 封装)
export { default as UPopup } from './UPopup/index.vue';
export type { PopupType, DialogType, DialogMode } from './UPopup/index.vue';

// 富文本渲染组件
export { default as URichText } from './URichText/index.vue';

// 骨架屏组件
export { default as USkeleton } from './USkeleton/index.vue';
export type { SkeletonType, AvatarShape } from './USkeleton/index.vue';

// 标签页组件 (支持 line/card 两种类型)
export { default as UTabs } from './UTabs/index.vue';
export type { TabItem, TabValue, TabType } from './UTabs/index.vue';

// 加载更多组件 (列表底部加载状态)
export { default as ULoadMore } from './ULoadMore/index.vue';
export type { LoadMoreStatus } from './ULoadMore/index.vue';

// 标签组件 (标记、分类、状态展示)
export { default as UTag } from './UTag/index.vue';
export type { TagType, TagSize } from './UTag/index.vue';

// 金额展示 (整数小数分开字号、划线原价)
export { default as UPrice } from './UPrice/index.vue';
export type { UPriceProps, PriceUnit, PriceType, PriceSize } from './UPrice/index.vue';

// 分割线 (支持文字、虚线)
export { default as UDivider } from './UDivider/index.vue';
export type { UDividerProps, DividerAlign } from './UDivider/index.vue';

// 吸顶容器 (支持自定义导航栏偏移)
export { default as USticky } from './USticky/index.vue';
export type { UStickyProps } from './USticky/index.vue';

// 回到顶部
export { default as UBackTop } from './UBackTop/index.vue';
export type { UBackTopProps } from './UBackTop/index.vue';

// ==================== 表单组件 ====================
// 表单容器 (规则校验)
export { default as UForm } from './UForm/index.vue';
export type { UFormProps, FormRule, FormRules, FormRuleTrigger } from './UForm/index.vue';
export type { UFormExpose } from './UForm/context';

// 输入框 (跟随主题、字数统计)
export { default as UInput } from './UInput/index.vue';
export type { UInputProps, InputType } from './UInput/index.vue';

// 多行输入框
export { default as UTextarea } from './UTextarea/index.vue';
export type { UTextareaProps } from './UTextarea/index.vue';

// 表单项包装组件
export { default as UFormItem } from './UFormItem/index.vue';
export type { FormItemRule } from './UFormItem/index.vue';

// 密码强度指示器
export { default as UPasswordStrength } from './UPasswordStrength/index.vue';

// 短信验证码输入组件 (内置倒计时)
export { default as USmsInput } from './USmsInput/index.vue';

// 省市区选择 (基于 uni-data-picker 封装，v-model 绑定编码)
export { default as URegionPicker } from './URegionPicker/index.vue';
export type { URegionPickerProps, RegionValue, RegionChangeDetail } from './URegionPicker/index.vue';

// 多选框组 (v-model 数组，支持 max)
export { default as UCheckboxGroup } from './UCheckboxGroup/index.vue';
export type { UCheckboxGroupProps, CheckboxOption, CheckboxValue } from './UCheckboxGroup/index.vue';

// 单选框组
export { default as URadioGroup } from './URadioGroup/index.vue';
export type { URadioGroupProps, RadioOption, RadioValue } from './URadioGroup/index.vue';

// 日期 / 时间 / 日期时间 / 日期范围选择
export { default as UDatePicker } from './UDatePicker/index.vue';
export type { UDatePickerProps, DatePickerType, DatePickerValue } from './UDatePicker/index.vue';

// 步进器
export { default as UStepper } from './UStepper/index.vue';
export type { UStepperProps, StepperAction } from './UStepper/index.vue';

// 图片上传组件 (基于 uni-file-picker 封装)
export { default as UImageUpload } from './UImageUpload/index.vue';
export type { FileItem, FileUploadStatus, UploadMode, MediaType, SelectResult } from './UImageUpload/index.vue';

// 协议勾选组件 (用户协议 + 隐私政策)
export { default as UAgreementCheck } from './UAgreementCheck/index.vue';

// 微信隐私授权弹窗 (仅微信小程序渲染)
export { default as UPrivacyPopup } from './UPrivacyPopup/index.vue';

// 搜索栏组件 (支持搜索历史、热门搜索)
export { default as USearchBar } from './USearchBar/index.vue';

// ==================== 菜单组件 ====================
// 菜单组容器
export { default as UMenuGroup } from './UMenuGroup/index.vue';

// 菜单项
export { default as UMenuItem } from './UMenuItem/index.vue';
