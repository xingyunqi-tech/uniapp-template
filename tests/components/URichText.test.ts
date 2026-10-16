import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import URichText from '@/components/URichText/index.vue';

const RichTextStub = defineComponent({
  name: 'RichText',
  props: {
    nodes: { type: [String, Array], default: '' },
    selectable: { type: Boolean, default: false },
    space: { type: String, default: '' },
  },
  emits: ['itemclick'],
  setup() {
    return () => h('div', { class: 'rich-text' });
  },
});

const global = { stubs: { 'rich-text': RichTextStub } };

function nodesOf(content: string) {
  const wrapper = mount(URichText, { props: { content }, global });
  return wrapper.findComponent(RichTextStub).props('nodes') as string;
}

const previewImage = vi.fn();

beforeEach(() => {
  previewImage.mockReset();
  (uni as unknown as { previewImage: typeof previewImage }).previewImage = previewImage;
});

describe('URichText', () => {
  it('为标签补充对应 class，已有 class 时追加', () => {
    expect(nodesOf('<h1>标题</h1><p class="lead">段落</p>')).toBe(
      '<h1 class="u-rt-h1">标题</h1><p class="lead u-rt-p">段落</p>',
    );
  });

  it('图片限制最大宽度并补充 class', () => {
    expect(nodesOf('<img src="a.png" />')).toBe(
      '<img class="u-rt-img" style="max-width:100%;height:auto;" src="a.png" />',
    );
  });

  it('已有 style 的图片保留原样式', () => {
    expect(nodesOf('<img style="width:10px" src="a.png">')).toBe(
      '<img class="u-rt-img" style="width:10px" src="a.png">',
    );
  });

  it('视频替换为提示文字，iframe 被移除', () => {
    const nodes = nodesOf('<video src="a.mp4"></video><iframe src="b.html"></iframe>');

    expect(nodes).toContain('[视频内容请在APP中查看]');
    expect(nodes).not.toContain('<video');
    expect(nodes).not.toContain('<iframe');
  });

  it('跨行与自闭合的视频、iframe 同样被处理', () => {
    const nodes = nodesOf(
      '<video controls>\n<source src="a.mp4">\n</video><video src="b.mp4" /><iframe\nsrc="c.html">\n</iframe><iframe src="d.html" />',
    );

    expect(nodes.match(/\[视频内容请在APP中查看\]/g)).toHaveLength(2);
    expect(nodes).not.toContain('<video');
    expect(nodes).not.toContain('<iframe');
  });

  it('无引号且以 / 结尾的属性值不视为自闭合标签', () => {
    const nodes = nodesOf('<video src=http://a.com/>内容</video><iframe src=http://b.com/>内容</iframe><p>正文</p>');

    expect(nodes).toBe(
      '<p class="u-rt-p" style="color:var(--color-text-secondary);text-align:center;">[视频内容请在APP中查看]</p><p class="u-rt-p">正文</p>',
    );
  });

  it('data-class 属性不视为已有 class', () => {
    expect(nodesOf('<p data-class="x">文字</p>')).toBe('<p class="u-rt-p" data-class="x">文字</p>');
  });

  it('不误匹配前缀相同的标签', () => {
    expect(nodesOf('<br><abbr>x</abbr>')).toBe('<br><abbr>x</abbr>');
  });

  it('数组内容原样传递，空内容传空字符串', () => {
    const nodes = [{ name: 'div', children: [{ type: 'text' as const, text: 'hi' }] }];
    const wrapper = mount(URichText, { props: { content: nodes }, global });

    expect(wrapper.findComponent(RichTextStub).props('nodes')).toEqual(nodes);
    expect(nodesOf('')).toBe('');
  });

  it('透传 selectable 与 space，可选中时添加修饰类', () => {
    const wrapper = mount(URichText, { props: { content: 'x', space: 'emsp' }, global });
    const richText = wrapper.findComponent(RichTextStub);

    expect(richText.props('selectable')).toBe(true);
    expect(richText.props('space')).toBe('emsp');
    expect(wrapper.classes()).toContain('u-rich-text--selectable');
  });

  it('点击节点时触发 itemclick 并传出 detail', () => {
    const wrapper = mount(URichText, { props: { content: 'x' }, global });
    const detail = { node: { name: 'img', attrs: { src: 'a.png' } } };

    wrapper.findComponent(RichTextStub).vm.$emit('itemclick', { detail });

    expect(wrapper.emitted('itemclick')).toEqual([[detail]]);
  });

  it('开启 previewImage 时点击图片预览内容中的全部图片', () => {
    const wrapper = mount(URichText, {
      props: { content: '<img src="a.png"><p>x</p><img class="c" src="b.png" />', previewImage: true },
      global,
    });

    wrapper
      .findComponent(RichTextStub)
      .vm.$emit('itemclick', { detail: { node: { name: 'img', attrs: { src: 'b.png' } } } });

    expect(previewImage).toHaveBeenCalledWith({ urls: ['a.png', 'b.png'], current: 'b.png' });
  });

  it('图片地址中的 HTML 实体解码后预览，注释中的图片不计入', () => {
    const wrapper = mount(URichText, {
      props: {
        content: '<!-- <img src="old.png"> --><img src="https://cdn/x.jpg?a=1&amp;b=2"><img src="y&#46;png">',
        previewImage: true,
      },
      global,
    });

    wrapper
      .findComponent(RichTextStub)
      .vm.$emit('itemclick', { detail: { node: { name: 'img', attrs: { src: 'https://cdn/x.jpg?a=1&b=2' } } } });

    expect(previewImage).toHaveBeenCalledWith({
      urls: ['https://cdn/x.jpg?a=1&b=2', 'y.png'],
      current: 'https://cdn/x.jpg?a=1&b=2',
    });
  });

  it('未开启 previewImage 时点击图片不预览', () => {
    const wrapper = mount(URichText, { props: { content: '<img src="a.png">' }, global });

    wrapper
      .findComponent(RichTextStub)
      .vm.$emit('itemclick', { detail: { node: { name: 'img', attrs: { src: 'a.png' } } } });

    expect(previewImage).not.toHaveBeenCalled();
  });

  it('previewImages 从节点数组中收集图片，未指定或无效的 current 时从首张开始', () => {
    const content = [
      {
        name: 'div',
        children: [
          { name: 'img', attrs: { src: 'x.png' } },
          { type: 'text' as const, text: 't' },
        ],
      },
      { name: 'img', attrs: { src: 'y.png' } },
    ];
    const wrapper = mount(URichText, { props: { content }, global });
    const vm = wrapper.vm as unknown as { previewImages: (current?: string) => void };

    vm.previewImages();
    vm.previewImages('y.png');
    vm.previewImages('z.png');

    expect(previewImage.mock.calls).toEqual([
      [{ urls: ['x.png', 'y.png'], current: 'x.png' }],
      [{ urls: ['x.png', 'y.png'], current: 'y.png' }],
      [{ urls: ['x.png', 'y.png'], current: 'x.png' }],
    ]);
  });

  it('内容中没有图片时 previewImages 不调用预览', () => {
    const wrapper = mount(URichText, { props: { content: '<p>无图</p>' }, global });

    (wrapper.vm as unknown as { previewImages: () => void }).previewImages();

    expect(previewImage).not.toHaveBeenCalled();
  });

  it('开启 virtualHost，父组件 class 合并到根节点', () => {
    const wrapper = mount(URichText, { props: { content: 'x' }, attrs: { class: 'article' }, global });

    expect((URichText as { options?: Record<string, unknown> }).options).toMatchObject({ virtualHost: true });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['u-rich-text', 'article']));
  });
});
