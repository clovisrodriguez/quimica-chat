import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClassMode from './ClassMode';

// Mock child components
vi.mock('./CourseSelector', () => ({
  default: ({ onSelectCourse }) => (
    <div data-testid="course-selector">
      <button onClick={() => onSelectCourse('quimica-general')}>select-quimica</button>
      <button onClick={() => onSelectCourse('acidos-bases-ph')}>select-acidos</button>
    </div>
  ),
}));

vi.mock('./LessonList', () => ({
  default: ({ lessons, courseName, onSelectLesson, onBack }) => (
    <div data-testid="lesson-list">
      <span data-testid="course-name">{courseName}</span>
      <span data-testid="lesson-count">{lessons.length}</span>
      <button onClick={() => onSelectLesson(lessons[0]?.id)}>select-lesson</button>
      <button onClick={onBack}>back-to-courses</button>
    </div>
  ),
}));

vi.mock('./LessonChat', () => ({
  default: ({ lesson, onBack, onMarkComplete }) => (
    <div data-testid="lesson-chat">
      <span data-testid="lesson-title">{lesson.title}</span>
      <button onClick={onBack}>back-to-lessons</button>
      <button onClick={onMarkComplete}>complete</button>
    </div>
  ),
}));

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

describe('ClassMode', () => {
  const defaultProps = {
    onDrawMolecule: vi.fn(),
    onShowBohrModel: vi.fn(),
    onShowPeriodicTable: vi.fn(),
    onClearConstructor: vi.fn(),
  };

  it('renders course selector initially', () => {
    render(<ClassMode {...defaultProps} />);
    expect(screen.getByTestId('course-selector')).toBeInTheDocument();
  });

  it('navigates to lesson list on course select', async () => {
    render(<ClassMode {...defaultProps} />);
    fireEvent.click(screen.getByText('select-quimica'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-list')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('course-selector')).not.toBeInTheDocument();
  });

  it('shows correct course name in lesson list', async () => {
    render(<ClassMode {...defaultProps} />);
    fireEvent.click(screen.getByText('select-quimica'));

    await waitFor(() => {
      expect(screen.getByTestId('course-name')).toHaveTextContent('Química General y Orgánica');
    });
  });

  it('loads correct number of lessons', async () => {
    render(<ClassMode {...defaultProps} />);
    fireEvent.click(screen.getByText('select-quimica'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-count')).toHaveTextContent('10');
    });
  });

  it('navigates back to courses from lesson list', async () => {
    render(<ClassMode {...defaultProps} />);
    fireEvent.click(screen.getByText('select-quimica'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-list')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('back-to-courses'));
    expect(screen.getByTestId('course-selector')).toBeInTheDocument();
  });

  it('navigates to lesson chat on lesson select', async () => {
    render(<ClassMode {...defaultProps} />);
    fireEvent.click(screen.getByText('select-quimica'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-list')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('select-lesson'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-chat')).toBeInTheDocument();
    });
  });

  it('navigates back to lesson list from lesson chat', async () => {
    render(<ClassMode {...defaultProps} />);
    fireEvent.click(screen.getByText('select-quimica'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-list')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('select-lesson'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-chat')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('back-to-lessons'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-list')).toBeInTheDocument();
    });
  });

  it('calls onClearConstructor on navigation', async () => {
    render(<ClassMode {...defaultProps} />);
    fireEvent.click(screen.getByText('select-quimica'));
    expect(defaultProps.onClearConstructor).toHaveBeenCalled();
  });

  it('loads second course correctly', async () => {
    render(<ClassMode {...defaultProps} />);
    fireEvent.click(screen.getByText('select-acidos'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-count')).toHaveTextContent('6');
    });
  });
});
