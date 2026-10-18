import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { AiMessageFeedback, AiMessageStatus } from '@/api';
import UAiMessage, { type AiMessageView } from '@/components/UAiMessage/index.vue';

const UQuestionContentStub = defineComponent({
  props: { content: { type: String, default: '' } },
  setup(props) {
    return () => h('div', { class: 'content' }, props.content);
  },
});

function view(patch: Partial<AiMessageView> = {}): AiMessageView {
  return {
    id: 'm1',
    content: '选 **A**',
    reasoning: '',
    suggestions: [],
    status: AiMessageStatus.DONE,
    feedback: null,
    ...patch,
  };
}

function mountMessage(message: AiMessageView, showSuggestions = false) {
  return mount(UAiMessage, {
    props: { message, showSuggestions },
    global: { stubs: { UQuestionContent: UQuestionContentStub } },
  });
}

describe('UAiMessage', () => {
  it('渲染正文与 AI 生成标识', () => {
    const wrapper = mountMessage(view());

    expect(wrapper.find('.content').text()).toBe('选 **A**');
    expect(wrapper.text()).toContain('内容由 AI 生成');
    expect(wrapper.find('.u-ai-message__actions').exists()).toBe(true);
  });

  it('生成中无内容时显示输入状态，不显示反馈操作', () => {
    const wrapper = mountMessage(view({ content: '', status: AiMessageStatus.STREAMING }));

    expect(wrapper.find('.u-ai-message__typing').exists()).toBe(true);
    expect(wrapper.find('.u-ai-message__actions').exists()).toBe(false);
  });

  it('思考内容默认折叠，点击展开', async () => {
    const wrapper = mountMessage(view({ content: '', reasoning: '先分析', status: AiMessageStatus.STREAMING }));

    expect(wrapper.text()).toContain('深度思考中');
    expect(wrapper.find('.u-ai-message__reasoning-body').exists()).toBe(false);
    await wrapper.find('.u-ai-message__reasoning-header').trigger('click');
    expect(wrapper.find('.u-ai-message__reasoning-body').text()).toBe('先分析');
  });

  it('完成后思考标题为已深度思考', () => {
    expect(mountMessage(view({ reasoning: '先分析' })).text()).toContain('已深度思考');
  });

  it('按状态显示提示，自定义提示优先并可点击', async () => {
    expect(mountMessage(view({ status: AiMessageStatus.STOPPED })).text()).toContain('已停止生成');
    const failed = mountMessage(view({ status: AiMessageStatus.FAILED }));
    expect(failed.find('.u-ai-message__notice--error').text()).toContain('本次不计入额度');
    expect(failed.find('.u-ai-message__actions').exists()).toBe(false);

    const custom = mountMessage(view({ status: AiMessageStatus.STREAMING, notice: '网络连接中断' }));
    await custom.find('.u-ai-message__notice').trigger('click');
    expect(custom.emitted('notice-click')).toHaveLength(1);
  });

  it('点赞、点踩与再次点击撤销', async () => {
    const wrapper = mountMessage(view({ feedback: AiMessageFeedback.LIKE }));
    const [like, dislike, report] = wrapper.findAll('.u-ai-message__action');

    await like.trigger('click');
    await dislike.trigger('click');
    await report.trigger('click');
    expect(wrapper.emitted('feedback')).toEqual([[null], [AiMessageFeedback.DISLIKE]]);
    expect(wrapper.emitted('report')).toHaveLength(1);
  });

  it('只在允许且回答完成时显示追问建议', async () => {
    const message = view({ suggestions: ['B 为什么错？'] });
    expect(mountMessage(message).find('.u-ai-message__suggestions').exists()).toBe(false);
    expect(
      mountMessage({ ...message, status: AiMessageStatus.STOPPED }, true)
        .find('.u-ai-message__suggestions')
        .exists(),
    ).toBe(false);

    const wrapper = mountMessage(message, true);
    await wrapper.find('.u-ai-message__suggestion').trigger('click');
    expect(wrapper.emitted('suggestion')).toEqual([['B 为什么错？']]);
  });
});
