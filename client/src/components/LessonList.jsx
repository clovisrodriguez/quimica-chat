import { isLessonUnlocked } from '../data/progress';

export default function LessonList({ lessons, progress, courseName, onSelectLesson, onBack }) {
  const completedCount = progress.completedLessons.length;
  const totalCount = lessons.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          {onBack && (
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Cursos
            </button>
          )}
          <h2 className="text-sm font-semibold text-emerald-400">Modo Clase</h2>
        </div>
        <p className="text-xs text-gray-500 mb-2">{courseName}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {completedCount} de {totalCount}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {lessons.map((lesson) => {
          const completed = progress.completedLessons.includes(lesson.id);
          const unlocked = isLessonUnlocked(lesson, progress.completedLessons);

          return (
            <button
              key={lesson.id}
              onClick={() => unlocked && onSelectLesson(lesson.id)}
              disabled={!unlocked}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                completed
                  ? 'border-emerald-800 bg-emerald-900/20 hover:bg-emerald-900/30'
                  : unlocked
                  ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer'
                  : 'border-gray-800 bg-gray-900/30 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">{lesson.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Lección {lesson.order}</span>
                    {completed && <span className="text-emerald-400 text-xs">✓ Completada</span>}
                    {!unlocked && <span className="text-gray-500 text-xs">🔒</span>}
                  </div>
                  <h3 className="text-sm font-medium text-white truncate">{lesson.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{lesson.description}</p>
                </div>
                {unlocked && !completed && (
                  <span className="text-gray-500 mt-1">→</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
