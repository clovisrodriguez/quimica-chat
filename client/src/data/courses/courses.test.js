import { describe, it, expect } from 'vitest';
import { COURSES } from './index';
import { TOOL_RULES, RULES } from './shared';

describe('COURSES', () => {
  it('has at least 2 courses', () => {
    expect(COURSES.length).toBeGreaterThanOrEqual(2);
  });

  it('each course has required metadata fields', () => {
    for (const course of COURSES) {
      expect(course).toHaveProperty('id');
      expect(course).toHaveProperty('title');
      expect(course).toHaveProperty('description');
      expect(course).toHaveProperty('icon');
      expect(course).toHaveProperty('color');
      expect(course).toHaveProperty('lessonCount');
      expect(course).toHaveProperty('loadLessons');
      expect(typeof course.loadLessons).toBe('function');
    }
  });

  it('has unique course ids', () => {
    const ids = COURSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('loadLessons returns correct number of lessons for each course', async () => {
    for (const course of COURSES) {
      const lessons = await course.loadLessons();
      expect(lessons.length).toBe(course.lessonCount);
    }
  });

  it('each lesson has required fields', async () => {
    for (const course of COURSES) {
      const lessons = await course.loadLessons();
      for (const lesson of lessons) {
        expect(lesson).toHaveProperty('id');
        expect(lesson).toHaveProperty('order');
        expect(lesson).toHaveProperty('title');
        expect(lesson).toHaveProperty('description');
        expect(lesson).toHaveProperty('icon');
        expect(lesson).toHaveProperty('systemPrompt');
        expect(typeof lesson.systemPrompt).toBe('string');
        expect(lesson.systemPrompt.length).toBeGreaterThan(0);
      }
    }
  });

  it('each lesson systemPrompt includes RULES and TOOL_RULES', async () => {
    for (const course of COURSES) {
      const lessons = await course.loadLessons();
      for (const lesson of lessons) {
        expect(lesson.systemPrompt).toContain('REGLAS DE COMUNICACIÓN');
        expect(lesson.systemPrompt).toContain('HERRAMIENTAS');
      }
    }
  });

  it('lessons have unique ids within each course', async () => {
    for (const course of COURSES) {
      const lessons = await course.loadLessons();
      const ids = lessons.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('lessons are ordered sequentially', async () => {
    for (const course of COURSES) {
      const lessons = await course.loadLessons();
      for (let i = 0; i < lessons.length; i++) {
        expect(lessons[i].order).toBe(i + 1);
      }
    }
  });
});

describe('shared constants', () => {
  it('TOOL_RULES contains tool instructions', () => {
    expect(TOOL_RULES).toContain('show_bohr_model');
    expect(TOOL_RULES).toContain('draw_molecule');
    expect(TOOL_RULES).toContain('show_periodic_table');
  });

  it('RULES contains communication rules', () => {
    expect(RULES).toContain('REGLAS DE COMUNICACIÓN');
    expect(RULES).toContain('EVALUACIÓN');
    expect(RULES).toContain('complete_lesson');
  });
});
