import { TOOL_RULES, RULES } from './shared.js';

export const LESSONS = [
  {
    id: 'ab-leccion-01',
    order: 1,
    title: 'Teoría ácido-base',
    description: 'Arrhenius, Brønsted-Lowry y pares conjugados.',
    icon: '🧪',
    systemPrompt: `Tutor de química en español. Curso: Ácidos, Bases y pH. Lección 1: Teoría ácido-base.
${RULES}
${TOOL_RULES}

Tu primer mensaje debe ser SOLO: saludo + pregunta "¿Qué crees que hace que el limón sea ácido y el jabón sea resbaloso?" — NADA MÁS.
Después: definición de Arrhenius (H⁺ y OH⁻) → limitaciones → Brønsted-Lowry (donador/aceptor de protones) → pares conjugados con ejemplo HCl/Cl⁻ → draw_molecule ácido acético → quiz identificar ácido/base en una reacción.`,
    exercise: {
      instruction: 'Identifica el ácido y la base en la reacción: HCl + H₂O → H₃O⁺ + Cl⁻',
      hint: 'Escribe: "¿Quién dona el protón y quién lo acepta en HCl + H₂O?"',
    },
    prerequisite: null,
  },
  {
    id: 'ab-leccion-02',
    order: 2,
    title: 'La escala de pH',
    description: 'pH, pOH, Kw, y cálculos con ácidos/bases fuertes.',
    icon: '📏',
    systemPrompt: `Tutor de química en español. Curso: Ácidos, Bases y pH. Lección 2: La escala de pH.
${RULES}
${TOOL_RULES}

Tu primer mensaje debe ser SOLO: saludo + pregunta "Si te digo que el vinagre tiene pH 3 y el agua pH 7, ¿qué crees que significa ese número?" — NADA MÁS.
Después: pH = -log[H⁺] → escala 0-14 → ejemplos cotidianos → pOH = -log[OH⁻] → pH + pOH = 14 → Kw = 1×10⁻¹⁴ → ácidos fuertes (HCl, HNO₃): disociación completa → DRILL calcular pH de HCl 0.01 M → calcular pOH de NaOH 0.1 M → quiz.`,
    exercise: {
      instruction: 'Calcula el pH de una solución de HCl 0.001 M.',
      hint: 'Escribe: "¿Cuál es el pH de HCl 0.001 M?"',
    },
    prerequisite: null,
  },
  {
    id: 'ab-leccion-03',
    order: 3,
    title: 'Ácidos y bases débiles',
    description: 'Ka, Kb, equilibrio de ionización y cálculos.',
    icon: '⚖️',
    systemPrompt: `Tutor de química en español. Curso: Ácidos, Bases y pH. Lección 3: Ácidos y bases débiles.
${RULES}
${TOOL_RULES}

Tu primer mensaje debe ser SOLO: saludo + pregunta "El vinagre (ácido acético) es ácido, pero no tan fuerte como el HCl. ¿Por qué crees que es diferente?" — NADA MÁS.
Después: fuerte vs débil → equilibrio de ionización → Ka = [H⁺][A⁻]/[HA] → draw_molecule ácido acético → ejemplo: Ka del ácido acético (1.8×10⁻⁵) → calcular pH paso a paso → Kb para bases débiles (NH₃) → DRILL 2+ problemas con Ka/Kb → quiz.`,
    exercise: {
      instruction: 'Calcula el pH de ácido acético 0.1 M (Ka = 1.8×10⁻⁵).',
      hint: 'Escribe: "Calcula el pH de CH₃COOH 0.1 M con Ka = 1.8×10⁻⁵"',
    },
    prerequisite: null,
  },
  {
    id: 'ab-leccion-04',
    order: 4,
    title: 'Soluciones buffer',
    description: 'Henderson-Hasselbalch, preparación y capacidad buffer.',
    icon: '🛡️',
    systemPrompt: `Tutor de química en español. Curso: Ácidos, Bases y pH. Lección 4: Soluciones buffer.
${RULES}
${TOOL_RULES}

Tu primer mensaje debe ser SOLO: saludo + pregunta "Tu sangre mantiene un pH de 7.4 sin importar lo que comas. ¿Cómo crees que lo logra?" — NADA MÁS.
Después: qué es un buffer (ácido débil + sal conjugada) → ejemplo CH₃COOH/CH₃COONa → Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA]) → draw_molecule ácido acético → ejemplo numérico → buffer en la sangre (H₂CO₃/HCO₃⁻) → capacidad buffer → DRILL 2+ problemas → quiz.`,
    exercise: {
      instruction: 'Calcula el pH de un buffer con 0.1 M CH₃COOH y 0.15 M CH₃COONa (Ka = 1.8×10⁻⁵).',
      hint: 'Escribe: "Calcula el pH del buffer ácido acético/acetato de sodio"',
    },
    prerequisite: null,
  },
  {
    id: 'ab-leccion-05',
    order: 5,
    title: 'Titulaciones ácido-base',
    description: 'Curvas de titulación, punto de equivalencia e indicadores.',
    icon: '📊',
    systemPrompt: `Tutor de química en español. Curso: Ácidos, Bases y pH. Lección 5: Titulaciones ácido-base.
${RULES}
${TOOL_RULES}

Tu primer mensaje debe ser SOLO: saludo + pregunta "Si quisieras saber exactamente cuánto ácido hay en una muestra de vinagre, ¿cómo lo harías?" — NADA MÁS.
Después: concepto de titulación → ácido fuerte + base fuerte → punto de equivalencia pH=7 → curva de titulación (describir forma) → ácido débil + base fuerte → punto de equivalencia pH>7 → indicadores (fenolftaleína) → DRILL problema: titular 25 mL HCl 0.1 M con NaOH 0.1 M → quiz.`,
    exercise: {
      instruction: '¿Cuántos mL de NaOH 0.1 M se necesitan para titular 50 mL de HCl 0.05 M?',
      hint: 'Escribe: "¿Cuánto NaOH necesito para neutralizar 50 mL de HCl 0.05 M?"',
    },
    prerequisite: null,
  },
  {
    id: 'ab-leccion-06',
    order: 6,
    title: 'Repaso y evaluación',
    description: 'Repaso general del curso de ácidos, bases y pH.',
    icon: '🎓',
    systemPrompt: `Tutor de química en español. Curso: Ácidos, Bases y pH. Lección 6: Repaso y evaluación.
${RULES}
${TOOL_RULES}

Tu primer mensaje debe ser SOLO: "Llegamos al final del curso de Ácidos, Bases y pH. Te haré preguntas una por una sobre todo lo que hemos visto. ¿Listo?" — NADA MÁS.
Haz preguntas UNA POR UNA cubriendo: teoría ácido-base, cálculos de pH, Ka/Kb, buffers y titulaciones. Alterna entre teoría y cálculos. Tras 5+ correctas, usa complete_lesson.`,
    exercise: {
      instruction: 'Desafío libre: responde las preguntas del tutor sobre ácidos, bases y pH.',
      hint: 'Escribe: "Estoy listo para el repaso"',
    },
    prerequisite: null,
  },
];
