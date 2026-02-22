const STORAGE_KEY = 'quimica-chat-progress';

const DEFAULT_PROGRESS = {
  version: 2,
  courses: {},
};

function defaultCourseProgress() {
  return { completedLessons: [], currentLessonId: null };
}

function migrateV1(v1) {
  return {
    version: 2,
    courses: {
      'quimica-general': {
        completedLessons: v1.completedLessons || [],
        currentLessonId: v1.currentLessonId || null,
      },
    },
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS, courses: {} };
    const parsed = JSON.parse(raw);
    if (parsed.version === 1) {
      const migrated = migrateV1(parsed);
      saveProgress(migrated);
      return migrated;
    }
    if (parsed.version === 2) return parsed;
    return { ...DEFAULT_PROGRESS, courses: {} };
  } catch {
    return { ...DEFAULT_PROGRESS, courses: {} };
  }
}

export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getCourseProgress(progress, courseId) {
  return progress.courses[courseId] || defaultCourseProgress();
}

export function isLessonUnlocked(lesson, completedLessons) {
  if (!lesson.prerequisite) return true;
  return completedLessons.includes(lesson.prerequisite);
}

export function markLessonComplete(progress, courseId, lessonId) {
  const course = getCourseProgress(progress, courseId);
  if (course.completedLessons.includes(lessonId)) return progress;
  return {
    ...progress,
    courses: {
      ...progress.courses,
      [courseId]: {
        ...course,
        completedLessons: [...course.completedLessons, lessonId],
      },
    },
  };
}
