export const COURSES = [
  {
    id: 'quimica-general',
    title: 'Química General y Orgánica',
    description: 'Desde el modelo atómico hasta reacciones orgánicas. 10 lecciones.',
    icon: '⚗️',
    color: 'emerald',
    lessonCount: 10,
    loadLessons: () => import('./quimica-general.js').then((m) => m.LESSONS),
  },
  {
    id: 'acidos-bases-ph',
    title: 'Ácidos, Bases y pH',
    description: 'Teoría ácido-base, escala de pH, buffers y titulaciones. 6 lecciones.',
    icon: '🧪',
    color: 'blue',
    lessonCount: 6,
    loadLessons: () => import('./acidos-bases-ph.js').then((m) => m.LESSONS),
  },
];
