import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.hoisted(() => vi.fn());
const compress = vi.hoisted(() => vi.fn());

vi.mock('@/api/core/alova', async importOriginal => {
  const actual = await importOriginal<typeof import('@/api/core/alova')>();
  return { ...actual, http: { ...actual.http, Post: post } };
});

vi.mock('@/utils/image', () => ({ compressImage: compress }));

const { uploadFileByPath, uploadFilesByPath } = await import('@/api/custom/override');

beforeEach(() => {
  post.mockReset().mockResolvedValue({ data: { file: { id: 1, path: '/f/1.jpg' } } });
  compress.mockReset().mockImplementation(async (path: string) => `${path}.min`);
});

describe('uploadFileByPath 图片压缩', () => {
  it('默认压缩后上传压缩结果', async () => {
    await expect(uploadFileByPath('tmp/a.jpg')).resolves.toEqual({ id: 1, path: '/f/1.jpg' });

    expect(compress).toHaveBeenCalledWith('tmp/a.jpg', undefined);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/files/upload',
      { name: 'file', filePath: 'tmp/a.jpg.min' },
      expect.objectContaining({ requestType: 'upload' }),
    );
  });

  it('传入压缩配置时透传', async () => {
    await uploadFileByPath('tmp/a.jpg', { compress: { maxSide: 1080 } });

    expect(compress).toHaveBeenCalledWith('tmp/a.jpg', { maxSide: 1080 });
  });

  it('compress 为 false 时上传原文件', async () => {
    await uploadFileByPath('tmp/a.jpg', { compress: false });

    expect(compress).not.toHaveBeenCalled();
    expect(post.mock.calls[0][1]).toEqual({ name: 'file', filePath: 'tmp/a.jpg' });
  });

  it('批量上传沿用同一配置', async () => {
    await uploadFilesByPath(['tmp/a.jpg', 'tmp/b.jpg'], { compress: false });

    expect(compress).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('批量上传最多 3 个并发，每个文件先压缩再上传，结果顺序与输入一致', async () => {
    const paths = ['tmp/a.jpg', 'tmp/b.jpg', 'tmp/c.jpg', 'tmp/d.jpg', 'tmp/e.jpg'];
    const events: string[] = [];
    const pending = new Map<string, () => void>();
    let active = 0;
    let maxActive = 0;
    compress.mockImplementation(async (path: string) => {
      active++;
      maxActive = Math.max(maxActive, active);
      events.push(`compress:${path}`);
      return path;
    });
    post.mockImplementation((_url: string, { filePath }: { filePath: string }) => {
      events.push(`upload:${filePath}`);
      return new Promise(resolve => {
        pending.set(filePath, () => {
          active--;
          resolve({ data: { file: { id: filePath, path: filePath } } });
        });
      });
    });
    const flush = () => new Promise(resolve => setTimeout(resolve));

    const task = uploadFilesByPath(paths);
    await flush();
    expect([...pending.keys()]).toEqual(['tmp/a.jpg', 'tmp/b.jpg', 'tmp/c.jpg']);

    pending.get('tmp/c.jpg')!();
    await flush();
    pending.get('tmp/a.jpg')!();
    await flush();
    pending.get('tmp/b.jpg')!();
    pending.get('tmp/d.jpg')!();
    await flush();
    pending.get('tmp/e.jpg')!();
    const files = await task;

    expect(maxActive).toBe(3);
    paths.forEach(path => {
      expect(events.indexOf(`compress:${path}`)).toBeLessThan(events.indexOf(`upload:${path}`));
    });
    expect(files.map(file => file.path)).toEqual(paths);
  });

  it('批量上传某个失败时整体 reject，不再开始新文件，已开始的文件继续完成', async () => {
    const paths = ['tmp/a.jpg', 'tmp/b.jpg', 'tmp/c.jpg', 'tmp/d.jpg'];
    const finished: string[] = [];
    post.mockImplementation(async (_url: string, { filePath }: { filePath: string }) => {
      if (filePath === 'tmp/a.jpg.min') throw new Error('上传失败');
      await new Promise(resolve => setTimeout(resolve));
      finished.push(filePath);
      return { data: { file: { id: filePath, path: filePath } } };
    });

    await expect(uploadFilesByPath(paths)).rejects.toThrow('上传失败');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(compress).toHaveBeenCalledTimes(3);
    expect(finished).toEqual(['tmp/b.jpg.min', 'tmp/c.jpg.min']);
  });

  it('批量上传空数组返回空数组', async () => {
    await expect(uploadFilesByPath([])).resolves.toEqual([]);
    expect(post).not.toHaveBeenCalled();
  });
});
