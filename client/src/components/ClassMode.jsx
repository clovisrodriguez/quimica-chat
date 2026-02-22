import { useState, useCallback, useEffect } from 'react';
import { COURSES } from '../data/courses/index';
import { loadProgress, saveProgress, markLessonComplete, getCourseProgress } from '../data/progress';
import CourseSelector from './CourseSelector';
import LessonList from './LessonList';
import LessonChat from './LessonChat';

export default function ClassMode({ onDrawMolecule, onShowBohrModel, onShowPeriodicTable, onClearConstructor }) {
  const [progress, setProgress] = useState(() => loadProgress());
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  const activeCourse = activeCourseId
    ? COURSES.find((c) => c.id === activeCourseId)
    : null;

  const activeLesson = activeLessonId
    ? lessons.find((l) => l.id === activeLessonId)
    : null;

  // Load lessons when a course is selected
  useEffect(() => {
    if (!activeCourse) {
      setLessons([]);
      return;
    }
    setLoadingLessons(true);
    activeCourse.loadLessons().then((loadedLessons) => {
      setLessons(loadedLessons);
      setLoadingLessons(false);
    });
  }, [activeCourse]);

  const handleSelectCourse = useCallback((courseId) => {
    onClearConstructor?.();
    setActiveCourseId(courseId);
    setActiveLessonId(null);
  }, [onClearConstructor]);

  const handleSelectLesson = useCallback((lessonId) => {
    onClearConstructor?.();
    setActiveLessonId(lessonId);
  }, [onClearConstructor]);

  const handleBackToCourses = useCallback(() => {
    onClearConstructor?.();
    setActiveCourseId(null);
    setActiveLessonId(null);
    setLessons([]);
  }, [onClearConstructor]);

  const handleBackToLessons = useCallback(() => {
    onClearConstructor?.();
    setActiveLessonId(null);
  }, [onClearConstructor]);

  const handleMarkComplete = useCallback(() => {
    if (!activeLessonId || !activeCourseId) return;
    setProgress((prev) => {
      const updated = markLessonComplete(prev, activeCourseId, activeLessonId);
      saveProgress(updated);
      return updated;
    });
    setActiveLessonId(null);
  }, [activeLessonId, activeCourseId]);

  // Lesson chat view
  if (activeLesson) {
    return (
      <LessonChat
        lesson={activeLesson}
        onDrawMolecule={onDrawMolecule}
        onShowBohrModel={onShowBohrModel}
        onShowPeriodicTable={onShowPeriodicTable}
        onMarkComplete={handleMarkComplete}
        onBack={handleBackToLessons}
      />
    );
  }

  // Lesson list view
  if (activeCourseId) {
    if (loadingLessons) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          Cargando lecciones...
        </div>
      );
    }
    const courseProgress = getCourseProgress(progress, activeCourseId);
    return (
      <LessonList
        lessons={lessons}
        progress={courseProgress}
        courseName={activeCourse?.title || ''}
        onSelectLesson={handleSelectLesson}
        onBack={handleBackToCourses}
      />
    );
  }

  // Course selector view
  return (
    <CourseSelector
      progress={progress}
      onSelectCourse={handleSelectCourse}
    />
  );
}
