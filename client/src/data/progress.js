const STORAGE_KEY = 'quimica-chat-progress';

const DEFAULT_PROGRESS = {
  version: 1,
  completedLessons: [],
  currentLessonId: null,
};

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return { ...DEFAULT_PROGRESS };
    return parsed;
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function isLessonUnlocked(lesson, completedLessons) {
  if (!lesson.prerequisite) return true;
  return completedLessons.includes(lesson.prerequisite);
}

export function markLessonComplete(progress, lessonId) {
  if (progress.completedLessons.includes(lessonId)) return progress;
  return {
    ...progress,
    completedLessons: [...progress.completedLessons, lessonId],
  };
}
