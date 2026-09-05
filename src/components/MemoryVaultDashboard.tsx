import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Sparkles,
  Plus,
  Search,
  Trash2,
  Edit3,
  BookOpen,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Filter,
  Lightbulb,
  Target,
  Compass,
  Layers,
  FolderGit2,
  GraduationCap,
  Scale,
} from 'lucide-react';
import type {
  MemoryItem,
  MemoryCategory,
  MemorySuggestion,
  JournalEntry,
  UserProfile,
} from '../types';

interface MemoryVaultDashboardProps {
  user: UserProfile;
  memories: MemoryItem[];
  entries: JournalEntry[];
  onSaveMemory: (memory: MemoryItem) => Promise<void>;
  onDeleteMemory: (memoryId: string) => Promise<void>;
  onNavigateToJournal: () => void;
  onSelectEntry?: (entry: JournalEntry) => void;
}

const CATEGORIES: { label: MemoryCategory; icon: any; color: string; bg: string }[] = [
  { label: 'Goal', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-500/30' },
  { label: 'Project', icon: FolderGit2, color: 'text-violet-300', bg: 'bg-violet-950/60 border-violet-500/30' },
  { label: 'Learning', icon: GraduationCap, color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-500/30' },
  { label: 'Personal Insight', icon: Lightbulb, color: 'text-purple-300', bg: 'bg-purple-950/60 border-purple-500/30' },
  { label: 'Important Decision', icon: Scale, color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-500/30' },
  { label: 'Principle', icon: Compass, color: 'text-sky-400', bg: 'bg-sky-950/60 border-sky-500/30' },
];

export const MemoryVaultDashboard: React.FC<MemoryVaultDashboardProps> = ({
  user,
  memories,
  entries,
  onSaveMemory,
  onDeleteMemory,
  onNavigateToJournal,
  onSelectEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | null>(null);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<MemoryCategory>('Goal');
  const [formSourceId, setFormSourceId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState<MemorySuggestion[]>([]);
  const [isScanningAi, setIsScanningAi] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [savingSuggestionId, setSavingSuggestionId] = useState<string | null>(null);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('Goal');
    setFormSourceId(entries.length > 0 ? entries[0].id : '');
    setFormError(null);
    setActiveModal('create');
  };

  // Open Edit Modal
  const handleOpenEdit = (memory: MemoryItem) => {
    setEditingMemory(memory);
    setFormTitle(memory.title);
    setFormContent(memory.content);
    setFormCategory(memory.category);
    setFormSourceId(memory.sourceJournalId || '');
    setFormError(null);
    setActiveModal('edit');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingMemory(null);
    setFormError(null);
  };

  // Submit Modal
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleTrimmed = formTitle.trim();
    const contentTrimmed = formContent.trim();

    if (!titleTrimmed) {
      setFormError('Memory title is required.');
      return;
    }
    if (!contentTrimmed) {
      setFormError('Memory content is required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const sourceEntry = entries.find((e) => e.id === formSourceId);

      const memoryPayload: MemoryItem = {
        id: editingMemory ? editingMemory.id : `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: user.uid,
        title: titleTrimmed,
        content: contentTrimmed,
        category: formCategory,
        sourceJournalId: formSourceId || undefined,
        sourceJournalTitle: sourceEntry?.title || undefined,
        createdAt: editingMemory ? editingMemory.createdAt : Date.now(),
        updatedAt: editingMemory ? Date.now() : undefined,
      };

      await onSaveMemory(memoryPayload);
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving memory:', err);
      setFormError(err.message || 'Failed to save memory to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  // Scan Recent Entries with AI
  const handleScanEntriesForMemories = async () => {
    if (entries.length === 0) {
      setScanMessage('Write at least one reflection to scan for long-term memories.');
      return;
    }

    setIsScanningAi(true);
    setScanMessage(null);

    try {
      const latestEntry = entries[0];
      const otherEntries = entries.slice(1, 12).map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content,
      }));

      const res = await fetch('/api/suggest-memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryTitle: latestEntry.title,
          entryContent: latestEntry.content,
          entryId: latestEntry.id,
          priorEntries: otherEntries,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to scan for memories.');
      }

      const suggestions: MemorySuggestion[] = json.data.suggestions || [];
      if (suggestions.length === 0) {
        setScanMessage('No new enduring memory patterns identified in your recent entries.');
      } else {
        setAiSuggestions(suggestions);
        setScanMessage(`Found ${suggestions.length} potential long-term memory candidate${suggestions.length === 1 ? '' : 's'}. Review below.`);
      }
    } catch (err: any) {
      console.error('Failed to scan for memories:', err);
      setScanMessage(err.message || 'Error running AI memory scan.');
    } finally {
      setIsScanningAi(false);
    }
  };

  // Accept and Save AI Suggestion
  const handleSaveSuggestion = async (suggestion: MemorySuggestion) => {
    setSavingSuggestionId(suggestion.id);
    try {
      const newMemory: MemoryItem = {
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: user.uid,
        title: suggestion.title,
        content: suggestion.content,
        category: suggestion.category,
        sourceJournalId: suggestion.sourceJournalId,
        sourceJournalTitle: suggestion.sourceJournalTitle,
        createdAt: Date.now(),
      };

      await onSaveMemory(newMemory);
      // Remove from suggestions list once saved
      setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    } catch (err: any) {
      console.error('Failed to save suggestion:', err);
      alert('Could not save memory. Please check your connection.');
    } finally {
      setSavingSuggestionId(null);
    }
  };

  const handleDismissSuggestion = (id: string) => {
    setAiSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  // Filtered Memories
  const filteredMemories = useMemo(() => {
    return memories.filter((mem) => {
      const matchesCategory =
        selectedCategory === 'All' || mem.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        mem.title.toLowerCase().includes(q) ||
        mem.content.toLowerCase().includes(q) ||
        (mem.sourceJournalTitle && mem.sourceJournalTitle.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [memories, selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: memories.length };
    CATEGORIES.forEach((c) => {
      counts[c.label] = 0;
    });
    memories.forEach((m) => {
      if (counts[m.category] !== undefined) {
        counts[m.category] += 1;
      }
    });
    return counts;
  }, [memories]);

  const getCategoryMeta = (cat: MemoryCategory) => {
    const found = CATEGORIES.find((c) => c.label === cat);
    return (
      found || {
        label: cat,
        icon: Bookmark,
        color: 'text-violet-300',
        bg: 'bg-violet-950/60 border-violet-500/30',
      }
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 max-w-6xl mx-auto w-full space-y-6">
      {/* Editorial Header Bento Card */}
      <div className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-950/60 text-violet-300 border border-violet-500/30">
                <Bookmark className="w-3.5 h-3.5 text-violet-400" />
                <span className="font-mono-meta">Private Long-Term Vault</span>
              </span>
              <span className="text-xs text-slate-400 font-mono-meta font-medium">
                {memories.length} item{memories.length === 1 ? '' : 's'} preserved
              </span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-normal text-white tracking-tight">
              Memory Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
              Curate your enduring goals, core principles, valuable learnings, and strategic decisions.
              MindVault retains these insights to ground your ongoing reflections and personal growth.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            <button
              id="btn-scan-reflections-memories"
              onClick={handleScanEntriesForMemories}
              disabled={isScanningAi || entries.length === 0}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-md"
              title="Have Gemini scan recent reflections for enduring memories"
            >
              <Sparkles className={`w-3.5 h-3.5 text-violet-400 ${isScanningAi ? 'animate-spin' : ''}`} />
              <span>{isScanningAi ? 'Scanning Archive...' : 'Scan Reflections'}</span>
            </button>
            <button
              id="btn-create-new-memory"
              onClick={handleOpenCreate}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Memory</span>
            </button>
          </div>
        </div>

        {scanMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-between text-xs text-violet-200 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
              <span>{scanMessage}</span>
            </div>
            <button
              onClick={() => setScanMessage(null)}
              className="text-violet-400 hover:text-white font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* AI Memory Suggestions Section */}
      {aiSuggestions.length > 0 && (
        <div className="bg-gradient-to-br from-[#121625] via-[#16142a] to-[#0f111d] border border-violet-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-violet-950/80 border border-violet-500/40 text-violet-300 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-white">
                  AI-Assisted Memory Candidates
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Gemini identified these potential enduring memories from your reflections. Review and approve before saving.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAiSuggestions([])}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Dismiss All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {aiSuggestions.map((suggestion) => {
              const meta = getCategoryMeta(suggestion.category);
              const CategoryIcon = meta.icon;
              const isSavingThis = savingSuggestionId === suggestion.id;

              return (
                <div
                  key={suggestion.id}
                  className="bg-[#131724]/90 rounded-2xl border border-white/[0.08] p-4 shadow-md flex flex-col justify-between space-y-3 relative group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono-meta font-semibold border ${meta.bg} ${meta.color}`}
                      >
                        <CategoryIcon className="w-3 h-3" />
                        <span>{suggestion.category}</span>
                      </span>
                      {suggestion.sourceJournalTitle && (
                        <span className="text-[10px] font-mono-meta text-slate-400 truncate max-w-[140px]">
                          via {suggestion.sourceJournalTitle}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-100">{suggestion.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{suggestion.content}</p>
                    {suggestion.reasoning && (
                      <p className="text-[11px] text-violet-300 bg-violet-950/40 p-2 rounded-xl border border-violet-500/20 italic font-editorial">
                        "{suggestion.reasoning}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleDismissSuggestion(suggestion.id)}
                      disabled={isSavingThis}
                      className="px-3 py-1.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.06] text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleSaveSuggestion(suggestion)}
                      disabled={isSavingThis}
                      className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {isSavingThis ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save to Vault</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Category Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-memories"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories by title, text, or source reflection..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#090b11] border border-white/[0.08] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all shadow-inner font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            id="filter-category-all"
            onClick={() => setSelectedCategory('All')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer font-sans ${
              selectedCategory === 'All'
                ? 'bg-white/[0.12] text-white font-bold shadow-xs border border-white/[0.12]'
                : 'bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <span>All ({categoryCounts['All'] || 0})</span>
          </button>
          {CATEGORIES.map((c) => {
            const count = categoryCounts[c.label] || 0;
            const isSelected = selectedCategory === c.label;
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                id={`filter-category-${c.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedCategory(c.label)}
                className={`whitespace-nowrap flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer font-sans ${
                  isSelected
                    ? 'bg-white/[0.12] text-white font-bold shadow-xs border border-white/[0.12]'
                    : 'bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : c.color}`} />
                <span>
                  {c.label} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Memory Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-12 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Bookmark className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-display font-bold text-white">
              {searchQuery || selectedCategory !== 'All'
                ? 'No memories match your search'
                : 'Your Memory Vault is empty'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search terms or selecting a different category filter.'
                : 'Save enduring goals, personal principles, key decisions, and learnings you want to preserve for the future.'}
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 pt-2">
            {searchQuery || selectedCategory !== 'All' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-white/[0.08]"
              >
                Clear Filters
              </button>
            ) : (
              <>
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-md active:scale-95"
                >
                  + Create First Memory
                </button>
                {entries.length > 0 && (
                  <button
                    onClick={handleScanEntriesForMemories}
                    disabled={isScanningAi}
                    className="px-4 py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/30 text-violet-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Scan Reflections with AI
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((mem) => {
            const meta = getCategoryMeta(mem.category);
            const CategoryIcon = meta.icon;
            const originalEntry = entries.find((e) => e.id === mem.sourceJournalId);

            return (
              <div
                key={mem.id}
                className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-white/[0.16] transition-all group"
              >
                <div className="space-y-2.5">
                  {/* Category & Date */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono-meta font-semibold border ${meta.bg} ${meta.color}`}
                    >
                      <CategoryIcon className="w-3.5 h-3.5" />
                      <span>{mem.category}</span>
                    </span>
                    <span className="text-[10px] font-mono-meta text-slate-500">
                      {new Date(mem.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Title & Content */}
                  <h3 className="text-base font-bold text-slate-100 tracking-tight leading-snug">
                    {mem.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line font-sans">
                    {mem.content}
                  </p>
                </div>

                {/* Footer: Source link and Actions */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  {mem.sourceJournalTitle ? (
                    <button
                      onClick={() => {
                        if (originalEntry && onSelectEntry) {
                          onSelectEntry(originalEntry);
                          onNavigateToJournal();
                        } else {
                          onNavigateToJournal();
                        }
                      }}
                      className="inline-flex items-center space-x-1 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors cursor-pointer truncate max-w-[60%]"
                      title="View original reflection in Journal Workspace"
                    >
                      <BookOpen className="w-3 h-3 shrink-0" />
                      <span className="truncate">{mem.sourceJournalTitle}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic font-mono-meta">Direct Memory</span>
                  )}

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      id={`btn-edit-memory-${mem.id}`}
                      onClick={() => handleOpenEdit(mem)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                      title="Edit Memory"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-delete-memory-${mem.id}`}
                      onClick={async () => {
                        if (window.confirm(`Delete memory "${mem.title}"?`)) {
                          await onDeleteMemory(mem.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e121c] rounded-3xl border border-white/[0.12] shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-300">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="text-base font-display font-bold text-white">
                  {activeModal === 'create' ? 'Save New Memory' : 'Edit Memory'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 font-sans">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Memory Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Transition to Founder Work, Core Philosophy on Rest..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090b11] border border-white/[0.08] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-violet-500/50"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as MemoryCategory)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090b11] border border-white/[0.08] text-xs text-slate-100 focus:outline-hidden focus:border-violet-500/50 cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.label} value={c.label} className="bg-[#0e121c] text-slate-100">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Memory Content & Details</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Articulate the enduring decision, insight, or goal you want MindVault to preserve..."
                  rows={4}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090b11] border border-white/[0.08] text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-violet-500/50"
                />
              </div>

              {/* Optional Source Entry */}
              {entries.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Linked Source Reflection (Optional)
                  </label>
                  <select
                    value={formSourceId}
                    onChange={(e) => setFormSourceId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090b11] border border-white/[0.08] text-xs text-slate-100 focus:outline-hidden focus:border-violet-500/50 cursor-pointer"
                  >
                    <option value="" className="bg-[#0e121c] text-slate-300">None (Independent Memory)</option>
                    {entries.map((entry) => (
                      <option key={entry.id} value={entry.id} className="bg-[#0e121c] text-slate-100">
                        {entry.title || 'Untitled'} (
                        {new Date(entry.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.06] text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-memory-form"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? 'Saving...' : activeModal === 'create' ? 'Save Memory' : 'Update Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
