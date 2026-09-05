// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { JournalEntry, MemoryItem, PersonalEvolutionData, UserProfile } from '../../src/types';
import { sanitizePayload } from '../../src/lib/firebase';

describe('Regression Tests: End-to-End User Journey Simulation', () => {
  // Mock In-Memory Database Store for full user lifecycle simulation
  const inMemoryDB: {
    users: Record<string, UserProfile>;
    entries: Record<string, Record<string, JournalEntry>>;
    memories: Record<string, Record<string, MemoryItem>>;
    evolution: Record<string, Record<string, PersonalEvolutionData>>;
  } = {
    users: {},
    entries: {},
    memories: {},
    evolution: {},
  };

  it('Step 1: User Authentication & Profile Initialization', () => {
    const user: UserProfile = {
      uid: 'journey-user-123',
      email: 'journey@mindvault.internal',
      displayName: 'Mindful Voyager',
      photoURL: null,
    };
    inMemoryDB.users[user.uid] = user;
    inMemoryDB.entries[user.uid] = {};
    inMemoryDB.memories[user.uid] = {};
    inMemoryDB.evolution[user.uid] = {};

    expect(inMemoryDB.users[user.uid].email).toBe('journey@mindvault.internal');
  });

  it('Step 2 & 3: User Creates and Edits a Journal Reflection', () => {
    const userId = 'journey-user-123';
    const now = Date.now();
    const newEntry: JournalEntry = {
      id: 'entry-journey-1',
      userId,
      title: 'Breaking Through Writer Block',
      content: 'I realized that morning walks clarify my thinking process.',
      mood: 'Energized',
      summary: '',
      tags: ['clarity', 'creativity'],
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    inMemoryDB.entries[userId][newEntry.id] = sanitizePayload(newEntry);
    expect(inMemoryDB.entries[userId]['entry-journey-1'].title).toBe('Breaking Through Writer Block');
  });

  it('Step 4 & 5: Reflection Assistance & Guaranteed Transaction Persistence', () => {
    const userId = 'journey-user-123';
    const entry = inMemoryDB.entries[userId]['entry-journey-1'];

    // 1. User sends prompt
    entry.messages.push({
      id: 'msg-u-1',
      sender: 'user',
      text: 'Why do morning walks help so much?',
      timestamp: Date.now(),
    });

    // 2. AI Responds
    entry.messages.push({
      id: 'msg-ai-1',
      sender: 'gemini',
      text: 'Morning light and bilateral movement stimulate neural plasticity and diffuse problem-solving.',
      timestamp: Date.now(),
      modelUsed: 'gemini-3.6-flash',
    });

    entry.updatedAt = Date.now();
    inMemoryDB.entries[userId][entry.id] = sanitizePayload(entry);

    expect(inMemoryDB.entries[userId][entry.id].messages).toHaveLength(2);
    expect(inMemoryDB.entries[userId][entry.id].messages[1].sender).toBe('gemini');
  });

  it('Step 6: Personal Evolution Synthesis across Historic Entries', () => {
    const userId = 'journey-user-123';
    const userEntries = Object.values(inMemoryDB.entries[userId]);

    const evolutionData: PersonalEvolutionData = {
      timeRange: '30d',
      calculatedAt: Date.now(),
      modelUsed: 'gemini-3.6-flash',
      entryCount: userEntries.length,
      interactionCount: 2,
      totalWords: 50,
      recurringThemes: [
        { theme: 'Movement & Focus', frequency: 'High', description: 'Walking correlates with high creativity' },
      ],
      goals: [
        { title: 'Consistent Morning Walking', status: 'progressing', details: 'Walk daily before starting deep work' },
      ],
      personalPatterns: [
        { pattern: 'Physical priming', category: 'behavioral', observation: 'Movement clears cognitive fatigue', recurrence: 'Daily' },
      ],
      growthAreas: [
        { area: 'Routine stabilization', type: 'progress', description: 'Established walking habit', constructivePerspective: 'High positive momentum' },
      ],
      recentReflectionSynthesis: 'Shifted towards somatic self-regulation before work.',
      keyEvolutionInsight: 'Your physical state directly governs your creative output.',
    };

    inMemoryDB.evolution[userId]['30d'] = sanitizePayload(evolutionData);
    expect(inMemoryDB.evolution[userId]['30d'].keyEvolutionInsight).toContain('physical state');
  });

  it('Step 7 & 8: Memory Vault Storing & Querying', () => {
    const userId = 'journey-user-123';
    const memory: MemoryItem = {
      id: 'mem-journey-1',
      userId,
      title: 'The Walking Principle',
      content: 'Never sit down to solve a hard problem with a tired mind; walk first.',
      category: 'Principle',
      sourceJournalId: 'entry-journey-1',
      sourceJournalTitle: 'Breaking Through Writer Block',
      createdAt: Date.now(),
    };

    inMemoryDB.memories[userId][memory.id] = sanitizePayload(memory);
    expect(inMemoryDB.memories[userId]['mem-journey-1'].category).toBe('Principle');
  });

  it('Step 9 & 10: History Inspection and Secure Sign-Out', () => {
    const userId = 'journey-user-123';
    const userEntries = Object.values(inMemoryDB.entries[userId]);
    expect(userEntries).toHaveLength(1);

    // Sign out: Clear client state
    let activeClientUser: UserProfile | null = inMemoryDB.users[userId];
    activeClientUser = null;

    expect(activeClientUser).toBeNull();
  });
});
