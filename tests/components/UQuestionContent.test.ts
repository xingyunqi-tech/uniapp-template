import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import UQuestionContent from '@/components/UQuestionContent/index.vue';
import { QuestionType } from '@/api';
import type { QuestionView } from '@/utils/question-content';

const MpHtml = defineComponent({
  name: 'MpHtml',
  props: {
    content: { type: String, default: '' },
    markdown: Boolean,
    copyLink: { type: Boolean, default: true },
    tagStyle: { type: Object, default: () => ({}) },
  },
  setup: props => () => h('div', { class: 'mp-html' }, props.content),
});

function question(overrides: Partial<QuestionView> = {}): QuestionView {
  return {
    id: 'q1',
    type: QuestionType.SINGLE,
    stem: '题干 $a_1$',
    options: [
      { key: 'A', content: '甲' },
      { key: 'B', content: '乙' },
    ],
    material: null,
    audioUrl: null,
    blankCount: null,
    children: [],
    ...overrides,
  };
}

function mountContent(props: Record<string, unknown>, slots: Record<string, (scope: any) => string> = {}) {
  return mount(UQuestionContent, { props, slots, global: { components: { MpHtml } } });
}

function createAudioContext() {
  const handlers: Record<string, () => void> = {};
  const on = (name: string) => (callback: () => void) => {
    handlers[name] = callback;
  };
  return {
    handlers,
    context: {
      src: '',
      currentTime: 0,
      duration: 0,
      play: vi.fn(() => handlers.play?.()),
      pause: vi.fn(() => handlers.pause?.()),
      destroy: vi.fn(),
      onPlay: on('play'),
      onPause: on('pause'),
      onStop: on('stop'),
      onEnded: on('ended'),
      onTimeUpdate: on('timeUpdate'),
      onError: on('error'),
    },
  };
}

afterEach(() => {
  Reflect.deleteProperty(uni, 'createInnerAudioContext');
});

describe('UQuestionContent', () => {
  it('题干与选项以 Markdown 交给 mp-html，公式中的标点转为实体', () => {
    const wrapper = mountContent({ question: question() });
    const blocks = wrapper.findAll('.mp-html').map(item => item.text());

    expect(blocks).toEqual(['题干 $a&#95;1$', '甲', '乙']);
    expect(wrapper.findAll('.u-question-content__option-key').map(item => item.text())).toEqual(['A', 'B']);
  });

  it('关闭链接复制，表格等标签使用主题变量样式', () => {
    const wrapper = mountContent({ content: '| a |\n| --- |\n| 1 |' });
    const mpHtml = wrapper.findComponent(MpHtml);

    expect(mpHtml.props('copyLink')).toBe(false);
    expect(mpHtml.props('tagStyle')).toMatchObject({ td: expect.stringContaining('var(--color-border)') });
  });

  it('按 fileUrls 替换图片引用', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
    const wrapper = mountContent({ content: `![](file:${id})`, fileUrls: { [id]: 'https://cdn/a.png' } });

    expect(wrapper.find('.mp-html').text()).toBe('![](https://cdn/a.png)');
  });

  it('材料题先显示材料，再按序号显示小题', () => {
    const wrapper = mountContent({
      question: question({
        type: QuestionType.MATERIAL,
        options: [],
        material: '材料内容',
        children: [question({ id: 'c1', stem: '小题一' }), question({ id: 'c2', stem: '小题二' })],
      }),
      startIndex: 3,
    });

    expect(wrapper.find('.u-question-content__material').text()).toBe('材料内容');
    expect(wrapper.findAll('.u-question-content__index').map(item => item.text())).toEqual(['3.', '4.']);
  });

  it('判断题没有选项时显示正确与错误，不显示选项字母', () => {
    const wrapper = mountContent({ question: question({ type: QuestionType.JUDGE, options: [] }) });

    expect(wrapper.findAll('.u-question-content__option').map(item => item.text())).toEqual(['正确', '错误']);
    expect(wrapper.find('.u-question-content__option-key').exists()).toBe(false);
  });

  it('可选择时点击选项触发 option-click，并高亮已选项', async () => {
    const item = question();
    const wrapper = mountContent({ question: item, selectable: true, selectedKeys: { q1: ['B'] } });
    const options = wrapper.findAll('.u-question-content__option');

    await options[0].trigger('click');

    expect(wrapper.emitted('option-click')?.[0]).toEqual([item, { key: 'A', content: '甲' }]);
    expect(options[1].classes()).toContain('u-question-content__option--selected');
  });

  it('不可选择时点击选项不触发事件', async () => {
    const wrapper = mountContent({ question: question() });

    await wrapper.find('.u-question-content__option').trigger('click');

    expect(wrapper.emitted('option-click')).toBeUndefined();
  });

  it('extra 插槽收到每道可作答题与序号', () => {
    const wrapper = mountContent(
      { question: question(), startIndex: 2 },
      { extra: ({ question: item, index }: { question: QuestionView; index: number }) => `${item.id}-${index}` },
    );

    expect(wrapper.text()).toContain('q1-2');
  });

  it('有音频地址时播放与暂停，卸载时销毁音频', async () => {
    const { context, handlers } = createAudioContext();
    Object.assign(uni, { createInnerAudioContext: vi.fn(() => context) });
    const wrapper = mountContent({ question: question({ audioUrl: 'https://cdn/a.mp3' }) });
    const button = wrapper.find('.u-question-content__audio-button');

    await button.trigger('click');
    expect(context.src).toBe('https://cdn/a.mp3');
    expect(context.play).toHaveBeenCalled();
    expect(wrapper.find('.u-question-content__pause').exists()).toBe(true);

    context.currentTime = 65;
    context.duration = 130;
    handlers.timeUpdate();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.u-question-content__audio-time').text()).toBe('01:05 / 02:10');

    await button.trigger('click');
    expect(context.pause).toHaveBeenCalled();

    wrapper.unmount();
    expect(context.destroy).toHaveBeenCalled();
  });

  it('pause 暂停正在播放的音频', async () => {
    const { context } = createAudioContext();
    Object.assign(uni, { createInnerAudioContext: vi.fn(() => context) });
    const wrapper = mountContent({ question: question({ audioUrl: 'https://cdn/a.mp3' }) });

    (wrapper.vm as unknown as { pause: () => void }).pause();
    expect(context.pause).not.toHaveBeenCalled();

    await wrapper.find('.u-question-content__audio-button').trigger('click');
    (wrapper.vm as unknown as { pause: () => void }).pause();
    expect(context.pause).toHaveBeenCalledTimes(1);
  });

  it('没有音频地址时不显示播放器', () => {
    const wrapper = mountContent({ question: question() });

    expect(wrapper.find('.u-question-content__audio').exists()).toBe(false);
  });
});
