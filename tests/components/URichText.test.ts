import { describe, expect, it } from 'vitest';
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
});
