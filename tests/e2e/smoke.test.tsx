import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';

// Mock Firebase client library to isolate E2E smoke tests from real network/auth
vi.mock('../../src/lib/firebase', () => {
  return {
    auth: {},
    db: {},
    googleProvider: {},
    signInWithGoogle: vi.fn().mockResolvedValue({
      uid: 'e2e-smoke-user',
      email: 'smoke@example.com',
      displayName: 'Smoke Tester',
      photoURL: null,
    }),
    logOut: vi.fn().mockResolvedValue(undefined),
    subscribeToAuth: vi.fn().mockImplementation((callback) => {
      // Simulate authenticated user immediately
      callback({
        uid: 'e2e-smoke-user',
        email: 'smoke@example.com',
        displayName: 'Smoke Tester',
        photoURL: null,
      });
      return () => {};
    }),
    subscribeToUserEntries: vi.fn().mockImplementation((_uid, onData) => {
      onData([
        {
          id: 'entry-smoke-1',
          userId: 'e2e-smoke-user',
          title: 'Initial Smoke Entry',
          content: 'Testing workspace typing and interaction.',
          mood: 'Reflective',
          summary: '',
          tags: [],
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);
      return () => {};
    }),
    saveJournalEntry: vi.fn().mockResolvedValue(undefined),
    deleteJournalEntry: vi.fn().mockResolvedValue(undefined),
    subscribeToUserMemories: vi.fn().mockImplementation((_uid, onData) => {
      onData([
        {
          id: 'mem-smoke-1',
          userId: 'e2e-smoke-user',
          title: 'Smoke Memory Test',
          content: 'Validating memory vault cards.',
          category: 'Learning',
          createdAt: Date.now(),
        },
      ]);
      return () => {};
    }),
    saveMemory: vi.fn().mockResolvedValue(undefined),
    deleteMemory: vi.fn().mockResolvedValue(undefined),
    fetchCachedEvolution: vi.fn().mockResolvedValue(null),
    saveCachedEvolution: vi.fn().mockResolvedValue(undefined),
    fetchPastSelfConversation: vi.fn().mockResolvedValue([]),
    savePastSelfConversation: vi.fn().mockResolvedValue(undefined),
    clearPastSelfConversation: vi.fn().mockResolvedValue(undefined),
    sanitizePayload: (data: any) => data,
  };
});

describe('E2E Smoke Tests: Core Workflows & View Transitions', () => {
  beforeEach(() => {
    // Mock global fetch for API endpoints called inside dashboards
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/evolution')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              timeRange: '30d',
              calculatedAt: Date.now(),
              modelUsed: 'gemini-3.6-flash',
              entryCount: 1,
              interactionCount: 0,
              totalWords: 10,
              recurringThemes: [{ theme: 'Consistency', frequency: 'High', description: 'Testing consistency' }],
              goals: [{ title: 'Smoke Test Goal', status: 'active', details: 'Maintain stability' }],
              personalPatterns: [{ pattern: 'Morning routine', category: 'routine', observation: 'Daily entries', recurrence: 'Daily' }],
              growthAreas: [{ area: 'Focus', type: 'progress', description: 'Good progress', constructivePerspective: 'Positive' }],
              recentReflectionSynthesis: 'Overall steady progression.',
              keyEvolutionInsight: 'Consistent introspection fosters clarity.',
            },
          }),
        };
      }

      if (url.includes('/api/past-self')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            reply: 'Based on your reflection, you are exploring focus and rhythm.',
            referencedEntries: [{ id: 'entry-smoke-1', title: 'Initial Smoke Entry' }],
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ success: true }),
      };
    }) as any;
  });

  it('should boot the application and render Navbar, Sidebar, and Workspace without errors', async () => {
    render(<App />);

    // Check brand renders in Navbar
    expect(screen.getByLabelText('MindVault Home')).toBeDefined();

    // Check user profile name is displayed in Navbar
    expect(screen.getByText('Smoke Tester')).toBeDefined();

    // Wait for active journal workspace to be populated
    await waitFor(() => {
      expect(screen.getByText('Initial Smoke Entry')).toBeDefined();
    });
  });

  it('should allow typing into reflection workspace content', async () => {
    render(<App />);

    await waitFor(() => {
      expect(document.getElementById('textarea-journal-content')).toBeDefined();
    });

    const editorTextarea = document.getElementById('textarea-journal-content') as HTMLTextAreaElement;
    expect(editorTextarea).toBeDefined();

    fireEvent.change(editorTextarea, {
      target: { value: 'Today I observed a steady rhythm in my focus and execution.' },
    });

    expect(editorTextarea.value).toBe(
      'Today I observed a steady rhythm in my focus and execution.'
    );
  });

  it('should navigate smoothly between Journal, Past Self, Personal Evolution, and Memory Vault', async () => {
    render(<App />);

    // 1. Navigate to Past Self
    const pastSelfTab = document.getElementById('tab-nav-past-self')!;
    fireEvent.click(pastSelfTab);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Talk to Your Past Self/i })).toBeDefined();
    });

    // 2. Navigate to Personal Evolution
    const evolutionTab = document.getElementById('tab-nav-evolution')!;
    fireEvent.click(evolutionTab);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Personal Evolution/i })).toBeDefined();
    });

    // 3. Navigate to Memory Vault
    const memoryVaultTab = document.getElementById('tab-nav-memory-vault')!;
    fireEvent.click(memoryVaultTab);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Memory Vault/i })).toBeDefined();
    });

    // 4. Navigate back to Journal
    const journalTab = document.getElementById('tab-nav-journal')!;
    fireEvent.click(journalTab);
    await waitFor(() => {
      expect(screen.getByText('Initial Smoke Entry')).toBeDefined();
    });
  });
});
