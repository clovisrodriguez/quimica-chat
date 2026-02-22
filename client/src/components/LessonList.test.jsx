import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LessonList from './LessonList';

const mockLessons = [
  { id: 'l-01', order: 1, title: 'Lección Uno', description: 'Desc 1', icon: '⚛️', prerequisite: null },
  { id: 'l-02', order: 2, title: 'Lección Dos', description: 'Desc 2', icon: '📋', prerequisite: null },
  { id: 'l-03', order: 3, title: 'Lección Tres', description: 'Desc 3', icon: '🔗', prerequisite: 'l-02' },
];

const defaultProgress = { completedLessons: [], currentLessonId: null };

describe('LessonList', () => {
  it('renders course name', () => {
    render(
      <LessonList lessons={mockLessons} progress={defaultProgress} courseName="Curso Test" onSelectLesson={() => {}} />
    );
    expect(screen.getByText('Curso Test')).toBeInTheDocument();
  });

  it('renders back button when onBack is provided', () => {
    const handleBack = vi.fn();
    render(
      <LessonList lessons={mockLessons} progress={defaultProgress} courseName="Test" onSelectLesson={() => {}} onBack={handleBack} />
    );
    const backBtn = screen.getByText('← Cursos');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalled();
  });

  it('does not render back button when onBack is not provided', () => {
    render(
      <LessonList lessons={mockLessons} progress={defaultProgress} courseName="Test" onSelectLesson={() => {}} />
    );
    expect(screen.queryByText('← Cursos')).not.toBeInTheDocument();
  });

  it('renders all lessons', () => {
    render(
      <LessonList lessons={mockLessons} progress={defaultProgress} courseName="Test" onSelectLesson={() => {}} />
    );
    expect(screen.getByText('Lección Uno')).toBeInTheDocument();
    expect(screen.getByText('Lección Dos')).toBeInTheDocument();
    expect(screen.getByText('Lección Tres')).toBeInTheDocument();
  });

  it('shows progress bar with correct count', () => {
    const progress = { completedLessons: ['l-01'], currentLessonId: null };
    render(
      <LessonList lessons={mockLessons} progress={progress} courseName="Test" onSelectLesson={() => {}} />
    );
    expect(screen.getByText('1 de 3')).toBeInTheDocument();
  });

  it('marks completed lessons', () => {
    const progress = { completedLessons: ['l-01'], currentLessonId: null };
    render(
      <LessonList lessons={mockLessons} progress={progress} courseName="Test" onSelectLesson={() => {}} />
    );
    expect(screen.getByText('✓ Completada')).toBeInTheDocument();
  });

  it('calls onSelectLesson when clicking unlocked lesson', () => {
    const handleSelect = vi.fn();
    render(
      <LessonList lessons={mockLessons} progress={defaultProgress} courseName="Test" onSelectLesson={handleSelect} />
    );
    fireEvent.click(screen.getByText('Lección Uno'));
    expect(handleSelect).toHaveBeenCalledWith('l-01');
  });

  it('shows lock icon for locked lessons', () => {
    render(
      <LessonList lessons={mockLessons} progress={defaultProgress} courseName="Test" onSelectLesson={() => {}} />
    );
    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('unlocks lesson when prerequisite is completed', () => {
    const progress = { completedLessons: ['l-02'], currentLessonId: null };
    const handleSelect = vi.fn();
    render(
      <LessonList lessons={mockLessons} progress={progress} courseName="Test" onSelectLesson={handleSelect} />
    );
    fireEvent.click(screen.getByText('Lección Tres'));
    expect(handleSelect).toHaveBeenCalledWith('l-03');
  });

  it('handles empty lessons array', () => {
    render(
      <LessonList lessons={[]} progress={defaultProgress} courseName="Empty" onSelectLesson={() => {}} />
    );
    expect(screen.getByText('0 de 0')).toBeInTheDocument();
  });
});
