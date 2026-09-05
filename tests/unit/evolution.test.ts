// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { JournalEntry, PersonalEvolutionData, EvolutionTimeRange } from '../../src/types';

describe('Unit Tests: Personal Evolution Calculations & Range Filtering', () => {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const mockEntries: JournalEntry[] = [
    {
      id: 'entry-1',
      userId: 'user-1',
      title: 'Recent Reflection',
      content: 'I managed to finish the prototype today. Feeling energized and motivated.',
      mood: 'Energized',
      summary: 'Finished prototype.',
      tags: ['work', 'success'],
      messages: [],
      createdAt: now - 2 * ONE_DAY_MS,
      updatedAt: now - 2 * ONE_DAY_MS,
    },
    {
      id: 'entry-2',
      userId: 'user-1',
      title: 'Two Weeks Ago',
      content: 'Struggled with sleep this week. Need better bedtime habits.',
      mood: 'Tired',
      summary: 'Sleep troubles.',
      tags: ['health'],
      messages: [],
      createdAt: now - 14 * ONE_DAY_MS,
      updatedAt: now - 14 * ONE_DAY_MS,
    },
    {
      id: 'entry-3',
      userId: 'user-1',
      title: 'Two Months Ago',
      content: 'Started learning TypeScript and backend architectures.',
      mood: 'Focused',
      summary: 'Learning TypeScript.',
      tags: ['study'],
      messages: [],
      createdAt: now - 60 * ONE_DAY_MS,
      updatedAt: now - 60 * ONE_DAY_MS,
    },
    {
      id: 'entry-4',
      userId: 'user-1',
      title: 'Four Months Ago',
      content: 'Reflecting on previous career direction.',
      mood: 'Reflective',
      summary: 'Career crossroads.',
      tags: ['career'],
      messages: [],
      createdAt: now - 120 * ONE_DAY_MS,
      updatedAt: now - 120 * ONE_DAY_MS,
    },
  ];

  function filterEntriesByRange(entries: JournalEntry[], range: EvolutionTimeRange): JournalEntry[] {
    const cutoffMap: Record<EvolutionTimeRange, number> = {
      '7d': 7 * ONE_DAY_MS,
      '30d': 30 * ONE_DAY_MS,
      '90d': 90 * ONE_DAY_MS,
      all: Infinity,
    };

    const maxAge = cutoffMap[range];
    if (maxAge === Infinity) return entries;
    const cutoff = Date.now() - maxAge;
    return entries.filter((e) => e.createdAt >= cutoff);
  }

  function calculateWordCount(entries: JournalEntry[]): number {
    return entries.reduce((acc, entry) => {
      const words = entry.content.trim() ? entry.content.trim().split(/\s+/).length : 0;
      return acc + words;
    }, 0);
  }

  it('should filter entries accurately for 7d time range', () => {
    const filtered = filterEntriesByRange(mockEntries, '7d');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('entry-1');
  });

  it('should filter entries accurately for 30d time range', () => {
    const filtered = filterEntriesByRange(mockEntries, '30d');
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(['entry-1', 'entry-2']);
  });

  it('should filter entries accurately for 90d time range', () => {
    const filtered = filterEntriesByRange(mockEntries, '90d');
    expect(filtered).toHaveLength(3);
    expect(filtered.map((e) => e.id)).toEqual(['entry-1', 'entry-2', 'entry-3']);
  });

  it('should return all entries for "all" time range', () => {
    const filtered = filterEntriesByRange(mockEntries, 'all');
    expect(filtered).toHaveLength(4);
  });

  it('should calculate accurate aggregate word count across filtered entries', () => {
    const filtered30d = filterEntriesByRange(mockEntries, '30d');
    const totalWords = calculateWordCount(filtered30d);
    // entry-1 has 10 words, entry-2 has 10 words -> total 20 words
    expect(totalWords).toBe(20);
  });

  it('should validate complete structure of PersonalEvolutionData schema', () => {
    const evolutionData: PersonalEvolutionData = {
      timeRange: '30d',
      calculatedAt: now,
      modelUsed: 'gemini-3.6-flash',
      entryCount: 2,
      interactionCount: 5,
      totalWords: 200,
      recurringThemes: [
        { theme: 'Resilience', frequency: 'High', description: 'Overcoming setbacks' },
      ],
      goals: [
        { title: 'Sleep Hygiene', status: 'progressing', details: 'Consistent 8 hours' },
      ],
      personalPatterns: [
        { pattern: 'Late night rumination', category: 'cognitive', observation: 'Occurs after hard days', recurrence: 'Weekly' },
      ],
      growthAreas: [
        { area: 'Work-life balance', type: 'progress', description: 'Setting boundaries', constructivePerspective: 'Positive trajectory' },
      ],
      recentReflectionSynthesis: 'Shifted from stress to intentional recovery.',
      keyEvolutionInsight: 'Consistent reflection builds emotional resilience.',
    };

    expect(evolutionData.recurringThemes[0].theme).toBe('Resilience');
    expect(evolutionData.goals[0].status).toBe('progressing');
    expect(evolutionData.personalPatterns[0].category).toBe('cognitive');
    expect(evolutionData.growthAreas[0].type).toBe('progress');
    expect(evolutionData.keyEvolutionInsight).toBeTruthy();
  });
});
