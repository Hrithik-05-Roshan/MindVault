import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  Compass,
  Clock,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type {
  JournalEntry,
  PersonalEvolutionData,
  EvolutionTimeRange,
  UserProfile,
} from '../types';
import { fetchCachedEvolution, saveCachedEvolution } from '../lib/firebase';

interface PersonalEvolutionDashboardProps {
  user: UserProfile;
  entries: JournalEntry[];
  onNavigateToJournal: () => void;
  onNewEntry: () => void;
}

export const PersonalEvolutionDashboard: React.FC<PersonalEvolutionDashboardProps> = ({
  user,
  entries,
  onNavigateToJournal,
  onNewEntry,
}) => {
  const [timeRange, setTimeRange] = useState<EvolutionTimeRange>('30d');
  const [evolutionData, setEvolutionData] = useState<PersonalEvolutionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);

  // Filter entries based on the selected time range
  const filteredEntries = useMemo(() => {
    const now = Date.now();
    const rangeInMs: Record<EvolutionTimeRange, number> = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      all: Infinity,
    };

    const cutoff = now - rangeInMs[timeRange];
    return entries.filter((e) => e.createdAt >= cutoff);
  }, [entries, timeRange]);

  // Compute local quick metrics
  const quickStats = useMemo(() => {
    const count = filteredEntries.length;
    const totalWords = filteredEntries.reduce((acc, e) => {
      return acc + (e.content ? e.content.trim().split(/\s+/).filter(Boolean).length : 0);
    }, 0);
    const totalInteractions = filteredEntries.reduce(
      (acc, e) => acc + (Array.isArray(e.messages) ? e.messages.length : 0),
      0
    );

    // Unique days reflected
    const uniqueDays = new Set(
      filteredEntries.map((e) => new Date(e.createdAt).toDateString())
    ).size;

    return {
      count,
      totalWords,
      totalInteractions,
      uniqueDays,
    };
  }, [filteredEntries]);

  // Fetch or trigger analysis for the active time range
  const loadAnalysis = useCallback(
    async (forceRefresh = false) => {
      if (!user?.uid) return;

      if (filteredEntries.length === 0) {
        setEvolutionData(null);
        setErrorMessage(null);
        return;
      }

      setErrorMessage(null);
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        // 1. Check Firestore Cache first if not forcing refresh
        if (!forceRefresh) {
          const cached = await fetchCachedEvolution(user.uid, timeRange);
          if (cached && cached.entryCount > 0) {
            setEvolutionData(cached);
            setIsCached(true);
            setIsLoading(false);
            return;
          }
        }

        // 2. Call backend Gemini endpoint
        const response = await fetch('/api/evolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeRange,
            entries: filteredEntries.map((e) => ({
              id: e.id,
              title: e.title,
              content: e.content,
              mood: e.mood,
              createdAt: e.createdAt,
              messagesCount: e.messages?.length || 0,
            })),
          }),
        });

        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Failed to synthesize evolution analysis.');
        }

        const freshData: PersonalEvolutionData = json.data;
        setEvolutionData(freshData);
        setIsCached(false);

        // 3. Persist to Firestore cache
        await saveCachedEvolution(user.uid, freshData);
      } catch (err: any) {
        console.error('Error in Personal Evolution:', err);
        setErrorMessage(
          err.message || 'An error occurred while analyzing your reflections. Please try again.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.uid, timeRange, filteredEntries]
  );

  // Trigger analysis load when timeRange changes
  useEffect(() => {
    loadAnalysis(false);
  }, [loadAnalysis]);

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 max-w-7xl mx-auto w-full space-y-6">
      {/* Editorial Header & Timeframe Switcher */}
      <div className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-950/60 text-violet-300 border border-violet-500/30">
                <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                <span className="font-mono-meta">Intelligence Engine</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-mono-meta">Isolated to your journal</span>
              </span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-white tracking-tight font-normal">
              Personal Evolution
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed font-sans">
              Track how your mindset, recurring themes, and personal goals have transformed over
              time—distilled strictly from your private reflections.
            </p>
          </div>

          {/* Time Range Selector & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="inline-flex p-1 bg-white/[0.04] rounded-2xl border border-white/[0.08] text-xs font-medium">
              {(
                [
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: '90d', label: '90 Days' },
                  { id: 'all', label: 'All Time' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  id={`btn-timerange-${tab.id}`}
                  onClick={() => setTimeRange(tab.id)}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer font-sans ${
                    timeRange === tab.id
                      ? 'bg-white/[0.12] text-white font-bold shadow-xs border border-white/[0.12]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              id="btn-refresh-evolution"
              onClick={() => loadAnalysis(true)}
              disabled={isLoading || isRefreshing || filteredEntries.length === 0}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-40 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95"
              title="Re-run Gemini synthesis on your reflections"
            >
              <RotateCw
                className={`w-3.5 h-3.5 text-slate-800 ${isRefreshing || isLoading ? 'animate-spin' : ''}`}
              />
              <span>{isRefreshing ? 'Analyzing...' : 'Refresh Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-mono-meta">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 font-medium text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {filteredEntries.length} reflection{filteredEntries.length === 1 ? '' : 's'} in
                window
              </span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center space-x-1.5 font-medium text-slate-300">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{quickStats.totalWords.toLocaleString()} total words</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center space-x-1.5 font-medium text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{quickStats.uniqueDays} active days</span>
            </span>
          </div>

          {evolutionData && (
            <div className="flex items-center space-x-2">
              {isCached && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 font-medium text-[11px] border border-white/[0.08]">
                  Cached in Firestore
                </span>
              )}
              {evolutionData.modelUsed && (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-violet-950/60 text-violet-300 font-medium text-[11px] border border-violet-500/30">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span>{evolutionData.modelUsed}</span>
                </span>
              )}
              <span className="text-slate-500 text-[11px]">
                Updated {new Date(evolutionData.calculatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner if any */}
      {errorMessage && (
        <div className="bg-rose-950/80 border border-rose-800 rounded-2xl p-4 flex items-start justify-between text-rose-200 text-sm backdrop-blur-md">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Analysis Unavailable</p>
              <p className="text-xs text-rose-300 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => loadAnalysis(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State: 0 Entries in Timeframe */}
      {filteredEntries.length === 0 ? (
        <div className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-12 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-display font-bold text-white">
            No reflections recorded in this timeframe
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed font-sans">
            Personal Evolution synthesizes insights strictly from your authenticated journal entries.
            Write a new reflection or broaden your timeframe to begin seeing your trajectory.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              id="btn-evolution-empty-new-entry"
              onClick={onNewEntry}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95"
            >
              + Write New Reflection
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.08] text-xs font-semibold transition-colors cursor-pointer"
            >
              View All Time
            </button>
          </div>
        </div>
      ) : isLoading ? (
        /* Loading Skeleton */
        <div className="space-y-6">
          <div className="bg-[#0e121c]/90 rounded-3xl border border-white/[0.08] p-8 shadow-xl space-y-4 animate-pulse">
            <div className="h-4 bg-white/[0.08] rounded-md w-36"></div>
            <div className="h-8 bg-white/[0.04] rounded-lg w-3/4"></div>
            <div className="h-4 bg-white/[0.04] rounded-md w-full"></div>
            <div className="h-4 bg-white/[0.04] rounded-md w-5/6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0e121c]/90 rounded-3xl border border-white/[0.08] p-6 h-64 animate-pulse"></div>
            <div className="bg-[#0e121c]/90 rounded-3xl border border-white/[0.08] p-6 h-64 animate-pulse"></div>
          </div>
        </div>
      ) : evolutionData ? (
        /* Bento Grid of Personal Evolution Modules */
        <div className="space-y-6">
          {/* Module 1: Key Evolution Insight (Editorial Hero Card) */}
          <div className="bg-gradient-to-br from-[#121625] via-[#16142a] to-[#0f111d] text-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(139,92,246,0.12)] border border-violet-500/30 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Brain className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10 space-y-4 max-w-3xl">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                <span className="text-xs font-mono-meta font-bold uppercase tracking-wider text-violet-300">
                  Key Evolution Insight
                </span>
              </div>
              <blockquote className="font-editorial italic text-xl sm:text-2xl md:text-3xl font-normal tracking-tight leading-relaxed text-slate-100">
                "{evolutionData.keyEvolutionInsight}"
              </blockquote>
              <p className="text-xs font-mono-meta text-slate-400 pt-2">
                Synthesized across {evolutionData.entryCount} reflection
                {evolutionData.entryCount === 1 ? '' : 's'} and {evolutionData.interactionCount}{' '}
                dialogues with Gemini.
              </p>
            </div>
          </div>

          {/* Module 2: Recent Reflection Synthesis */}
          <div className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-6 sm:p-8 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-violet-400" />
                <h2 className="text-base font-display font-bold text-white tracking-tight">Recent Reflection Synthesis</h2>
              </div>
              <span className="text-xs font-mono-meta text-slate-500">Trajectory & Mindset</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {evolutionData.recentReflectionSynthesis}
            </p>
          </div>

          {/* Module 3 & 4: Two-column Bento: Goals Matrix & Recurring Themes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals Matrix */}
            <div className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  <h2 className="text-base font-display font-bold text-white">Identified Goals</h2>
                </div>
                <span className="text-xs font-mono-meta font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                  {evolutionData.goals.length} tracked
                </span>
              </div>

              {evolutionData.goals.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center font-sans">
                  No specific goals detected in this timeframe yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {evolutionData.goals.map((goal, idx) => {
                    const statusConfig = {
                      progressing: {
                        bg: 'bg-emerald-950/60',
                        text: 'text-emerald-400',
                        border: 'border-emerald-500/30',
                        label: 'Progressing',
                        icon: CheckCircle2,
                      },
                      unresolved: {
                        bg: 'bg-amber-950/60',
                        text: 'text-amber-400',
                        border: 'border-amber-500/30',
                        label: 'Unresolved',
                        icon: AlertCircle,
                      },
                      achieved: {
                        bg: 'bg-violet-950/60',
                        text: 'text-violet-300',
                        border: 'border-violet-500/30',
                        label: 'Achieved',
                        icon: CheckCircle2,
                      },
                    }[goal.status] || {
                      bg: 'bg-white/[0.04]',
                      text: 'text-slate-300',
                      border: 'border-white/[0.08]',
                      label: goal.status,
                      icon: HelpCircle,
                    };

                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#131724]/70 border border-white/[0.06] space-y-2 hover:bg-[#161b2a] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-200">{goal.title}</h4>
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono-meta font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} shrink-0`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusConfig.label}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">{goal.details}</p>
                        {goal.evolutionNote && (
                          <p className="text-[11px] text-slate-400 italic bg-white/[0.03] p-2 rounded-xl border border-white/[0.04] font-editorial">
                            Evolution: {goal.evolutionNote}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recurring Themes */}
            <div className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-violet-400" />
                  <h2 className="text-base font-display font-bold text-white">Recurring Themes</h2>
                </div>
                <span className="text-xs font-mono-meta font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                  {evolutionData.recurringThemes.length} themes
                </span>
              </div>

              {evolutionData.recurringThemes.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center font-sans">
                  No recurring themes detected yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {evolutionData.recurringThemes.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#131724]/70 border border-white/[0.06] space-y-1.5 hover:bg-[#161b2a] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-200">{item.theme}</h4>
                        <div className="flex items-center space-x-1.5">
                          {item.moodAssociation && (
                            <span className="text-[10px] font-mono-meta px-2 py-0.5 rounded-full bg-violet-950/60 text-violet-300 border border-violet-500/30">
                              {item.moodAssociation}
                            </span>
                          )}
                          <span className="text-[10px] font-mono-meta font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 uppercase tracking-wider border border-white/[0.06]">
                            {item.frequency}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Module 5 & 6: Two-column Bento: Personal Patterns & Growth Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Patterns */}
            <div className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  <h2 className="text-base font-display font-bold text-white">Personal Patterns</h2>
                </div>
                <span className="text-xs font-mono-meta text-slate-500">Cognitive & Behavioral</span>
              </div>

              {evolutionData.personalPatterns.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center font-sans">
                  Patterns will emerge as you add more reflections.
                </p>
              ) : (
                <div className="space-y-3">
                  {evolutionData.personalPatterns.map((pat, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#131724]/70 border border-white/[0.06] space-y-1.5 hover:bg-[#161b2a] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-200">{pat.pattern}</h4>
                        <span className="text-[10px] font-mono-meta font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                          {pat.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">{pat.observation}</p>
                      <p className="text-[11px] font-mono-meta text-slate-500">
                        Recurrence: <span className="font-semibold text-slate-300">{pat.recurrence}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Growth Areas */}
            <div className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-violet-400" />
                  <h2 className="text-base font-display font-bold text-white">Growth Areas</h2>
                </div>
                <span className="text-xs font-mono-meta text-slate-500">Strengths & Frontiers</span>
              </div>

              {evolutionData.growthAreas.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center font-sans">
                  No specific growth areas highlighted yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {evolutionData.growthAreas.map((area, idx) => {
                    const badge = {
                      progress: {
                        bg: 'bg-emerald-950/60',
                        text: 'text-emerald-400',
                        border: 'border-emerald-500/30',
                        label: 'Progress',
                      },
                      uncertainty: {
                        bg: 'bg-violet-950/60',
                        text: 'text-violet-300',
                        border: 'border-violet-500/30',
                        label: 'Uncertainty',
                      },
                      repeated_difficulty: {
                        bg: 'bg-rose-950/60',
                        text: 'text-rose-400',
                        border: 'border-rose-500/30',
                        label: 'Repeated Difficulty',
                      },
                    }[area.type] || {
                      bg: 'bg-white/[0.04]',
                      text: 'text-slate-300',
                      border: 'border-white/[0.08]',
                      label: area.type,
                    };

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#131724]/70 border border-white/[0.06] space-y-2 hover:bg-[#161b2a] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-200">{area.area}</h4>
                          <span
                            className={`text-[10px] font-mono-meta font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">{area.description}</p>
                        {area.constructivePerspective && (
                          <div className="text-[11px] text-slate-300 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06] flex items-start space-x-2 font-sans">
                            <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                            <span>{area.constructivePerspective}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Return to Journal CTA */}
          <div className="bg-[#0e121c]/80 border border-white/[0.08] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-display font-bold text-white">Ready to reflect on today?</h4>
              <p className="text-xs text-slate-400 font-sans">
                Every reflection directly refines your Personal Evolution trajectory.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                id="btn-evolution-footer-new-entry"
                onClick={onNewEntry}
                className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95"
              >
                + New Reflection
              </button>
              <button
                id="btn-evolution-footer-to-journal"
                onClick={onNavigateToJournal}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] text-xs font-semibold transition-colors cursor-pointer"
              >
                Go to Journal Workspace
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
