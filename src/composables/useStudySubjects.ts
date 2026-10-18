import { computed, watch } from 'vue';
import type { TabItem } from '@/components/UTabs/index.vue';
import { useExamStore } from '@/store/modules/exam';

/** 学习记录页的科目筛选：当前考试的科目，首项为全部 */
export function useStudySubjects() {
  const examStore = useExamStore();

  const subjectTabs = computed<TabItem[]>(() => [
    { label: '全部', value: '' },
    ...examStore.currentSubjects.map(item => ({ label: item.name, value: item.id })),
  ]);

  const subjectNames = computed(() => {
    const names: Record<string, string> = {};
    Object.values(examStore.subjectsByExam).forEach(items => items.forEach(item => (names[item.id] = item.name)));
    return names;
  });

  const subjectsReady = computed(() => {
    if (!examStore.profilesLoaded) return false;
    const examId = examStore.currentProfile?.examId;
    return !examId || examStore.subjectsByExam[examId] !== undefined;
  });

  function subjectName(id: string | null | undefined): string {
    return id ? (subjectNames.value[id] ?? '') : '';
  }

  function isCurrentSubject(id: string): boolean {
    return examStore.currentSubjects.some(item => item.id === id);
  }

  /** 科目加载完成后，选中的科目不属于当前考试时调用 onInvalid */
  function watchSubjectFilter(selected: () => string, onInvalid: () => void) {
    watch(
      () => [subjectsReady.value, examStore.currentSubjects, selected()] as const,
      ([ready, , id]) => {
        if (ready && id && !isCurrentSubject(id)) onInvalid();
      },
      { immediate: true },
    );
  }

  async function loadSubjects(): Promise<void> {
    try {
      await examStore.ensureProfiles();
      const examId = examStore.currentProfile?.examId;
      if (examId) await examStore.fetchSubjects(examId);
    } catch (error) {
      console.error('加载科目失败:', error);
    }
  }

  return { subjectTabs, subjectName, isCurrentSubject, watchSubjectFilter, loadSubjects };
}
