<template>
  <!-- UQuestionContent - 题目内容：Markdown + LaTeX、图片点击预览、材料与小题、听力音频 -->
  <view class="u-question-content">
    <template v-if="question">
      <view v-if="question.audioUrl" class="u-question-content__audio">
        <view class="u-question-content__audio-button" @click="toggleAudio">
          <view :class="audioPlaying ? 'u-question-content__pause' : 'u-question-content__play'" />
        </view>
        <text class="u-question-content__audio-time">
          {{ formatAudioTime(audioCurrent) }} / {{ formatAudioTime(audioDuration) }}
        </text>
      </view>

      <view v-if="question.material" class="u-question-content__material">
        <mp-html
          :content="rich(question.material)"
          markdown
          :copy-link="false"
          :tag-style="tagStyle"
          :container-style="containerStyle"
        />
      </view>

      <view v-for="(item, offset) in items" :key="item.id" class="u-question-content__item">
        <view class="u-question-content__stem">
          <text v-if="startIndex > 0" class="u-question-content__index">{{ startIndex + offset }}.</text>
          <view class="u-question-content__body">
            <mp-html
              :content="rich(item.stem)"
              markdown
              :copy-link="false"
              :tag-style="tagStyle"
              :container-style="containerStyle"
            />
          </view>
        </view>

        <view
          v-for="option in displayOptions(item)"
          :key="option.key"
          class="u-question-content__option"
          :class="{ 'u-question-content__option--selected': isSelected(item, option) }"
          @click="handleOptionClick(item, option)"
        >
          <text v-if="item.type !== QuestionType.JUDGE" class="u-question-content__option-key">{{ option.key }}</text>
          <view class="u-question-content__body">
            <mp-html
              :content="rich(option.content)"
              markdown
              :copy-link="false"
              :tag-style="tagStyle"
              :container-style="containerStyle"
            />
          </view>
        </view>

        <slot name="extra" :question="item" :index="startIndex + offset" />
      </view>
    </template>

    <mp-html
      v-else-if="content"
      :content="rich(content)"
      markdown
      :copy-link="false"
      :tag-style="tagStyle"
      :container-style="containerStyle"
    />
  </view>
</template>

<script setup lang="ts">
definePage({
  meta: {
    isComponent: true,
  },
});

import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { QuestionType } from '@/api';
import {
  answerableQuestions,
  displayOptions,
  toRichContent,
  type QuestionOption,
  type QuestionView,
} from '@/utils/question-content';

defineOptions({
  name: 'UQuestionContent',
  options: {
    virtualHost: true,
  },
});

export interface UQuestionContentProps {
  /** 独立题或材料题，不传时渲染 content */
  question?: QuestionView | null;
  /** 单段 Markdown，如解析 */
  content?: string | null;
  /** file:{id} 引用的访问地址，键为小写文件 id */
  fileUrls?: Record<string, string>;
  /** 第一道可作答题的序号，0 时不显示 */
  startIndex?: number;
  /** 已选选项，键为题目 id */
  selectedKeys?: Record<string, string[]>;
  selectable?: boolean;
}

const props = withDefaults(defineProps<UQuestionContentProps>(), {
  question: null,
  content: null,
  fileUrls: undefined,
  startIndex: 0,
  selectedKeys: () => ({}),
  selectable: false,
});

const emit = defineEmits<{
  'option-click': [question: QuestionView, option: QuestionOption];
}>();

const containerStyle = 'font-size: 30rpx; line-height: 1.7; word-break: break-word;';
const tagStyle: Record<string, string> = {
  tr: 'background-color: transparent; border-top: 1px solid var(--color-border);',
  th: 'border: 1px solid var(--color-border); background-color: var(--color-bg-grey);',
  td: 'border: 1px solid var(--color-border);',
  blockquote: 'color: var(--color-text-secondary); border-left: 4px solid var(--color-border);',
  code: 'background-color: var(--color-bg-grey); color: var(--color-text);',
  pre: 'padding: 16rpx; border-radius: 8rpx; background-color: var(--color-bg-grey); overflow-x: auto;',
  a: 'color: var(--color-text-link);',
  hr: 'border-color: var(--color-border);',
};

