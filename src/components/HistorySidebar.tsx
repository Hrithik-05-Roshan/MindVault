import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Smile,
  X,
  Sparkles,
} from 'lucide-react';
import type { JournalEntry } from '../types';

interface HistorySidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MOODS = ['All', 'Reflective', 'Grateful', 'Calm', 'Focused', 'Challenged', 'Inspired'];

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      (entry.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = selectedMood === 'All' || entry.mood === selectedMood;
    return matchesSearch && matchesMood;
  });

  const formatDateLabel = (timestamp: number) => {
    if (!timestamp) return 'PREVIOUS';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) return 'TODAY';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop - under navbar (z-40 vs navbar z-50) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:relative top-28 md:top-16 lg:top-0 bottom-0 left-0 z-40 w-80 lg:w-72 xl:w-80 h-full bg-[#0d1017]/95 backdrop-blur-xl lg:rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header section */}
        <div className="p-4 border-b border-white/[0.07] bg-[#111520]/80 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
              <h3 className="text-[11px] font-mono-meta font-semibold text-slate-400 uppercase tracking-wider">
                Reflections Archive ({entries.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-sidebar-new-entry"
            onClick={() => {
              onNewEntry();
              onClose();
            }}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600/90 to-indigo-600/90 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-xs transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)] border border-violet-400/30 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 text-violet-200" />
            <span>+ New Reflection</span>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-history-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past thoughts..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#090b11] border border-white/[0.08] text-slate-200 placeholder-slate-500 text-xs focus:outline-hidden focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all shadow-inner"
            />
          </div>

          {/* Mood filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            {MOODS.map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer text-[10px] font-medium ${
                  selectedMood === mood
                    ? 'bg-white text-slate-950 font-bold shadow-xs'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="py-12 px-4 text-center text-xs text-slate-500 space-y-2">
              <Smile className="w-5 h-5 mx-auto text-slate-600" />
              <p>No reflections found.</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-violet-400 font-semibold underline text-xs cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isActive = activeEntryId === entry.id;
              const isDeleting = deletingId === entry.id;

              return (
                <div
                  key={entry.id}
                  id={`entry-item-${entry.id}`}
                  onClick={() => {
                    onSelectEntry(entry);
                    onClose();
                  }}
                  className={`group relative p-3.5 rounded-xl transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-violet-950/30 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                      : 'bg-[#121622]/60 hover:bg-[#161a28]/80 border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p
                      className={`text-[9px] font-mono-meta font-medium tracking-wider ${
                        isActive ? 'text-violet-400' : 'text-slate-500'
                      }`}
                    >
                      {formatDateLabel(entry.updatedAt)}
                    </p>

                    {entry.mood && (
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300 shrink-0">
                        {entry.mood}
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs font-semibold truncate ${
                      isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {entry.title || 'Untitled Reflection'}
                  </p>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {entry.content ||
                      (entry.messages && entry.messages.length > 0
                        ? entry.messages[0].text
                        : 'Empty reflection draft...')}
                  </p>

                  {/* Footer stats and delete button */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.06] text-[10px] text-slate-500">
                    <span className="flex items-center space-x-1 font-mono-meta text-[9px]">
                      {entry.messages && entry.messages.length > 0 ? (
                        <span className="flex items-center space-x-1 text-violet-400 font-medium">
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>{entry.messages.length} notes</span>
                        </span>
                      ) : (
                        <span>Draft</span>
                      )}
                    </span>

                    {/* Delete action */}
                    {isDeleting ? (
                      <div
                        className="flex items-center space-x-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            onDeleteEntry(entry.id);
                            setDeletingId(null);
                          }}
                          className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[9px] cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-1 py-0.5 text-slate-400 hover:text-slate-200 cursor-pointer text-[9px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`btn-delete-${entry.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(entry.id);
                        }}
                        title="Delete this reflection"
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition-opacity cursor-pointer text-slate-500"
                        aria-label="Delete reflection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
