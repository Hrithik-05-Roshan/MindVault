import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithGoogle,
  logOut,
  subscribeToAuth,
  subscribeToUserEntries,
  saveJournalEntry,
  deleteJournalEntry,
  subscribeToUserMemories,
  saveMemory,
  deleteMemory,
} from './lib/firebase';
import type { JournalEntry, ChatMessage, ReflectionMode, UserProfile, MemoryItem, ReflectionInsight } from './types';
import { AtmosphericBackground } from './components/AtmosphericBackground';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { HistorySidebar } from './components/HistorySidebar';
import { EntryWorkspace } from './components/EntryWorkspace';
import { PersonalEvolutionDashboard } from './components/PersonalEvolutionDashboard';
import { PastSelfChat } from './components/PastSelfChat';
import { MemoryVaultDashboard } from './components/MemoryVaultDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active navigation view
  const [currentView, setCurrentView] = useState<'journal' | 'evolution' | 'past_self' | 'memory_vault'>('journal');

  // Journal entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Memory Vault state
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  // Persistence status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);

  // AI Generation status
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [activeModelUsed, setActiveModelUsed] = useState<string | null>(null);

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user: User | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        setAuthError(null);
      } else {
        setCurrentUser(null);
        setEntries([]);
        setActiveEntry(null);
        setMemories([]);
      }
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user entries from Firestore when authenticated
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        // If no active entry is selected and entries exist, select the newest
        setActiveEntry((prev) => {
          if (!prev && fetchedEntries.length > 0) {
            return fetchedEntries[0];
          }
          // If previous active entry exists, sync it with latest Firestore data
          if (prev) {
            const found = fetchedEntries.find((e) => e.id === prev.id);
            if (found) return found;
          }
          return prev;
        });
      },
      (err) => {
        console.error('Failed to subscribe to entries:', err);
        setSaveError(err.message || 'Error syncing entries with Firestore');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Subscribe to user memories from Firestore when authenticated
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToUserMemories(
      currentUser.uid,
      (fetchedMemories) => {
        setMemories(fetchedMemories);
      },
      (err) => {
        console.error('Failed to subscribe to memories:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Memory Vault handlers
  const handleSaveMemory = async (memory: MemoryItem) => {
    if (!currentUser) return;
    await saveMemory(currentUser.uid, memory);
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!currentUser) return;
    await deleteMemory(currentUser.uid, memoryId);
  };

  // Handler: Google Sign-In
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      let errorMsg = 'Could not sign in with Google.';
      if (err.code === 'auth/popup-blocked') {
        errorMsg = 'Popup was blocked by your browser. Please allow popups or open the app in a new browser tab.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMsg = 'Sign-in was cancelled.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handler: Sign-Out
  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
      setActiveEntry(null);
      setEntries([]);
    } catch (err: any) {
      console.error('Error signing out:', err);
    }
  };

  // Helper: Create a fresh new reflection
  const handleCreateNewEntry = useCallback(() => {
    if (!currentUser) return;
    const now = Date.now();
    const formattedDate = new Date(now).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newEntry: JournalEntry = {
      id: `entry-${now}-${Math.random().toString(36).substring(2, 7)}`,
      userId: currentUser.uid,
      title: `Reflection - ${formattedDate}`,
      content: '',
      mood: 'Reflective',
      summary: '',
      tags: [],
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    setActiveEntry(newEntry);
    setCurrentView('journal');
    // Immediately persist new entry to Firestore
    saveJournalEntry(currentUser.uid, newEntry).catch((err) => {
      console.error('Error creating new entry in Firestore:', err);
      setSaveStatus('error');
      setSaveError(err.message);
    });
  }, [currentUser]);

  // Handler: Update entry fields in state and trigger debounced auto-save
  const handleUpdateEntry = useCallback(
    (updates: Partial<JournalEntry>) => {
      if (!activeEntry || !currentUser) return;

      const updated: JournalEntry = {
        ...activeEntry,
        ...updates,
        updatedAt: Date.now(),
      };

      setActiveEntry(updated);
      setSaveStatus('saving');
      setSaveError(null);

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          await saveJournalEntry(currentUser.uid, updated);
          setSaveStatus('saved');
        } catch (err: any) {
          console.error('Auto-save to Firestore failed:', err);
          setSaveStatus('error');
          setSaveError(err.message || 'Auto-save failed.');
        }
      }, 1000);
    },
    [activeEntry, currentUser]
  );

  // Handler: Explicit Save to Firestore
  const handleSaveToFirestore = async () => {
    if (!activeEntry || !currentUser) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatus('saving');
    setSaveError(null);
    try {
      await saveJournalEntry(currentUser.uid, activeEntry);
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Manual save failed:', err);
      setSaveStatus('error');
      setSaveError(err.message || 'Failed to save to Firestore.');
      throw err;
    }
  };

  // Handler: Delete an entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    try {
      await deleteJournalEntry(currentUser.uid, entryId);
      if (activeEntry?.id === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId);
        setActiveEntry(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      setSaveError(err.message || 'Failed to delete reflection.');
    }
  };

  // Handler: Send prompt to Gemini API with full Transaction Verification & Firestore persistence
  const handleSendGeminiPrompt = async (prompt: string, mode: ReflectionMode = 'conversation') => {
    if (!activeEntry || !currentUser || isAiGenerating) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: Date.now(),
    };

    const updatedMessages = [...activeEntry.messages, userMessage];
    const updatedEntryWithUserMsg: JournalEntry = {
      ...activeEntry,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    // 1. Guaranteed Transaction Verification: Persist User Message FIRST
    setActiveEntry(updatedEntryWithUserMsg);
    setSaveStatus('saving');
    try {
      await saveJournalEntry(currentUser.uid, updatedEntryWithUserMsg);
      setSaveStatus('saved');
    } catch (dbErr: any) {
      console.error('Failed to persist user message to Firestore:', dbErr);
      setSaveStatus('error');
      setSaveError('Could not save your message to Firestore. Check connection.');
      // Do not proceed with AI if database save fails
      throw dbErr;
    }

    // 2. Call server-side Gemini endpoint with resilient fallback
    setIsAiGenerating(true);
    try {
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          mode,
          history: activeEntry.messages,
          entryTitle: activeEntry.title,
          entryContent: activeEntry.content,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server error calling Gemini API.');
      }

      setActiveModelUsed(data.modelUsed || 'gemini-3.6-flash');

      const geminiMessage: ChatMessage = {
        id: `msg-gemini-${Date.now()}`,
        sender: 'gemini',
        text: data.reply,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
      };

      const finalMessages = [...updatedMessages, geminiMessage];
      const finalEntry: JournalEntry = {
        ...updatedEntryWithUserMsg,
        messages: finalMessages,
        updatedAt: Date.now(),
        // If mode was summarize, also store in summary field
        ...(mode === 'summarize' ? { summary: data.reply } : {}),
      };

      // 3. Guaranteed Transaction Verification: Persist AI response to Firestore
      setActiveEntry(finalEntry);
      await saveJournalEntry(currentUser.uid, finalEntry);
      setSaveStatus('saved');

      // 4. Non-critical enhancement: OPTIONAL INSIGHT GENERATION
      // Must NEVER prevent the original journal entry from being saved
      handleGenerateReflectionInsight(finalEntry).catch((insightErr) => {
        console.warn('Optional reflection insight generation failed in background:', insightErr);
      });
    } catch (aiErr: any) {
      console.error('Gemini interaction error:', aiErr);
      setSaveStatus('error');
      setSaveError(aiErr.message || 'Failed to generate response from Gemini API.');
      throw aiErr;
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handler: Generate Reflection Intelligence metadata (Theme, Key Insight, Goal, Pattern, Suggested Memory)
  const handleGenerateReflectionInsight = async (targetEntry?: JournalEntry) => {
    const entryToAnalyze = targetEntry || activeEntry;
    if (!entryToAnalyze || !currentUser) return;
    if (!entryToAnalyze.content.trim() && entryToAnalyze.messages.length === 0) return;

    setIsGeneratingInsight(true);
    try {
      const response = await fetch('/api/reflection-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryTitle: entryToAnalyze.title,
          entryContent: entryToAnalyze.content,
          recentMessages: entryToAnalyze.messages.slice(-4),
          priorContext: entries
            .filter((e) => e.id !== entryToAnalyze.id)
            .slice(0, 5)
            .map((e) => ({
              title: e.title,
              summary: e.summary,
              content: e.content.slice(0, 200),
            })),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.data?.insight) {
        const insight: ReflectionInsight = data.data.insight;
        const entryWithInsight: JournalEntry = {
          ...entryToAnalyze,
          reflectionInsight: insight,
          updatedAt: Date.now(),
        };

        setActiveEntry((prev) => (prev?.id === entryWithInsight.id ? entryWithInsight : prev));
        // Persist only the structured metadata to Firestore
        await saveJournalEntry(currentUser.uid, entryWithInsight);
      }
    } catch (err) {
      // Non-critical: failure must never break core journal flow
      console.warn('Failed to generate reflection insight:', err);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  // If initial auth is checking, show clean minimal loader
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-slate-200 relative overflow-hidden">
        <AtmosphericBackground />
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin z-10"></div>
        <p className="mt-4 text-xs font-mono-meta font-semibold text-slate-400 z-10">Loading secure environment...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#07090e] text-slate-100 selection:bg-violet-500/30 selection:text-violet-200 overflow-hidden relative font-sans-ui">
      {/* Ambient background styling */}
      <AtmosphericBackground />

      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isAuthenticating={isAuthenticating}
        onNewEntry={currentUser ? handleCreateNewEntry : undefined}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Main Screen Router */}
      {!currentUser ? (
        <div className="flex-1 overflow-y-auto relative z-10">
          <LandingView
            onSignIn={handleSignIn}
            isAuthenticating={isAuthenticating}
            authError={authError}
          />
        </div>
      ) : currentView === 'evolution' ? (
        <div className="flex-1 overflow-y-auto relative z-10">
          <PersonalEvolutionDashboard
            user={currentUser}
            entries={entries}
            onNavigateToJournal={() => setCurrentView('journal')}
            onNewEntry={() => {
              handleCreateNewEntry();
              setCurrentView('journal');
            }}
          />
        </div>
      ) : currentView === 'past_self' ? (
        <div className="flex-1 flex flex-col overflow-hidden relative z-10 p-3 sm:p-4">
          <PastSelfChat
            user={currentUser}
            entries={entries}
            onNavigateToJournal={() => setCurrentView('journal')}
            onSelectEntry={(entry) => {
              setActiveEntry(entry);
              setCurrentView('journal');
            }}
            onNewEntry={() => {
              handleCreateNewEntry();
              setCurrentView('journal');
            }}
          />
        </div>
      ) : currentView === 'memory_vault' ? (
        <div className="flex-1 overflow-y-auto relative z-10">
          <MemoryVaultDashboard
            user={currentUser}
            memories={memories}
            entries={entries}
            onSaveMemory={handleSaveMemory}
            onDeleteMemory={handleDeleteMemory}
            onNavigateToJournal={() => setCurrentView('journal')}
            onSelectEntry={(entry) => {
              setActiveEntry(entry);
              setCurrentView('journal');
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden p-3 sm:p-4 gap-4 relative z-10">
          {/* History Sidebar */}
          <HistorySidebar
            entries={entries}
            activeEntryId={activeEntry?.id || null}
            onSelectEntry={(entry) => setActiveEntry(entry)}
            onNewEntry={handleCreateNewEntry}
            onDeleteEntry={handleDeleteEntry}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Active Workspace */}
          {activeEntry ? (
            <EntryWorkspace
              entry={activeEntry}
              onUpdateEntry={handleUpdateEntry}
              onSaveToFirestore={handleSaveToFirestore}
              onSendGeminiPrompt={handleSendGeminiPrompt}
              saveStatus={saveStatus}
              saveError={saveError}
              onRetrySave={() => handleSaveToFirestore()}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              isAiGenerating={isAiGenerating}
              activeModelUsed={activeModelUsed}
              onSaveMemory={handleSaveMemory}
              currentUserId={currentUser.uid}
              isGeneratingInsight={isGeneratingInsight}
              onGenerateInsight={() => handleGenerateReflectionInsight()}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 text-slate-400 bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="text-lg font-display font-bold text-white">No reflection selected</h3>
              <p className="text-sm max-w-sm text-slate-400 font-sans">
                Create a new reflection or pick a previous entry from your history to start conversing with Gemini.
              </p>
              <button
                id="btn-workspace-create-first"
                onClick={handleCreateNewEntry}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer active:scale-95"
              >
                + Start Your First Reflection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
