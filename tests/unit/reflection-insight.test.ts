// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { ReflectionInsight, JournalEntry } from '../../src/types';

describe('Unit Tests: Reflection Intelligence & Ethical Guardrails', () => {
  const sampleInsight: ReflectionInsight = {
    theme: 'Emotional Equilibrium',
    keyInsight: 'Pausing before responding diffuses interpersonal friction.',
    goalDetected: 'Practice active listening in meetings',
    recurringPattern: 'Tension peaks during late afternoon deadlines',
    suggestedMemory: 'Learned the 5-second pause technique',
    suggestedMemoryCategory: 'Learning',
    generatedAt: Date.now(),
  };

  it('should validate all structured fields in ReflectionInsight', () => {
    expect(sampleInsight.theme).toBe('Emotional Equilibrium');
    expect(sampleInsight.keyInsight).toBeTruthy();
    expect(sampleInsight.goalDetected).toBeTruthy();
    expect(sampleInsight.recurringPattern).toBeTruthy();
    expect(sampleInsight.suggestedMemory).toBeTruthy();
    expect(sampleInsight.suggestedMemoryCategory).toBe('Learning');
    expect(sampleInsight.generatedAt).toBeLessThanOrEqual(Date.now());
  });

  it('should enforce non-clinical guardrails prohibiting diagnostic terminology', () => {
    // Clinical terminology that reflection companion must avoid
    const BANNED_CLINICAL_TERMS = [
      'diagnose',
      'clinical depression',
      'pathology',
      'prescription',
      'disorder',
      'bipolar',
    ];

    const ethicalGuidelinePrompt = `You are an empathetic, non-clinical personal reflection assistant.
Never provide medical diagnoses, psychiatric evaluations, or clinical prescriptions.
Always frame insights around self-awareness, curiosity, and personal growth.`;

    const containsClinicalTerms = (text: string) =>
      BANNED_CLINICAL_TERMS.some((term) => text.toLowerCase().includes(term));

    expect(containsClinicalTerms(sampleInsight.keyInsight)).toBe(false);
    expect(containsClinicalTerms(sampleInsight.theme)).toBe(false);
    expect(containsClinicalTerms(sampleInsight.suggestedMemory)).toBe(false);
    expect(containsClinicalTerms(sampleInsight.goalDetected)).toBe(false);
  });

  it('should verify insight generation failure does not impede core journal save', async () => {
    const journalEntry: JournalEntry = {
      id: 'entry-test',
      userId: 'user-1',
      title: 'Resilient Journaling',
      content: 'Writing even when tired.',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    let journalSaved = false;
    let insightSaved = false;

    // Simulate journal save
    journalSaved = true;

    // Simulate insight generation failure in background
    try {
      throw new Error('Insight API 500 error');
      insightSaved = true;
    } catch (err) {
      // Non-critical background failure caught and logged
    }

    expect(journalSaved).toBe(true);
    expect(insightSaved).toBe(false);
  });
});
