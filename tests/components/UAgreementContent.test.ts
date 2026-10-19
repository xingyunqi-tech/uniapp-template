import { beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import UAgreementContent from '@/components/UAgreementContent/index.vue';
import type { MpHtmlNode } from '@/uni_modules/mp-html/components/mp-html/parser.js';

const MpHtml = defineComponent({
  name: 'MpHtml',
  props: {
    content: { type: String, default: '' },
    copyLink: { type: Boolean, default: false },
    scrollTable: { type: Boolean, default: false },
    tagStyle: { type: Object, default: () => ({}) },
    containerStyle: { type: String, default: '' },
  },
  setup: props => () => h('div', { class: 'mp-html' }, props.content),
});

const USkeletonStub = defineComponent({
  setup: () => () => h('div', { class: 'skeleton' }),
});

function mountContent(props: Record<string, unknown>) {
  return mount(UAgreementContent, {
    props,
    global: { stubs: { 'mp-html': MpHtml, USkeleton: USkeletonStub } },
  });
}

describe('UAgreementContent', () => {
  it('加载中显示骨架屏', () => {
    const wrapper = mountContent({ content: '<p>正文</p>', loading: true });

    expect(wrapper.find('.skeleton').exists()).toBe(true);
    expect(wrapper.findComponent(MpHtml).exists()).toBe(false);
  });

  it('加载失败时显示重试，点击触发 retry', async () => {
    const wrapper = mountContent({ error: true });

    expect(wrapper.text()).toContain('加载失败，点击重试');
    await wrapper.find('.u-agreement-content__error').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('正文交给 mp-html 渲染，外链可复制、表格可横向滚动', () => {
    const content = '<p><a href="https://example.com">链接</a></p><table><tr><td>1</td></tr></table>';
    const mpHtml = mountContent({ content }).findComponent(MpHtml);

    expect(mpHtml.props('content')).toBe(content);
    expect(mpHtml.props('copyLink')).toBe(true);
    expect(mpHtml.props('scrollTable')).toBe(true);
  });

  it('文字、链接与表格边框使用主题变量', () => {
    const mpHtml = mountContent({ content: '<p>正文</p>' }).findComponent(MpHtml);
    const tagStyle = mpHtml.props('tagStyle') as Record<string, string>;

    expect(mpHtml.props('containerStyle')).toContain('color: var(--color-text)');
    expect(tagStyle.a).toContain('var(--color-text-link)');
    expect(tagStyle.td).toContain('var(--color-border)');
  });

  it('移除 iframe、embed 与 object', () => {
    const mpHtml = mountContent({
      content: '<p>前</p><iframe src="https://x"></iframe><embed src="a.swf"><object data="b"></object><p>后</p>',
    }).findComponent(MpHtml);

    expect(mpHtml.props('content')).toBe('<p>前</p><p>后</p>');
  });
});

describe('mp-html 解析协议正文', () => {
  let parse: (content: string) => MpHtmlNode[];

  beforeAll(async () => {
    Object.assign(uni, {
      canIUse: () => true,
      getWindowInfo: () => ({ windowWidth: 375 }),
      getDeviceInfo: () => ({ system: 'iOS 17' }),
    });
    const { default: Parser } = await import('@/uni_modules/mp-html/components/mp-html/parser.js');
    parse = content => {
      const vm: Record<string, unknown> = { scrollTable: true, containerStyle: '', imgList: [], nodes: [] };
      return new Parser(vm).parse(content);
    };
  });

  function find(nodes: MpHtmlNode[], name: string): MpHtmlNode | undefined {
    for (const node of nodes) {
      if (node.name === name) return node;
      const child = node.children && find(node.children, name);
      if (child) return child;
    }
    return undefined;
  }

  it('表格包裹在可横向滚动的容器中', () => {
    const nodes = parse('<table><tr><th>项目</th><td>说明</td></tr></table>');

    expect(nodes[0].name).toBe('div');
    expect(nodes[0].attrs?.style).toContain('overflow:auto');
    expect(find(nodes[0].children ?? [], 'table')).toBeDefined();
  });

  it('保留链接地址', () => {
    const link = find(parse('<p><a href="https://example.com/terms">条款</a></p>'), 'a');

    expect(link?.attrs?.href).toBe('https://example.com/terms');
  });

  it('丢弃 script 标签', () => {
    const nodes = parse('<p>正文</p><script>alert(1)</script>');

    expect(find(nodes, 'script')).toBeUndefined();
    expect(JSON.stringify(nodes)).not.toContain('alert');
  });
});
