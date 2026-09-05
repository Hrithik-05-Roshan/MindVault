import React from 'react';
import { BookOpen, Sparkles, TrendingUp, MessageSquare, Bookmark, LogOut, LogIn, Plus, Compass } from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isAuthenticating: boolean;
  onNewEntry?: () => void;
  currentView?: 'journal' | 'evolution' | 'past_self' | 'memory_vault' | 'memory_atlas';
  onViewChange?: (view: 'journal' | 'evolution' | 'past_self' | 'memory_vault' | 'memory_atlas') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignIn,
  onSignOut,
  isAuthenticating,
  onNewEntry,
  currentView = 'journal',
  onViewChange,
}) => {
  return (
    <header className="w-full max-w-full bg-[#090b11]/85 backdrop-blur-xl border-b border-white/[0.07] text-slate-100 sticky top-0 z-50 shrink-0 overflow-x-clip">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left: Brand Identity */}
        <div
          className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0 select-none group"
          onClick={() => onViewChange?.('journal')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onViewChange?.('journal')}
          aria-label="MindVault Home"
        >
          <div className="w-8 h-8 rounded-xl bg-[#141824] flex items-center justify-center text-white border border-white/[0.12] shadow-[0_0_15px_rgba(139,92,246,0.15)] group-hover:border-violet-500/40 transition-colors shrink-0">
            <div className="w-3.5 h-3.5 border-2 border-amber-400/90 rounded-xs rotate-45 transition-transform group-hover:rotate-90 duration-500"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-white group-hover:text-slate-200 transition-colors whitespace-nowrap">
                MIND<span className="text-violet-400 font-light">VAULT</span>
              </span>
              <span className="hidden 2xl:inline-flex items-center text-[10px] font-mono-meta font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 border border-white/[0.08] whitespace-nowrap">
                Private Intel
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (shown at lg+ and adapts gracefully) */}
        {user && onViewChange && (
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center p-1 bg-[#10141f]/90 rounded-2xl border border-white/[0.08] text-xs font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] shrink-0">
            <button
              id="tab-nav-journal"
              onClick={() => onViewChange('journal')}
              className={`flex items-center space-x-2 px-3 xl:px-4 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'journal'
                  ? 'bg-white/[0.12] text-white shadow-xs border border-white/[0.14] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
              <span>Journal</span>
            </button>

            <button
              id="tab-nav-past-self"
              onClick={() => onViewChange('past_self')}
              className={`flex items-center space-x-2 px-3 xl:px-4 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'past_self'
                  ? 'bg-white/[0.12] text-white shadow-xs border border-white/[0.14] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Past Self</span>
            </button>

            <button
              id="tab-nav-evolution"
              onClick={() => onViewChange('evolution')}
              className={`flex items-center space-x-2 px-3 xl:px-4 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'evolution'
                  ? 'bg-white/[0.12] text-white shadow-xs border border-white/[0.14] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span><span className="hidden xl:inline">Personal </span>Evolution</span>
            </button>

            <button
              id="tab-nav-memory-vault"
              onClick={() => onViewChange('memory_vault')}
              className={`flex items-center space-x-2 px-3 xl:px-4 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'memory_vault'
                  ? 'bg-white/[0.12] text-white shadow-xs border border-white/[0.14] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              <span><span className="hidden xl:inline">Memory </span>Vault</span>
            </button>

            <button
              id="tab-nav-memory-atlas"
              onClick={() => onViewChange('memory_atlas')}
              className={`flex items-center space-x-2 px-3 xl:px-4 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'memory_atlas'
                  ? 'bg-white/[0.12] text-white shadow-xs border border-white/[0.14] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-rose-400" />
              <span>Memory Atlas</span>
            </button>
          </nav>
        )}

        {/* Right Side: Quick Action & User Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Cloud & AI Indicators (only on extra wide screens) */}
          <div className="hidden 2xl:flex items-center space-x-3 text-xs pr-3 border-r border-white/[0.08] text-slate-400">
            <div className="flex items-center space-x-1.5" title="Cloud Firestore user-isolated storage">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono-meta text-[11px] text-slate-400">Firestore</span>
            </div>
            <div className="flex items-center space-x-1.5" title="Gemini 3.6 Flash Server-Side">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="font-mono-meta text-[11px] text-slate-400">Gemini Flash</span>
            </div>
          </div>

          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              {onNewEntry && (
                <button
                  id="btn-nav-new-entry"
                  onClick={onNewEntry}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-violet-600/90 to-indigo-600/90 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-[0_0_20px_rgba(139,92,246,0.25)] border border-violet-400/30 cursor-pointer active:scale-95 shrink-0"
                  title="Create new journal reflection"
                >
                  <Plus className="w-3.5 h-3.5 text-violet-200" />
                  <span className="hidden sm:inline whitespace-nowrap">New Reflection</span>
                </button>
              )}

              {/* User Avatar & Name */}
              <div className="flex items-center space-x-2 pl-0.5 sm:pl-1">
                <div className="hidden 2xl:block text-right">
                  <p className="text-[10px] font-mono-meta text-slate-500 uppercase tracking-wider leading-none">
                    Signed in
                  </p>
                  <p className="text-xs font-semibold text-slate-300 truncate max-w-[120px] mt-0.5">
                    {user.displayName || user.email}
                  </p>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-white/[0.14] shadow-xs object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <button
                id="btn-sign-out"
                onClick={onSignOut}
                title="Sign out of your account"
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors border border-white/[0.08] cursor-pointer shrink-0"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="btn-nav-sign-in"
              onClick={onSignIn}
              disabled={isAuthenticating}
              className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 font-semibold text-xs transition-all shadow-md shadow-white/5 disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-900" />
              <span>{isAuthenticating ? 'Signing In...' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile & Tablet & Zoomed View Switcher: Responsive, Non-Overlapping Tabs */}
      {user && onViewChange && (
        <div className="lg:hidden border-t border-white/[0.07] bg-[#090b11]/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around sm:justify-center sm:gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold w-full max-w-full">
          <button
            id="tab-mobile-journal"
            onClick={() => onViewChange('journal')}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              currentView === 'journal'
                ? 'bg-white/[0.12] text-white shadow-xs border border-white/[0.14] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-violet-400" />
            <span>Journal</span>
          </button>

          <button
            id="tab-mobile-past-self"
            onClick={() => onViewChange('past_self')}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              currentView === 'past_self'
                ? 'bg-white/[0.12] text-white shadow-xs border border-white/[0.14] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Past Self</span>
          </button>

          <button
            id="tab-mobile-evolution"
            onClick={() => onViewChange('evolution')}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              currentView === 'evolution'
                ? 'bg-white/[0.12] text-white shadow-xs border border-white/[0.14] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Evolution</span>
          </button>

          <button
            id="tab-mobile-memory-vault"
            onClick={() => onViewChange('memory_vault')}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              currentView === 'memory_vault'
                ? 'bg-white/[0.12] text-white shadow-xs border border-white/[0.14] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            <span>Vault</span>
          </button>

          <button
            id="tab-mobile-memory-atlas"
            onClick={() => onViewChange('memory_atlas')}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              currentView === 'memory_atlas'
                ? 'bg-white/[0.12] text-white shadow-xs border border-white/[0.14] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            <span>Atlas</span>
          </button>
        </div>
      )}
    </header>
  );
};
