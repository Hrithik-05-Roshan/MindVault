import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingView } from '../../src/components/LandingView';
import { Navbar } from '../../src/components/Navbar';
import { HistorySidebar } from '../../src/components/HistorySidebar';
import type { UserProfile, JournalEntry } from '../../src/types';

describe('Frontend Component Tests', () => {
  const mockUser: UserProfile = {
    uid: 'test-uid-123',
    email: 'user@example.com',
    displayName: 'Mindful User',
    photoURL: null,
  };

  const mockEntries: JournalEntry[] = [
    {
      id: 'entry-1',
      userId: 'test-uid-123',
      title: 'Morning Clarity',
      content: 'Reflecting on morning goals.',
      mood: 'Calm',
      summary: 'Morning reflection',
      tags: ['peace'],
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'entry-2',
      userId: 'test-uid-123',
      title: 'Overcoming Friction',
      content: 'Faced a challenging bug and solved it.',
      mood: 'Energized',
      summary: 'Problem solved',
      tags: ['code'],
      messages: [],
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 10000,
    },
  ];

  describe('LandingView Component', () => {
    it('should render welcoming display copy and Google Sign-In button', () => {
      const onSignIn = vi.fn();
      render(<LandingView onSignIn={onSignIn} isAuthenticating={false} authError={null} />);

      expect(screen.getByText(/MindVault/i)).toBeDefined();
      const signInBtn = screen.getByRole('button', { name: /Continue with Google/i });
      expect(signInBtn).toBeDefined();

      fireEvent.click(signInBtn);
      expect(onSignIn).toHaveBeenCalledTimes(1);
    });

    it('should display auth error banner when authError is present', () => {
      render(
        <LandingView
          onSignIn={vi.fn()}
          isAuthenticating={false}
          authError="Google sign-in popup was blocked."
        />
      );

      expect(screen.getByText(/Google sign-in popup was blocked/i)).toBeDefined();
    });
  });

  describe('Navbar Component', () => {
    it('should render navigation links and user controls when signed in', () => {
      const onViewChange = vi.fn();
      const onNewEntry = vi.fn();
      const onSignOut = vi.fn();

      render(
        <Navbar
          user={mockUser}
          onSignIn={vi.fn()}
          onSignOut={onSignOut}
          isAuthenticating={false}
          currentView="journal"
          onViewChange={onViewChange}
          onNewEntry={onNewEntry}
        />
      );

      // Verify Navigation Tabs by id or getAllByText
      expect(document.getElementById('tab-nav-journal')).toBeDefined();
      expect(document.getElementById('tab-nav-past-self')).toBeDefined();
      expect(document.getElementById('tab-nav-evolution')).toBeDefined();
      expect(document.getElementById('tab-nav-memory-vault')).toBeDefined();

      // Verify User Display Name
      expect(screen.getByText('Mindful User')).toBeDefined();

      // Click on Past Self tab
      const pastSelfTab = document.getElementById('tab-nav-past-self')!;
      fireEvent.click(pastSelfTab);
      expect(onViewChange).toHaveBeenCalledWith('past_self');
    });

    it('should render sign in button when user is unauthenticated', () => {
      const onSignIn = vi.fn();
      render(
        <Navbar
          user={null}
          onSignIn={onSignIn}
          onSignOut={vi.fn()}
          isAuthenticating={false}
          currentView="journal"
          onViewChange={vi.fn()}
        />
      );

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      expect(signInButton).toBeDefined();
      fireEvent.click(signInButton);
      expect(onSignIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('HistorySidebar Component', () => {
    it('should render list of reflections and handle selection', () => {
      const onSelectEntry = vi.fn();
      const onNewEntry = vi.fn();
      const onDeleteEntry = vi.fn();

      render(
        <HistorySidebar
          entries={mockEntries}
          activeEntryId="entry-1"
          onSelectEntry={onSelectEntry}
          onNewEntry={onNewEntry}
          onDeleteEntry={onDeleteEntry}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Morning Clarity')).toBeDefined();
      expect(screen.getByText('Overcoming Friction')).toBeDefined();

      // Click on second entry
      fireEvent.click(screen.getByText('Overcoming Friction'));
      expect(onSelectEntry).toHaveBeenCalledWith(mockEntries[1]);
    });

    it('should filter reflection entries via search input', () => {
      render(
        <HistorySidebar
          entries={mockEntries}
          activeEntryId={null}
          onSelectEntry={vi.fn()}
          onNewEntry={vi.fn()}
          onDeleteEntry={vi.fn()}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search past thoughts/i);
      fireEvent.change(searchInput, { target: { value: 'Friction' } });

      expect(screen.getByText('Overcoming Friction')).toBeDefined();
      expect(screen.queryByText('Morning Clarity')).toBeNull();
    });
  });
});
