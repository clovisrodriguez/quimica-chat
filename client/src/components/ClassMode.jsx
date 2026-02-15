import { useState, useCallback } from 'react';
import { LESSONS } from '../data/curriculum';
import { loadProgress, saveProgress, markLessonComplete } from '../data/progress';
import LessonList from './LessonList';
import LessonChat from './LessonChat';

export default function ClassMode({ onDrawMolecule, onShowBohrModel }) {
  const [progress, setProgress] = useState(() => loadProgress());
  const [activeLessonId, setActiveLessonId] = useState(null);

  const activeLesson = activeLessonId
    ? LESSONS.find((l) => l.id === activeLessonId)
    : null;

  const handleSelectLesson = useCallback((lessonId) => {
    setActiveLessonId(lessonId);
  }, []);

  const handleBack = useCallback(() => {
    setActiveLessonId(null);
  }, []);

  const handleMarkComplete = useCallback(() => {
    if (!activeLessonId) return;
    setProgress((prev) => {
      const updated = markLessonComplete(prev, activeLessonId);
      saveProgress(updated);
      return updated;
    });
    setActiveLessonId(null);
  }, [activeLessonId]);

  if (activeLesson) {
    return (
      <LessonChat
        lesson={activeLesson}
        onDrawMolecule={onDrawMolecule}
        onShowBohrModel={onShowBohrModel}
        onMarkComplete={handleMarkComplete}
        onBack={handleBack}
      />
    );
  }

  return (
    <LessonList
      lessons={LESSONS}
      progress={progress}
      onSelectLesson={handleSelectLesson}
    />
  );
}
