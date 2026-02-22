import { COURSES } from '../data/courses/index';
import { getCourseProgress } from '../data/progress';

const COLOR_MAP = {
  emerald: {
    border: 'border-emerald-800',
    bg: 'bg-emerald-900/20',
    hover: 'hover:bg-emerald-900/30',
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  blue: {
    border: 'border-blue-800',
    bg: 'bg-blue-900/20',
    hover: 'hover:bg-blue-900/30',
    text: 'text-blue-400',
    bar: 'bg-blue-500',
  },
};

export default function CourseSelector({ progress, onSelectCourse }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50 shrink-0">
        <h2 className="text-sm font-semibold text-emerald-400">Modo Clase</h2>
        <p className="text-xs text-gray-500">Selecciona un curso para comenzar</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {COURSES.map((course) => {
          const courseProgress = getCourseProgress(progress, course.id);
          const completedCount = courseProgress.completedLessons.length;
          const pct = Math.round((completedCount / course.lessonCount) * 100);
          const colors = COLOR_MAP[course.color] || COLOR_MAP.emerald;

          return (
            <button
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${colors.border} ${colors.bg} ${colors.hover}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">{course.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white">{course.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{course.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {completedCount}/{course.lessonCount}
                    </span>
                  </div>
                </div>
                <span className="text-gray-500 mt-1">→</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
