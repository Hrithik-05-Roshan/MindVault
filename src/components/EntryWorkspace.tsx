import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Save,
  Check,
  AlertCircle,
  Brain,
  MessageSquare,
  FileText,
  Columns,
  RefreshCw,
  Lightbulb,
  Tag,
  Menu,
  Flame,
  ArrowRight,
  Bookmark,
  MapPin,
} from 'lucide-react';
import type {
  JournalEntry,
  ReflectionMode,
  MemoryItem,
  MemorySuggestion,
  MemoryCategory,
  JournalLocation,
} from '../types';
import { ReflectionInsightSection } from './ReflectionInsightSection';
import { LocationSearchModal } from './LocationSearchModal';

interface EntryWorkspaceProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: Partial<JournalEntry>) => void;
  onSaveToFirestore: () => Promise<void>;
  onSendGeminiPrompt: (prompt: string, mode?: ReflectionMode) => Promise<void>;
  saveStatus: 'saved' | 'saving' | 'error';
  saveError: string | null;
  onRetrySave: () => void;
  onOpenSidebar: () => void;
  isAiGenerating: boolean;
  activeModelUsed: string | null;
  onSaveMemory?: (memory: MemoryItem) => Promise<void>;
  currentUserId?: string;
  isGeneratingInsight?: boolean;
  onGenerateInsight?: () => void;
}

const MOOD_OPTIONS = [
  { label: 'Reflective' },
  { label: 'Grateful' },
  { label: 'Calm' },
  { label: 'Focused' },
  { label: 'Challenged' },
  { label: 'Inspired' },
];

const PROMPT_STARTERS = [
  'What is the deeper emotional root of this feeling?',
  'Help me reframe this challenge into a constructive growth opportunity.',
  'Brainstorm 3 creative, low-pressure steps I can take next.',
  'Extract the core themes and provide an executive reflection summary.',
];

