import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compressImage, getTargetSize, toAlipayQuality } from '@/utils/image';

type Callbacks<T> = { success: (res: T) => void; fail: (err: unknown) => void };

const fileSizes: Record<string, number> = {};

function mockImage(info: { width: number; height: number; type?: string }, size?: number) {
  if (size !== undefined) fileSizes['tmp/a.jpg'] = size;
  vi.mocked(uni).getImageInfo = vi.fn(({ success }: Callbacks<unknown>) =>
    success({ path: 'tmp/a.jpg', type: 'jpeg', ...info }),
  ) as never;
}

beforeEach(() => {
  for (const key of Object.keys(fileSizes)) delete fileSizes[key];
  fileSizes['tmp/c.jpg'] = 300 * 1024;
  vi.mocked(uni).getFileInfo = vi.fn(({ filePath, success, fail }: Callbacks<unknown> & { filePath: string }) =>
    filePath in fileSizes ? success({ size: fileSizes[filePath] }) : fail({ errMsg: 'getFileInfo:fail' }),
  ) as never;
  vi.mocked(uni).compressImage = vi.fn(({ success }: Callbacks<unknown>) =>
    success({ tempFilePath: 'tmp/c.jpg' }),
  ) as never;
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getTargetSize', () => {
  it('按最长边等比缩放', () => {
    expect(getTargetSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(getTargetSize(1000, 3000, 1600)).toEqual({ width: 533, height: 1600 });
  });

  it('未超出最长边时保持原尺寸', () => {
    expect(getTargetSize(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});

describe('toAlipayQuality', () => {
  it.each([
    [80, 52],
    [50, 26],
    [10, 1],
  ])('quality %i 映射为 %i', (quality, expected) => {
    expect(toAlipayQuality(quality)).toBe(expected);
    expect(Math.floor(toAlipayQuality(quality) / 26)).toBeLessThan(3);
  });
});

describe('compressImage', () => {
  it('大图按最长边与默认质量压缩', async () => {
    mockImage({ width: 4000, height: 3000 }, 3 * 1024 * 1024);

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/c.jpg');
    expect(uni.compressImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: 'tmp/a.jpg', quality: 80, compressedWidth: 1600 }),
    );
    expect(vi.mocked(uni.compressImage).mock.calls[0][0]).not.toHaveProperty('compressedHeight');
  });

  it('竖图限制高度，自定义参数生效', async () => {
    mockImage({ width: 1000, height: 3000 }, 3 * 1024 * 1024);

    await compressImage('tmp/a.jpg', { maxSide: 1080, quality: 60 });
    expect(uni.compressImage).toHaveBeenCalledWith(expect.objectContaining({ quality: 60, compressedHeight: 1080 }));
  });

  it('体积超过阈值但尺寸未超限时只按质量压缩', async () => {
    mockImage({ width: 1200, height: 900 }, 1024 * 1024);

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/c.jpg');
    const args = vi.mocked(uni.compressImage).mock.calls[0][0];
    expect(args).not.toHaveProperty('compressedWidth');
    expect(args).not.toHaveProperty('compressedHeight');
  });

  it('未超出最长边的小体积图片跳过压缩', async () => {
    mockImage({ width: 1200, height: 900 }, 100 * 1024);

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/a.jpg');
    expect(uni.compressImage).not.toHaveBeenCalled();
  });

  it('超出最长边的小体积图片仍按最长边缩放', async () => {
    mockImage({ width: 4000, height: 3000 }, 100 * 1024);

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/c.jpg');
    expect(uni.compressImage).toHaveBeenCalledWith(expect.objectContaining({ compressedWidth: 1600 }));
  });

  it.each(['png', 'webp'])('%s 未超出最长边时不做质量压缩', async type => {
    mockImage({ width: 1200, height: 900, type }, 3 * 1024 * 1024);

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/a.jpg');
    expect(uni.compressImage).not.toHaveBeenCalled();
  });

  it('png 超出最长边时缩放', async () => {
    mockImage({ width: 4000, height: 3000, type: 'png' }, 100 * 1024);

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/c.jpg');
    expect(uni.compressImage).toHaveBeenCalledWith(expect.objectContaining({ compressedWidth: 1600 }));
  });

  it('无法获取体积时按尺寸判断', async () => {
    mockImage({ width: 1200, height: 900 });
    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/a.jpg');

    mockImage({ width: 4000, height: 3000 });
    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/c.jpg');
  });

  it('GIF 不压缩', async () => {
    await expect(compressImage('tmp/b.gif')).resolves.toBe('tmp/b.gif');

    mockImage({ width: 4000, height: 3000, type: 'gif' }, 3 * 1024 * 1024);
    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/a.jpg');
    expect(uni.compressImage).not.toHaveBeenCalled();
  });

  it('非图片文件不压缩', async () => {
    vi.mocked(uni).getImageInfo = vi.fn() as never;

    await expect(compressImage('tmp/doc.pdf')).resolves.toBe('tmp/doc.pdf');
    expect(uni.getImageInfo).not.toHaveBeenCalled();
  });

  it('压缩失败返回原图', async () => {
    mockImage({ width: 4000, height: 3000 }, 3 * 1024 * 1024);
    vi.mocked(uni).compressImage = vi.fn(({ fail }: Callbacks<unknown>) =>
      fail({ errMsg: 'compressImage:fail' }),
    ) as never;

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/a.jpg');
  });

  it('读取图片信息失败返回原图', async () => {
    vi.mocked(uni).getImageInfo = vi.fn(({ fail }: Callbacks<unknown>) => fail({ errMsg: 'fail' })) as never;

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/a.jpg');
  });

  it('仅质量压缩且体积未变小时返回原图', async () => {
    mockImage({ width: 1200, height: 900 }, 250 * 1024);

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/a.jpg');
    expect(uni.compressImage).toHaveBeenCalled();
  });

  it('缩放后体积变大时仍采用缩放结果', async () => {
    mockImage({ width: 4000, height: 3000 }, 250 * 1024);

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/c.jpg');
  });

  it('无法获取压缩结果体积时采用压缩结果', async () => {
    mockImage({ width: 1200, height: 900 }, 1024 * 1024);
    delete fileSizes['tmp/c.jpg'];

    await expect(compressImage('tmp/a.jpg')).resolves.toBe('tmp/c.jpg');
  });
});
