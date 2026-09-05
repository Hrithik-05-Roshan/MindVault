import React, { useState } from 'react';
import { Sparkles, RefreshCw, Bookmark, Check, Compass, Target } from 'lucide-react';
import type { ReflectionInsight, MemoryCategory } from '../types';

interface ReflectionInsightSectionProps {
  insight?: ReflectionInsight;
  isGenerating?: boolean;
  onGenerateInsight?: () => void;
  onSaveSuggestedMemory: (memoryContent: string, theme: string, category?: MemoryCategory) => Promise<void>;
  isMemorySaved?: boolean;
}

export const ReflectionInsightSection: React.FC<ReflectionInsightSectionProps> = ({
  insight,
  isGenerating = false,
  onGenerateInsight,
  onSaveSuggestedMemory,
  isMemorySaved = false,
}) => {
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [hasSavedLocally, setHasSavedLocally] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleConfirmSave = async () => {
    if (!insight?.suggestedMemory) return;
    setIsSavingMemory(true);
    try {
      await onSaveSuggestedMemory(
        insight.suggestedMemory,
        insight.theme || 'Personal Principle',
        insight.suggestedMemoryCategory || 'Principle'
      );
      setHasSavedLocally(true);
      setIsConfirmingSave(false);
    } catch (err) {
      console.error('Failed to save memory to vault:', err);
      alert('Could not save memory to vault. Please try again.');
    } finally {
      setIsSavingMemory(false);
    }
  };

  // If no insight yet and not generating
  if (!insight && !isGenerating) {
    return (
      <div
        id="reflection-insight-empty-banner"
        className="bg-[#101420]/80 border border-white/[0.08] rounded-2xl p-4 mb-3.5 flex items-center justify-between backdrop-blur-md"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-display font-bold text-white tracking-wide">Reflection Intelligence</h4>
            <p className="text-[11px] text-slate-400">
              Synthesize themes, key insights, detected goals, and memory suggestions.
            </p>
          </div>
        </div>
        {onGenerateInsight && (
          <button
            id="btn-trigger-reflection-insight"
            onClick={onGenerateInsight}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold border border-white/[0.12] shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Compass className="w-3.5 h-3.5 text-violet-400" />
            <span>Generate Insight</span>
          </button>
        )}
      </div>
    );
  }

  // If generating without existing insight
  if (isGenerating && !insight) {
    return (
      <div
        id="reflection-insight-loading-banner"
        className="bg-violet-950/40 border border-violet-500/30 rounded-2xl p-4 mb-3.5 flex items-center space-x-3 text-violet-200 backdrop-blur-md"
      >
        <RefreshCw className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-bold text-white">Synthesizing Reflection Intelligence...</p>
          <p className="text-[11px] text-slate-400">
            Analyzing themes, recurring patterns, and enduring takeaways.
          </p>
        </div>
      </div>
    );
  }

  if (!insight) return null;

  const memoryAlreadySaved = isMemorySaved || hasSavedLocally;

  return (
    <div
      id="reflection-insight-container"
      className="bg-[#0f131f]/90 rounded-2xl border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.3)] mb-4 overflow-hidden transition-all backdrop-blur-xl"
    >
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-[#141926]/80 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-lg bg-violet-950/70 border border-violet-500/40 flex items-center justify-center text-violet-300">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="text-xs font-display font-bold text-white tracking-wide">Reflection Intelligence</span>
          {isGenerating && (
            <span className="inline-flex items-center space-x-1 text-[10px] font-medium text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-500/30">
              <RefreshCw className="w-2.5 h-2.5 animate-spin text-violet-400" />
              <span>Updating...</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onGenerateInsight && (
            <button
              id="btn-refresh-reflection-insight"
              disabled={isGenerating}
              onClick={onGenerateInsight}
              title="Re-analyze reflection for updated insights"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40"
              aria-label="Refresh reflection insight"
            >
              <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            id="btn-toggle-collapse-insight"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer px-1.5 py-0.5 rounded"
          >
            {isCollapsed ? 'Show Details' : 'Hide'}
          </button>
        </div>
      </div>

      {/* Content Body */}
      {!isCollapsed && (
        <div className="p-4 space-y-3.5">
          {/* Grid of structured insight elements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* THEME */}
            <div id="insight-item-theme" className="bg-[#141824]/80 rounded-xl p-3 border border-white/[0.06] space-y-1">
              <span className="text-[10px] font-mono-meta font-bold uppercase tracking-wider text-violet-400">Theme</span>
              <p className="text-xs font-semibold text-slate-200">{insight.theme}</p>
            </div>

            {/* GOAL DETECTED */}
            <div id="insight-item-goal" className="bg-[#141824]/80 rounded-xl p-3 border border-white/[0.06] space-y-1">
              <span className="text-[10px] font-mono-meta font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                <Target className="w-2.5 h-2.5" />
                <span>Goal Detected</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{insight.goalDetected}</p>
            </div>
          </div>

          {/* KEY INSIGHT */}
          <div id="insight-item-key-insight" className="bg-[#141824]/80 rounded-xl p-3 border border-white/[0.06] space-y-1">
            <span className="text-[10px] font-mono-meta font-bold uppercase tracking-wider text-amber-400">Key Insight</span>
            <p className="text-xs text-slate-300 leading-relaxed">{insight.keyInsight}</p>
          </div>

          {/* RECURRING PATTERN */}
          <div id="insight-item-recurring-pattern" className="bg-[#141824]/80 rounded-xl p-3 border border-white/[0.06] space-y-1">
            <span className="text-[10px] font-mono-meta font-bold uppercase tracking-wider text-cyan-400">Recurring Pattern</span>
            <p className="text-xs text-slate-300 leading-relaxed">{insight.recurringPattern}</p>
          </div>

          {/* SUGGESTED MEMORY & SAVE ACTION */}
          <div
            id="insight-item-suggested-memory"
            className="bg-gradient-to-br from-violet-950/30 to-indigo-950/20 rounded-xl p-3.5 border border-violet-500/30 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-meta font-bold uppercase tracking-wider text-violet-300 flex items-center space-x-1">
                <Bookmark className="w-2.5 h-2.5" />
                <span>Suggested Memory</span>
              </span>
              {insight.suggestedMemoryCategory && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-meta font-bold bg-violet-950/60 text-violet-300 border border-violet-500/30">
                  {insight.suggestedMemoryCategory}
                </span>
              )}
            </div>

            <p className="font-editorial italic text-sm sm:text-base text-slate-100 font-normal leading-relaxed">
              "{insight.suggestedMemory}"
            </p>

            {/* Explicit Confirmation Interaction for Saving to Vault */}
            <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
              <span className="text-[10px] font-mono-meta text-slate-400">
                Enduring memory candidate
              </span>

              <div>
                {memoryAlreadySaved ? (
                  <span
                    id="badge-memory-vault-saved"
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved to Memory Vault</span>
                  </span>
                ) : isConfirmingSave ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-300">Confirm save to vault?</span>
                    <button
                      id="btn-confirm-save-vault-no"
                      onClick={() => setIsConfirmingSave(false)}
                      disabled={isSavingMemory}
                      className="px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-save-vault-yes"
                      onClick={handleConfirmSave}
                      disabled={isSavingMemory}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 flex items-center space-x-1 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSavingMemory ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Confirm & Save</span>
                    </button>
                  </div>
                ) : (
                  <button
                    id="btn-save-to-memory-vault"
                    onClick={() => setIsConfirmingSave(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 text-xs font-semibold border border-white/[0.12] shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Bookmark className="w-3 h-3 text-violet-400" />
                    <span>Save to Memory Vault</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
