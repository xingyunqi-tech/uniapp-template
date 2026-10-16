import { describe, expect, it } from 'vitest';
import { useForm } from '@/composables/useForm';

describe('useForm', () => {
  it('validateTrigger 为 blur 时 handleBlur 校验该字段', () => {
    const form = useForm({
      initialValues: { phone: '' },
      rules: { phone: { required: true, message: '请输入手机号' } },
      validateTrigger: 'blur',
    });

    form.handleBlur('phone');
    expect(form.errors.phone.value).toBe('请输入手机号');

    form.formData.phone = '13800000000';
    form.handleBlur('phone');
    expect(form.errors.phone.value).toBe('');
  });

  it('validateTrigger 不是 blur 时 handleBlur 不校验', () => {
    const form = useForm({
      initialValues: { phone: '' },
      rules: { phone: { required: true, message: '请输入手机号' } },
    });

    form.handleBlur('phone');
    expect(form.errors.phone.value).toBe('');
  });

  it('表单数据与初始值的数组和对象互不共享', () => {
    const initialValues = { tags: ['a'], address: { city: 'x' } };
    const form = useForm({ initialValues });

    form.formData.tags.push('b');
    form.formData.address.city = 'y';
    expect(initialValues).toEqual({ tags: ['a'], address: { city: 'x' } });

    form.reset();
    expect(form.formData.tags).toEqual(['a']);
    expect(form.formData.address.city).toBe('x');

    form.formData.tags.push('c');
    form.reset();
    expect(form.formData.tags).toEqual(['a']);
    expect(form.isDirty.value).toBe(false);
  });

  it('setFieldError 对未声明字段按需创建错误并影响 isValid', () => {
    const form = useForm<{ name: string; [key: string]: unknown }>({ initialValues: { name: '' } });

    expect(() => form.setFieldError('extra', '服务端错误')).not.toThrow();
    expect(form.errors.extra.value).toBe('服务端错误');
    expect(form.isValid.value).toBe(false);

    form.clearFieldError('extra');
    expect(form.isValid.value).toBe(true);
  });

  it('clearFieldError 对未知字段不抛错', () => {
    const form = useForm<{ name: string; [key: string]: unknown }>({ initialValues: { name: '' } });

    expect(() => form.clearFieldError('unknown')).not.toThrow();
  });
});