const items = computed(() => (props.question ? answerableQuestions(props.question) : []));

function rich(text: string | null | undefined): string {
  return toRichContent(text, props.fileUrls);
}

function isSelected(question: QuestionView, option: QuestionOption): boolean {
  return props.selectedKeys[question.id]?.includes(option.key) ?? false;
}

function handleOptionClick(question: QuestionView, option: QuestionOption) {
  if (props.selectable) emit('option-click', question, option);
}

const audioPlaying = ref(false);
const audioCurrent = ref(0);
const audioDuration = ref(0);
let audio: UniApp.InnerAudioContext | null = null;

function formatAudioTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function destroyAudio() {
  audio?.destroy();
  audio = null;
  audioPlaying.value = false;
  audioCurrent.value = 0;
  audioDuration.value = 0;
}

function createAudio(src: string): UniApp.InnerAudioContext {
  const context = uni.createInnerAudioContext();
  context.src = src;
  context.onPlay(() => (audioPlaying.value = true));
  context.onPause(() => (audioPlaying.value = false));
  context.onStop(() => (audioPlaying.value = false));
  context.onEnded(() => {
    audioPlaying.value = false;
    audioCurrent.value = 0;
  });
  context.onTimeUpdate(() => {
    audioCurrent.value = context.currentTime;
    audioDuration.value = context.duration;
  });
  context.onError(() => {
    audioPlaying.value = false;
    uni.showToast({ title: '音频播放失败', icon: 'none' });
  });
  return context;
}

function toggleAudio() {
  const src = props.question?.audioUrl;
  if (!src) return;
  audio ??= createAudio(src);
  if (audioPlaying.value) audio.pause();
  else audio.play();
}

function pause() {
  if (audioPlaying.value) audio?.pause();
}

defineExpose({ pause });

watch(() => props.question?.audioUrl, destroyAudio);

onBeforeUnmount(destroyAudio);
</script>

<style scoped lang="scss">
.u-question-content {
  color: var(--color-text);

  &__audio {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-base);
    padding: 16rpx 24rpx;
    border-radius: var(--radius-lg);
    background: var(--color-primary-bg);
    gap: 20rpx;
  }

  &__audio-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: var(--color-primary);
  }

  &__play {
    width: 0;
    height: 0;
    margin-left: 6rpx;
    border-top: 14rpx solid transparent;
    border-bottom: 14rpx solid transparent;
    border-left: 22rpx solid var(--color-text-inverse);
  }

  &__pause {
    width: 8rpx;
    height: 26rpx;
    border-right: 8rpx solid var(--color-text-inverse);
    border-left: 8rpx solid var(--color-text-inverse);
  }

  &__audio-time {
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__material {
    margin-bottom: var(--spacing-base);
    padding: 20rpx 24rpx;
    border-radius: var(--radius-lg);
    background: var(--color-bg-grey);
  }

  &__item + &__item {
    margin-top: 32rpx;
  }

  &__stem {
    display: flex;
    margin-bottom: 20rpx;
    gap: 8rpx;
  }

  &__index {
    flex-shrink: 0;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 1.7;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__option {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16rpx;
    padding: 16rpx 24rpx;
    border: 2rpx solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg);
    gap: 16rpx;

    &--selected {
      border-color: var(--color-primary);
      background: var(--color-primary-bg);
    }
  }

  &__option-key {
    flex-shrink: 0;
    width: 44rpx;
    height: 44rpx;
    margin-top: 4rpx;
    border: 2rpx solid var(--color-border-dark);
    border-radius: 50%;
    font-size: 24rpx;
    line-height: 44rpx;
    text-align: center;
  }

  &__option--selected &__option-key {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: var(--color-text-inverse);
  }
}
</style>
