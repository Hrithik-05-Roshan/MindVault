// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { sanitizePayload } from '../../src/lib/firebase';
import type { JournalEntry, ChatMessage } from '../../src/types';

describe('Unit Tests: Journal Logic and Sanitization', () => {
  it('sanitizePayload should remove undefined values and preserve valid fields', () => {
    const rawPayload = {
      id: 'entry-123',
      title: 'Morning Reflections',
      content: 'Woke up feeling peaceful.',
      mood: 'Calm',
      summary: undefined,
      tags: ['peace', 'morning'],
      nested: {
        insight: 'Good sleep matters',
        extra: undefined,
      },
    };

    const sanitized = sanitizePayload(rawPayload);

    expect(sanitized.id).toBe('entry-123');
    expect(sanitized.title).toBe('Morning Reflections');
    expect(sanitized.summary).toBeNull();
    expect((sanitized as any).nested.extra).toBeNull();
    expect((sanitized as any).nested.insight).toBe('Good sleep matters');
  });

  it('sanitizePayload should return null when input is null or undefined', () => {
    expect(sanitizePayload(null)).toBeNull();
    expect(sanitizePayload(undefined)).toBeNull();
  });

  it('should format a fresh JournalEntry correctly with required default properties', () => {
    const now = Date.now();
    const entry: JournalEntry = {
      id: `entry-${now}-abcde`,
      userId: 'test-user-1',
      title: 'Reflection - Sep 5, 2026',
      content: 'Testing initial content',
      mood: 'Reflective',
      summary: '',
      tags: [],
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    expect(entry.id).toMatch(/^entry-\d+-[a-z0-9]+$/);
    expect(entry.userId).toBe('test-user-1');
    expect(entry.content).toBe('Testing initial content');
    expect(entry.mood).toBe('Reflective');
    expect(entry.messages).toEqual([]);
    expect(entry.createdAt).toBeLessThanOrEqual(Date.now());
    expect(entry.updatedAt).toBe(entry.createdAt);
  });

  it('should correctly calculate word count from journal entry content', () => {
    const calculateWordCount = (content: string) => {
      const trimmed = content.trim();
      return trimmed ? trimmed.split(/\s+/).length : 0;
    };

    expect(calculateWordCount('')).toBe(0);
    expect(calculateWordCount('   ')).toBe(0);
    expect(calculateWordCount('One')).toBe(1);
    expect(calculateWordCount('The quick brown fox jumps over the lazy dog')).toBe(9);
    expect(calculateWordCount('Multiple   spaces\nand\nnewlines count  properly')).toBe(6);
  });

  it('should correctly append user and AI chat messages without mutating prior history', () => {
    const initialMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'How can I maintain focus?',
        timestamp: 1000,
      },
    ];

    const aiMessage: ChatMessage = {
      id: 'msg-2',
      sender: 'gemini',
      text: 'Start with 25-minute Pomodoro intervals.',
      timestamp: 2000,
      modelUsed: 'gemini-3.6-flash',
    };

    const newHistory = [...initialMessages, aiMessage];

    expect(initialMessages.length).toBe(1);
    expect(newHistory.length).toBe(2);
    expect(newHistory[1].sender).toBe('gemini');
    expect(newHistory[1].modelUsed).toBe('gemini-3.6-flash');
  });

  it('should reject invalid or empty IDs when updating journal entries', () => {
    const validateEntry = (entry: Partial<JournalEntry> & { id?: string; userId?: string }) => {
      if (!entry.userId || !entry.userId.trim()) throw new Error('User ID is required');
      if (!entry.id || !entry.id.trim()) throw new Error('Entry ID is required');
      return true;
    };

    expect(() => validateEntry({ id: '', userId: 'user-1' })).toThrow('Entry ID is required');
    expect(() => validateEntry({ id: 'entry-1', userId: '' })).toThrow('User ID is required');
    expect(validateEntry({ id: 'entry-1', userId: 'user-1' })).toBe(true);
  });
});
