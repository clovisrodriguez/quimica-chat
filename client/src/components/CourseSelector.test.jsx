import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CourseSelector from './CourseSelector';

describe('CourseSelector', () => {
  const defaultProgress = { version: 2, courses: {} };

  it('renders course selector header', () => {
    render(<CourseSelector progress={defaultProgress} onSelectCourse={() => {}} />);
    expect(screen.getByText('Modo Clase')).toBeInTheDocument();
    expect(screen.getByText('Selecciona un curso para comenzar')).toBeInTheDocument();
  });

  it('renders all courses', () => {
    render(<CourseSelector progress={defaultProgress} onSelectCourse={() => {}} />);
    expect(screen.getByText('Química General y Orgánica')).toBeInTheDocument();
    expect(screen.getByText('Ácidos, Bases y pH')).toBeInTheDocument();
  });

  it('shows progress for each course', () => {
    const progress = {
      version: 2,
      courses: {
        'quimica-general': { completedLessons: ['leccion-01', 'leccion-02'], currentLessonId: null },
      },
    };
    render(<CourseSelector progress={progress} onSelectCourse={() => {}} />);
    expect(screen.getByText('2/10')).toBeInTheDocument();
    expect(screen.getByText('0/6')).toBeInTheDocument();
  });

  it('calls onSelectCourse when clicking a course', () => {
    const handleSelect = vi.fn();
    render(<CourseSelector progress={defaultProgress} onSelectCourse={handleSelect} />);
    fireEvent.click(screen.getByText('Química General y Orgánica'));
    expect(handleSelect).toHaveBeenCalledWith('quimica-general');
  });

  it('calls onSelectCourse with correct id for second course', () => {
    const handleSelect = vi.fn();
    render(<CourseSelector progress={defaultProgress} onSelectCourse={handleSelect} />);
    fireEvent.click(screen.getByText('Ácidos, Bases y pH'));
    expect(handleSelect).toHaveBeenCalledWith('acidos-bases-ph');
  });

  it('shows 0/N when no progress exists for a course', () => {
    render(<CourseSelector progress={defaultProgress} onSelectCourse={() => {}} />);
    expect(screen.getByText('0/10')).toBeInTheDocument();
    expect(screen.getByText('0/6')).toBeInTheDocument();
  });
});
