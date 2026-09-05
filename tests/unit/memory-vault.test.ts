// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { MemoryItem, MemoryCategory } from '../../src/types';
import { sanitizePayload } from '../../src/lib/firebase';

describe('Unit Tests: Memory Vault Categorization & Filtering', () => {
  const validCategories: MemoryCategory[] = [
    'Goal',
    'Project',
    'Learning',
    'Personal Insight',
    'Important Decision',
    'Principle',
  ];

  const mockMemories: MemoryItem[] = [
    {
      id: 'mem-1',
      userId: 'user-1',
      title: 'Run a Half Marathon',
      content: 'Train 3x a week with progressive mileage.',
      category: 'Goal',
      createdAt: 1000,
    },
    {
      id: 'mem-2',
      userId: 'user-1',
      title: 'MindVault Application',
      content: 'Built resilient personal evolution journal with Gemini.',
      category: 'Project',
      createdAt: 2000,
    },
    {
      id: 'mem-3',
      userId: 'user-1',
      title: 'Rest is not lost time',
      content: 'Recovery accelerates subsequent cognitive endurance.',
      category: 'Personal Insight',
      createdAt: 3000,
    },
    {
      id: 'mem-4',
      userId: 'user-1',
      title: 'Consistency over intensity',
      content: 'Small daily steps compound into life-changing mastery.',
      category: 'Principle',
      createdAt: 4000,
    },
  ];

  function filterMemories(
    memories: MemoryItem[],
    selectedCategory: string | null,
    searchQuery: string
  ): MemoryItem[] {
    return memories.filter((item) => {
      const matchesCategory =
        !selectedCategory || selectedCategory === 'All' || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }

  it('should recognize all 6 valid MemoryCategories', () => {
    expect(validCategories).toHaveLength(6);
    expect(validCategories).toContain('Personal Insight');
    expect(validCategories).toContain('Important Decision');
  });

  it('should filter memories by category accurately', () => {
    const goals = filterMemories(mockMemories, 'Goal', '');
    expect(goals).toHaveLength(1);
    expect(goals[0].title).toBe('Run a Half Marathon');

    const insights = filterMemories(mockMemories, 'Personal Insight', '');
    expect(insights).toHaveLength(1);
    expect(insights[0].id).toBe('mem-3');
  });

  it('should filter memories by freeform search query across title and content', () => {
    const searchRes = filterMemories(mockMemories, null, 'compound');
    expect(searchRes).toHaveLength(1);
    expect(searchRes[0].title).toBe('Consistency over intensity');
  });

  it('should return empty list when search query does not match any items', () => {
    const searchRes = filterMemories(mockMemories, null, 'non-existent-keyword-xyz');
    expect(searchRes).toHaveLength(0);
  });

  it('should sanitize MemoryItem payload before Firestore write', () => {
    const rawMemory = {
      id: 'mem-5',
      userId: 'user-1',
      title: 'Healthy Boundaries',
      content: 'Say no to low-priority requests.',
      category: 'Principle' as MemoryCategory,
      sourceJournalId: undefined,
      createdAt: Date.now(),
      updatedAt: undefined,
    };

    const sanitized = sanitizePayload(rawMemory);
    expect(sanitized.id).toBe('mem-5');
    expect(sanitized.sourceJournalId).toBeNull();
    expect(sanitized.updatedAt).toBeNull();
  });
});