export const EntryWorkspace: React.FC<EntryWorkspaceProps> = ({
  entry,
  onUpdateEntry,
  onSaveToFirestore,
  onSendGeminiPrompt,
  saveStatus,
  saveError,
  onRetrySave,
  onOpenSidebar,
  isAiGenerating,
  activeModelUsed,
  onSaveMemory,
  currentUserId,
  isGeneratingInsight = false,
  onGenerateInsight,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'journal' | 'chat'>('split');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat stream
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entry.messages, isAiGenerating]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isAiGenerating) return;

    try {
      setChatInput('');
      await onSendGeminiPrompt(trimmed, 'conversation');
    } catch (err) {
      setChatInput(trimmed);
    }
  };

  const handleQuickAction = async (prompt: string, mode: ReflectionMode) => {
    if (isAiGenerating) return;
    await onSendGeminiPrompt(prompt, mode);
  };

  // AI Memory Suggestions State & Handlers
  const [memorySuggestions, setMemorySuggestions] = useState<MemorySuggestion[]>([]);
  const [isScanningMemories, setIsScanningMemories] = useState(false);
  const [savedMemorySuggestionIds, setSavedMemorySuggestionIds] = useState<string[]>([]);
  const [memoryScanNotification, setMemoryScanNotification] = useState<string | null>(null);

  const handleScanForMemories = async () => {
    if ((!entry.content || !entry.content.trim()) && (!entry.title || !entry.title.trim())) {
      setMemoryScanNotification('Please write some thoughts before scanning for memories.');
      return;
    }

    setIsScanningMemories(true);
    setMemoryScanNotification(null);

    try {
      const res = await fetch('/api/suggest-memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryTitle: entry.title,
          entryContent: entry.content,
          entryId: entry.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data?.suggestions)) {
        const suggestions: MemorySuggestion[] = data.data.suggestions;
        if (suggestions.length === 0) {
          setMemoryScanNotification('No enduring memory patterns identified in this entry.');
        } else {
          setMemorySuggestions(suggestions);
          setMemoryScanNotification(`Identified ${suggestions.length} potential memory candidate${suggestions.length === 1 ? '' : 's'}.`);
        }
      } else {
        setMemoryScanNotification('Could not extract memories at this moment.');
      }
    } catch (err) {
      console.warn('Could not scan for memories:', err);
      setMemoryScanNotification('Error connecting to memory scanner.');
    } finally {
      setIsScanningMemories(false);
    }
  };

  const handleSaveMemorySuggestion = async (suggestion: MemorySuggestion) => {
    if (!onSaveMemory || !currentUserId) return;
    try {
      const mem: MemoryItem = {
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: currentUserId,
        title: suggestion.title,
        content: suggestion.content,
        category: suggestion.category,
        sourceJournalId: entry.id,
        sourceJournalTitle: entry.title || 'Untitled Reflection',
        createdAt: Date.now(),
      };
      await onSaveMemory(mem);
      setSavedMemorySuggestionIds((prev) => [...prev, suggestion.id]);
    } catch (err) {
      console.error('Failed to save memory suggestion:', err);
      alert('Could not save memory to Memory Vault. Please try again.');
    }
  };

  const handleDismissMemorySuggestion = (id: string) => {
    setMemorySuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveSuggestedMemory = async (
    content: string,
    theme: string,
    category?: MemoryCategory
  ) => {
    if (!onSaveMemory || !currentUserId) return;
    const mem: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: currentUserId,
      title: theme || 'Personal Insight',
      content,
      category: category || 'Principle',
      sourceJournalId: entry.id,
      sourceJournalTitle: entry.title || 'Untitled Reflection',
      createdAt: Date.now(),
    };
    await onSaveMemory(mem);
  };

  const wordCount = (entry.content || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // Derive reflection sentiment display
  const getSentimentInfo = (mood?: string) => {
    switch (mood) {
      case 'Grateful':
      case 'Inspired':
        return { label: 'Positive', detail: 'Uplifting & Motivated', percent: 88, color: 'bg-emerald-400' };
      case 'Calm':
      case 'Focused':
        return { label: 'Balanced', detail: 'Grounded & Centered', percent: 75, color: 'bg-cyan-400' };
      case 'Challenged':
        return { label: 'Processing', detail: 'Constructive Reflection', percent: 58, color: 'bg-rose-400' };
      default:
        return { label: 'Reflective', detail: 'Neutral-Positive Leaning', percent: 72, color: 'bg-violet-400' };
    }
  };

  const sentiment = getSentimentInfo(entry.mood);

  return (
    <div className="flex-1 flex flex-col h-full text-slate-100 overflow-hidden">
      {/* Top Header Bento Card */}
      <div className="bg-[#0e111a]/85 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/[0.08] shadow-xl p-3.5 sm:p-4 mb-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Mobile menu toggle & Title Input */}
        <div className="flex items-center space-x-3 flex-1 min-w-[260px]">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white border border-white/[0.08] cursor-pointer"
            title="Open past reflections"
            aria-label="Open past reflections sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <input
            id="input-entry-title"
            type="text"
            value={entry.title}
            onChange={(e) => onUpdateEntry({ title: e.target.value })}
            placeholder="Reflection Title..."
            className="flex-1 bg-transparent font-editorial text-xl sm:text-2xl font-normal text-white placeholder-slate-500 focus:outline-hidden border-b border-transparent focus:border-violet-500/60 transition-colors py-0.5 tracking-tight"
          />
        </div>

        {/* Mood Selector, Status & Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Mood picker */}
          <div className="flex items-center space-x-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-entry-mood"
              value={entry.mood || 'Reflective'}
              onChange={(e) => onUpdateEntry({ mood: e.target.value })}
              className="bg-transparent text-slate-200 font-semibold text-xs focus:outline-hidden cursor-pointer pr-1"
            >
              {MOOD_OPTIONS.map((m) => (
                <option key={m.label} value={m.label} className="bg-[#121622] text-slate-200">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Location Anchor / Selector */}
          {entry.location ? (
            <div className="flex items-center space-x-1.5 bg-violet-950/40 border border-violet-500/40 rounded-xl px-2.5 py-1.5 text-xs text-violet-200">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <button
                id="btn-change-location"
                onClick={() => setIsLocationModalOpen(true)}
                title={`Location: ${entry.location.placeName}. Click to change.`}
                className="font-semibold text-xs text-slate-200 hover:text-white truncate max-w-[110px] sm:max-w-[150px] cursor-pointer"
              >
                {entry.location.placeName}
              </button>
              <button
                id="btn-remove-location"
                onClick={() => onUpdateEntry({ location: undefined })}
                className="text-slate-400 hover:text-rose-300 ml-1 cursor-pointer font-bold"
                title="Remove location"
                aria-label="Remove location"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              id="btn-add-location"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center space-x-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Anchor this reflection to a physical location (optional)"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Add Location</span>
            </button>
          )}

          {/* View Mode Toggles */}
          <div className="hidden md:flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('journal')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'journal'
                  ? 'bg-white/[0.12] text-white shadow-xs font-bold border border-white/[0.12]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              <span>Journal</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white/[0.12] text-white shadow-xs font-bold border border-white/[0.12]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-amber-400" />
              <span>Bento</span>
            </button>
            <button
              onClick={() => setViewMode('chat')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'chat'
                  ? 'bg-white/[0.12] text-white shadow-xs font-bold border border-white/[0.12]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dialogue</span>
            </button>
          </div>

          {/* Save Status & Manual Save button */}
          <div className="flex items-center space-x-2">
            {saveStatus === 'saving' && (
              <span className="text-xs text-violet-400 font-medium flex items-center space-x-1 font-mono-meta">
                <RefreshCw className="w-3 h-3 animate-spin text-violet-400" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1 font-mono-meta">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <button
                onClick={onRetrySave}
                className="text-xs text-rose-300 hover:text-rose-200 font-medium flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/80 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Retry Save</span>
              </button>
            )}

            <button
              id="btn-manual-save"
              onClick={() => onSaveToFirestore()}
              disabled={saveStatus === 'saving'}
              title="Save current state to Cloud Firestore"
              className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-slate-800" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert Banner if Firestore Persistence Failed */}
      {saveError && (
        <div className="bg-rose-950/80 border border-rose-800 rounded-2xl px-4 py-2.5 mb-3 text-xs text-rose-200 flex items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Persistence notice: {saveError}. Your input is safely preserved in local buffer.</span>
          </div>
          <button
            onClick={onRetrySave}
            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-500 transition-colors shrink-0 cursor-pointer"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Bento Main Grid Container */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bento Column: Journal Entry Card */}
        <div
          className={`bg-[#0f121a]/85 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden transition-all ${
            viewMode === 'chat'
              ? 'hidden'
              : viewMode === 'journal'
              ? 'col-span-12 h-full'
              : 'col-span-12 lg:col-span-4 h-full'
          }`}
        >
          {/* Quick AI Assist Bar */}
          <div className="p-3 border-b border-white/[0.07] bg-[#131722]/80 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
            <span className="text-xs font-mono-meta font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>AI Tools</span>
            </span>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                id="btn-ai-summarize"
                disabled={isAiGenerating || !entry.content.trim()}
                onClick={() =>
                  handleQuickAction(
                    'Please summarize my journal entry, highlighting key themes and emotional insights.',
                    'summarize'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 font-semibold text-xs flex items-center space-x-1.5 transition-colors border border-white/[0.08] disabled:opacity-40 cursor-pointer"
              >
                <FileText className="w-3 h-3 text-violet-400" />
                <span>Summarize</span>
              </button>

              <button
                id="btn-ai-brainstorm"
                disabled={isAiGenerating || !entry.content.trim()}
                onClick={() =>
                  handleQuickAction(
                    'Based on my reflection, brainstorm 3-5 creative angles, alternative viewpoints, and actionable steps.',
                    'brainstorm'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 font-semibold text-xs flex items-center space-x-1.5 transition-colors border border-white/[0.08] disabled:opacity-40 cursor-pointer"
              >
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Brainstorm</span>
              </button>

              <button
                id="btn-scan-entry-memories"
                disabled={isScanningMemories || (!entry.content.trim() && !entry.title.trim())}
                onClick={handleScanForMemories}
                className="px-2.5 py-1 rounded-lg bg-violet-950/40 hover:bg-violet-900/50 text-violet-300 font-semibold text-xs flex items-center space-x-1.5 transition-colors border border-violet-500/30 disabled:opacity-40 cursor-pointer"
                title="Identify enduring goals, decisions, and principles for Memory Vault"
              >
                <Bookmark className={`w-3 h-3 text-violet-400 ${isScanningMemories ? 'animate-spin' : ''}`} />
                <span>{isScanningMemories ? 'Extracting...' : 'Extract Memories'}</span>
              </button>

              <button
                id="btn-scan-entry-reflection-insight"
                disabled={isGeneratingInsight || (!entry.content.trim() && entry.messages.length === 0)}
                onClick={onGenerateInsight}
                className="px-2.5 py-1 rounded-lg bg-violet-950/40 hover:bg-violet-900/50 text-violet-300 font-semibold text-xs flex items-center space-x-1.5 transition-colors border border-violet-500/30 disabled:opacity-40 cursor-pointer"
                title="Synthesize structured Reflection Intelligence (Themes, Key Insight, Goals, Patterns, Suggested Memory)"
              >
                <Sparkles className={`w-3 h-3 text-violet-400 ${isGeneratingInsight ? 'animate-spin' : ''}`} />
                <span>{isGeneratingInsight ? 'Analyzing...' : entry.reflectionInsight ? 'Reflection Insight' : 'Analyze Insight'}</span>
              </button>
            </div>
          </div>

          {memoryScanNotification && (
            <div className="px-3.5 py-2 bg-violet-950/60 border-b border-violet-500/30 text-xs text-violet-200 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span>{memoryScanNotification}</span>
              </span>
              <button
                onClick={() => setMemoryScanNotification(null)}
                className="text-violet-400 hover:text-white font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Text Area */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col">
            <textarea
              id="textarea-journal-content"
              value={entry.content}
              onChange={(e) => onUpdateEntry({ content: e.target.value })}
              placeholder="Start pouring out your reflections, thoughts, or daily experiences here..."
              className="flex-1 w-full bg-transparent resize-none text-slate-100 placeholder-slate-500 focus:outline-hidden text-sm sm:text-base leading-relaxed font-sans"
            />

            {/* If in Journal-only view, render Reflection Insight if present */}
            {viewMode === 'journal' && (entry.reflectionInsight || isGeneratingInsight) && (
              <div className="mb-4">
                <ReflectionInsightSection
                  insight={entry.reflectionInsight}
                  isGenerating={isGeneratingInsight}
                  onGenerateInsight={onGenerateInsight}
                  onSaveSuggestedMemory={handleSaveSuggestedMemory}
                />
              </div>
            )}

            {/* Word count footer */}
            <div className="pt-3 border-t border-white/[0.06] text-xs text-slate-500 flex items-center justify-between shrink-0 font-mono-meta">
              <span className="font-medium">
                {wordCount} {wordCount === 1 ? 'word' : 'words'} • {entry.content?.length || 0} chars
              </span>
              <span className="text-emerald-400 font-semibold text-[11px]">Isolated in Firestore</span>
            </div>
          </div>
        </div>

        {/* Bento Column: Gemini Dialogue Card */}
        <div
          className={`bg-[#0f121a]/85 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden transition-all ${
            viewMode === 'journal'
              ? 'hidden'
              : viewMode === 'chat'
              ? 'col-span-12 h-full'
              : 'col-span-12 lg:col-span-5 h-full'
          }`}
        >
          {/* Header of Dialogue */}
          <div className="p-4 border-b border-white/[0.07] bg-[#131722]/80 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-300">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-display font-bold text-white tracking-wide">
                Gemini AI Reflection
              </span>
              {activeModelUsed && (
                <span className="text-[10px] font-mono-meta font-semibold px-2 py-0.5 rounded-full bg-violet-950/60 text-violet-300 border border-violet-500/30">
                  {activeModelUsed}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono-meta font-medium">
              {entry.messages.length} {entry.messages.length === 1 ? 'interaction' : 'interactions'}
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Reflection Intelligence Section */}
            <ReflectionInsightSection
              insight={entry.reflectionInsight}
              isGenerating={isGeneratingInsight}
              onGenerateInsight={onGenerateInsight}
              onSaveSuggestedMemory={handleSaveSuggestedMemory}
            />

            {/* AI-Assisted Memory Suggestions Panel */}
            {memorySuggestions.length > 0 && (
              <div className="bg-gradient-to-br from-violet-950/40 to-indigo-950/30 border border-violet-500/30 rounded-2xl p-4 space-y-3 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-display font-bold text-white tracking-wide">
                      AI-Assisted Memory Suggestion{memorySuggestions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => setMemorySuggestions([])}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Dismiss all
                  </button>
                </div>

                <div className="space-y-2.5">
                  {memorySuggestions.map((sug) => {
                    const isSaved = savedMemorySuggestionIds.includes(sug.id);
                    return (
                      <div
                        key={sug.id}
                        className="bg-[#141926]/90 rounded-xl border border-white/[0.08] p-3.5 shadow-md space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-meta font-bold bg-violet-950/60 text-violet-300 border border-violet-500/30">
                            {sug.category}
                          </span>
                          <span className="text-[10px] font-mono-meta text-slate-500">Long-term Insight</span>
                        </div>
                        <h5 className="text-xs font-bold text-white">{sug.title}</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">{sug.content}</p>
                        {sug.reasoning && (
                          <p className="text-[11px] text-violet-300 bg-violet-950/40 p-2 rounded-lg italic border border-violet-500/20 font-editorial">
                            "{sug.reasoning}"
                          </p>
                        )}
                        <div className="pt-1 flex items-center justify-end space-x-2">
                          {!isSaved ? (
                            <>
                              <button
                                onClick={() => handleDismissMemorySuggestion(sug.id)}
                                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleSaveMemorySuggestion(sug)}
                                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer active:scale-95"
                              >
                                <Check className="w-3 h-3" />
                                <span>Save to Memory Vault</span>
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                              <span>Saved to Memory Vault</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {entry.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="max-w-xs space-y-1">
                  <h4 className="text-sm font-display font-bold text-white">Ready to reflect together</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Write your thoughts in the journal, then converse with Gemini to explore deeper perspectives.
                  </p>
                </div>

                {/* Prompt Starters */}
                <div className="w-full max-w-sm space-y-2 pt-1 text-left">
                  <span className="text-[10px] font-mono-meta font-bold text-slate-500 uppercase tracking-widest">
                    Suggested Prompts:
                  </span>
                  {PROMPT_STARTERS.map((promptText, i) => (
                    <button
                      key={i}
                      disabled={isAiGenerating}
                      onClick={() => handleQuickAction(promptText, 'conversation')}
                      className="w-full p-3 rounded-xl bg-[#131722]/80 border border-white/[0.06] text-xs font-medium text-slate-300 hover:text-white hover:bg-[#181e2b] hover:border-violet-500/40 transition-all text-left disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              entry.messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1.5 max-w-[88%] ${
                      isUser ? 'self-start items-start' : 'self-end items-end'
                    }`}
                  >
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#181d2a] border border-white/[0.08] text-slate-200 rounded-tl-none shadow-sm'
                          : 'bg-gradient-to-br from-[#181628] to-[#151c2e] border border-violet-500/30 text-slate-100 rounded-tr-none shadow-[0_4px_25px_rgba(139,92,246,0.12)]'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="markdown-body">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-mono-meta font-medium px-1 ${
                        isUser ? 'text-slate-500' : 'text-violet-400'
                      }`}
                    >
                      {isUser
                        ? new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Gemini AI • Just now'}
                    </span>
                  </div>
                );
              })
            )}

            {/* In-Flight Generation Indicator */}
            {isAiGenerating && (
              <div className="flex flex-col gap-1.5 max-w-[85%] self-end items-end">
                <div className="p-4 bg-violet-950/40 border border-violet-500/30 text-violet-200 rounded-2xl rounded-tr-none shadow-lg space-y-2 backdrop-blur-md">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-violet-300">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-violet-400" />
                    <span>Gemini is reflecting...</span>
                  </div>
                  <div className="flex items-center space-x-1.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"></span>
                    <span
                      className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></span>
                    <span
                      className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Follow-up Chips */}
          {entry.messages.length > 0 && (
            <div className="px-4 py-2 bg-[#121622]/80 border-t border-white/[0.06] flex items-center space-x-2 overflow-x-auto text-[11px] no-scrollbar shrink-0">
              <span className="text-slate-500 font-mono-meta font-semibold text-[10px] uppercase shrink-0">
                Follow-up:
              </span>
              <button
                disabled={isAiGenerating}
                onClick={() =>
                  handleQuickAction(
                    'What is a practical, compassionate action I can take next?',
                    'conversation'
                  )
                }
                className="px-3 py-1 rounded-full bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.1] hover:border-violet-400/40 whitespace-nowrap transition-colors border border-white/[0.08] font-medium shadow-xs disabled:opacity-40 cursor-pointer"
              >
                + Practical Action
              </button>
              <button
                disabled={isAiGenerating}
                onClick={() =>
                  handleQuickAction(
                    'How can I look at this situation through a lens of self-compassion?',
                    'conversation'
                  )
                }
                className="px-3 py-1 rounded-full bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.1] hover:border-violet-400/40 whitespace-nowrap transition-colors border border-white/[0.08] font-medium shadow-xs disabled:opacity-40 cursor-pointer"
              >
                + Self-Compassion Reframe
              </button>
            </div>
          )}

          {/* Chat Input Field */}
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 sm:p-4 bg-[#11141e]/90 border-t border-white/[0.07] relative shrink-0"
          >
            <div className="relative">
              <input
                id="input-chat-message"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Reflect further with Gemini..."
                disabled={isAiGenerating}
                className="w-full pl-5 pr-12 py-3.5 bg-[#090b11] border border-white/[0.08] rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all shadow-inner disabled:opacity-50"
              />
              <button
                id="btn-send-message"
                type="submit"
                disabled={!chatInput.trim() || isAiGenerating}
                title="Send to Gemini"
                className="absolute right-2 top-2 p-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Bento Column: Analytics & Suggestion Cards */}
        <div
          className={`flex flex-col gap-4 overflow-y-auto ${
            viewMode !== 'split' ? 'hidden' : 'col-span-12 lg:col-span-3 h-full'
          }`}
        >
          {/* Bento Card 1: Sentiment Card */}
          <div className="bg-[#0f121a]/85 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl p-5 flex flex-col justify-between shrink-0 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-xs font-mono-meta font-bold text-slate-400 uppercase tracking-widest">
                Sentiment
              </h4>
              <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div>
              <p className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                {sentiment.label}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium font-sans">
                {sentiment.detail}
              </p>
            </div>

            <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full ${sentiment.color} transition-all duration-500`}
                style={{ width: `${sentiment.percent}%` }}
              ></div>
            </div>
          </div>

          {/* Bento Card 2: AI Suggestion Card */}
          <div className="bg-gradient-to-br from-[#161a29] to-[#1e1732] border border-violet-500/30 text-white rounded-3xl shadow-[0_4px_25px_rgba(139,92,246,0.15)] p-5 flex flex-col justify-between relative overflow-hidden shrink-0 space-y-3">
            <div className="relative z-10">
              <h4 className="text-xs font-mono-meta font-bold text-violet-300 uppercase tracking-widest">
                AI Suggestion
              </h4>
              <p className="text-sm mt-3 font-medium leading-relaxed text-slate-200 font-sans">
                {entry.summary
                  ? entry.summary.slice(0, 140) + '...'
                  : "Explore the concept of 'Time Boxing' or 'Mindful Pausing' in your next entry to tackle task branching."}
              </p>
            </div>

            {/* Decorative background watermark */}
            <div className="absolute -right-4 -bottom-4 opacity-5 text-white pointer-events-none">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L1 21h22L12 2zm0 3.45l8.27 14.3H3.73L12 5.45z" />
              </svg>
            </div>

            <div className="relative z-10 pt-1">
              <button
                disabled={isAiGenerating}
                onClick={() =>
                  handleQuickAction(
                    "Can you suggest a focused 5-minute exercise based on my reflection?",
                    "brainstorm"
                  )
                }
                className="text-xs font-bold text-violet-300 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>Explore exercise</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bento Card 3: Momentum & Streak Combined Card */}
          <div className="bg-[#0f121a]/85 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl p-5 flex flex-col justify-between shrink-0 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono-meta font-bold text-slate-400 uppercase tracking-widest">
                  Reflection Momentum
                </h4>
                <span className="text-[10px] font-mono-meta font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  +14% this week
                </span>
              </div>

              {/* Momentum bars */}
              <div className="flex items-end gap-2 h-14 pt-1">
                <div className="flex-1 bg-violet-950/60 rounded-t-lg" style={{ height: '40%' }}></div>
                <div className="flex-1 bg-violet-800/60 rounded-t-lg" style={{ height: '65%' }}></div>
                <div className="flex-1 bg-violet-950/60 rounded-t-lg" style={{ height: '30%' }}></div>
                <div className="flex-1 bg-violet-600/70 rounded-t-lg" style={{ height: '85%' }}></div>
                <div className="flex-1 bg-violet-500 rounded-t-lg shadow-[0_0_10px_rgba(139,92,246,0.3)]" style={{ height: '100%' }}></div>
                <div className="flex-1 bg-violet-800/60 rounded-t-lg" style={{ height: '50%' }}></div>
                <div className="flex-1 bg-white/[0.05] rounded-t-lg" style={{ height: '25%' }}></div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-mono-meta font-bold text-slate-400 uppercase tracking-wider">
                    Daily Streak
                  </p>
                  <p className="text-sm font-display font-bold text-white">5 Days</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-mono-meta font-bold text-slate-400 uppercase tracking-wider">
                  Total
                </p>
                <p className="text-sm font-mono-meta font-bold text-violet-400">{wordCount} words</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal: Associate Location */}
      <LocationSearchModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={entry.location}
        onSelectLocation={(loc) => {
          onUpdateEntry({ location: loc });
        }}
      />
    </div>
  );
};
