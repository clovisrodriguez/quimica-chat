import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadProgress, saveProgress, getCourseProgress, isLessonUnlocked, markLessonComplete } from './progress';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('loadProgress', () => {
  it('returns default v2 progress when nothing stored', () => {
    const progress = loadProgress();
    expect(progress.version).toBe(2);
    expect(progress.courses).toEqual({});
  });

  it('returns stored v2 progress', () => {
    const stored = { version: 2, courses: { 'quimica-general': { completedLessons: ['leccion-01'], currentLessonId: null } } };
    localStorageMock.setItem('quimica-chat-progress', JSON.stringify(stored));
    const progress = loadProgress();
    expect(progress.version).toBe(2);
    expect(progress.courses['quimica-general'].completedLessons).toEqual(['leccion-01']);
  });

  it('migrates v1 to v2', () => {
    const v1 = { version: 1, completedLessons: ['leccion-01', 'leccion-02'], currentLessonId: 'leccion-03' };
    localStorageMock.setItem('quimica-chat-progress', JSON.stringify(v1));
    const progress = loadProgress();
    expect(progress.version).toBe(2);
    expect(progress.courses['quimica-general'].completedLessons).toEqual(['leccion-01', 'leccion-02']);
    expect(progress.courses['quimica-general'].currentLessonId).toBe('leccion-03');
  });

  it('saves migrated progress to localStorage', () => {
    const v1 = { version: 1, completedLessons: ['leccion-01'], currentLessonId: null };
    localStorageMock.setItem('quimica-chat-progress', JSON.stringify(v1));
    loadProgress();
    // saveProgress should have been called with migrated data
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[1][1]);
    expect(saved.version).toBe(2);
    expect(saved.courses['quimica-general']).toBeDefined();
  });

  it('returns default on invalid JSON', () => {
    localStorageMock.setItem('quimica-chat-progress', 'not-json');
    const progress = loadProgress();
    expect(progress.version).toBe(2);
    expect(progress.courses).toEqual({});
  });

  it('returns default on unknown version', () => {
    localStorageMock.setItem('quimica-chat-progress', JSON.stringify({ version: 99 }));
    const progress = loadProgress();
    expect(progress.version).toBe(2);
    expect(progress.courses).toEqual({});
  });
});

describe('saveProgress', () => {
  it('saves progress to localStorage', () => {
    const progress = { version: 2, courses: {} };
    saveProgress(progress);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('quimica-chat-progress', JSON.stringify(progress));
  });
});

describe('getCourseProgress', () => {
  it('returns stored course progress', () => {
    const progress = { version: 2, courses: { 'quimica-general': { completedLessons: ['leccion-01'], currentLessonId: null } } };
    const result = getCourseProgress(progress, 'quimica-general');
    expect(result.completedLessons).toEqual(['leccion-01']);
  });

  it('returns default progress for unknown course', () => {
    const progress = { version: 2, courses: {} };
    const result = getCourseProgress(progress, 'unknown');
    expect(result.completedLessons).toEqual([]);
    expect(result.currentLessonId).toBeNull();
  });
});

describe('isLessonUnlocked', () => {
  it('returns true when no prerequisite', () => {
    expect(isLessonUnlocked({ prerequisite: null }, [])).toBe(true);
  });

  it('returns true when prerequisite is completed', () => {
    expect(isLessonUnlocked({ prerequisite: 'leccion-01' }, ['leccion-01'])).toBe(true);
  });

  it('returns false when prerequisite is not completed', () => {
    expect(isLessonUnlocked({ prerequisite: 'leccion-01' }, [])).toBe(false);
  });
});

describe('markLessonComplete', () => {
  it('adds lesson to course completedLessons', () => {
    const progress = { version: 2, courses: {} };
    const updated = markLessonComplete(progress, 'quimica-general', 'leccion-01');
    expect(updated.courses['quimica-general'].completedLessons).toEqual(['leccion-01']);
  });

  it('does not duplicate already completed lesson', () => {
    const progress = { version: 2, courses: { 'quimica-general': { completedLessons: ['leccion-01'], currentLessonId: null } } };
    const updated = markLessonComplete(progress, 'quimica-general', 'leccion-01');
    expect(updated.courses['quimica-general'].completedLessons).toEqual(['leccion-01']);
    expect(updated).toBe(progress); // same reference, no mutation
  });

  it('appends to existing completedLessons', () => {
    const progress = { version: 2, courses: { 'quimica-general': { completedLessons: ['leccion-01'], currentLessonId: null } } };
    const updated = markLessonComplete(progress, 'quimica-general', 'leccion-02');
    expect(updated.courses['quimica-general'].completedLessons).toEqual(['leccion-01', 'leccion-02']);
  });

  it('creates course entry if it does not exist', () => {
    const progress = { version: 2, courses: {} };
    const updated = markLessonComplete(progress, 'acidos-bases-ph', 'ab-leccion-01');
    expect(updated.courses['acidos-bases-ph'].completedLessons).toEqual(['ab-leccion-01']);
  });

  it('does not mutate original progress', () => {
    const progress = { version: 2, courses: { 'quimica-general': { completedLessons: ['leccion-01'], currentLessonId: null } } };
    markLessonComplete(progress, 'quimica-general', 'leccion-02');
    expect(progress.courses['quimica-general'].completedLessons).toEqual(['leccion-01']);
  });
});
