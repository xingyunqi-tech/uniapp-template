import type { FormModel, FormRuleTrigger } from '@/utils/form-rules';

export type FormLabelAlign = 'left' | 'center' | 'right';
export type FormLabelPosition = 'left' | 'top';

export interface UFormContext {
  getValue: (prop: string) => unknown;
  labelWidth: () => number | string | undefined;
  labelAlign: () => FormLabelAlign | undefined;
  labelPosition: () => FormLabelPosition;
  showMessage: () => boolean;
  getError: (prop: string) => string;
  isRequired: (prop: string) => boolean;
  triggerValidate: (prop: string, trigger: FormRuleTrigger) => void;
}

export interface UFormItemContext {
  onBlur: () => void;
}

export const U_FORM_KEY = 'uForm';
export const U_FORM_ITEM_KEY = 'uFormItem';

export interface UFormExpose {
  validate: (prop?: string | string[]) => Promise<boolean>;
  validateField: (prop: string | string[]) => Promise<boolean>;
  resetFields: () => void;
  setInitialValues: (values?: FormModel) => void;
  clearValidate: (prop?: string | string[]) => void;
  errors: Record<string, string>;
}
