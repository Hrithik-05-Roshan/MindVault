import React from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  TrendingUp,
  MessageSquare,
  Bookmark,
  Shield,
  Layers,
} from 'lucide-react';

interface LandingViewProps {
  onSignIn: () => void;
  isAuthenticating: boolean;
  authError: string | null;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onSignIn,
  isAuthenticating,
  authError,
}) => {
  return (
    <div className="relative z-10 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 py-14 text-slate-100">
      <div className="w-full max-w-5xl mx-auto text-center space-y-12">
        {/* Brand Badge & Security Pill */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-[#121622]/90 border border-white/[0.12] text-slate-300 text-xs font-mono-meta tracking-wider shadow-[0_0_20px_rgba(139,92,246,0.15)] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-white font-medium">MINDVAULT</span>
          <span className="text-slate-500">•</span>
          <span className="text-violet-300">Continuous Personal Intelligence</span>
        </div>

        {/* Editorial Hero Statement */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <h1 className="font-editorial text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-white leading-[1.05] text-balance">
            Your thoughts shouldn’t disappear after you write them.
          </h1>
          <p className="font-sans-ui text-base sm:text-xl text-slate-400 leading-relaxed font-light max-w-2xl mx-auto">
            A quiet sanctuary to think, converse with your past reflections, and uncover the trajectory of your mindset through time with Gemini.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="pt-2 flex flex-col items-center justify-center space-y-4">
          <button
            id="btn-landing-google-signin"
            onClick={onSignIn}
            disabled={isAuthenticating}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-semibold text-sm sm:text-base transition-all shadow-[0_0_35px_rgba(255,255,255,0.18)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group border border-white active:scale-98"
          >
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <span className="tracking-tight">{isAuthenticating ? 'Authenticating with Google...' : 'Continue with Google Sign-In'}</span>
            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:translate-x-1.5 transition-transform" />
          </button>

          <p className="text-xs font-mono-meta text-slate-500 flex items-center justify-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Isolated Firestore Storage • Passwords are never stored</span>
          </p>

          {/* Auth Error Banner with New Tab Helper */}
          {authError && (
            <div
              id="banner-auth-error"
              className="mt-4 p-4 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs sm:text-sm max-w-lg text-left space-y-2 shadow-lg backdrop-blur-md"
            >
              <div className="font-bold flex items-center space-x-2 text-rose-100">
                <span>Authentication Notice</span>
              </div>
              <p>{authError}</p>
              <div className="pt-1 flex items-center space-x-3">
                <button
                  onClick={onSignIn}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Try Again
                </button>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-rose-300 hover:text-white underline font-medium"
                >
                  <span>Open in New Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Feature Grid: 4 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-left">
          {/* Card 1: Journal */}
          <div className="p-6 rounded-2xl bg-[#11141e]/80 backdrop-blur-md border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-3 transition-all hover:border-violet-500/40 hover:bg-[#151926]/90 group">
            <div className="w-9 h-9 rounded-xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-300 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-display font-bold text-white tracking-wide">Calm Journaling</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Distraction-free reflective writing with multi-turn Gemini 3.6 Flash dialogue and instant auto-save.
            </p>
          </div>

          {/* Card 2: Past Self */}
          <div className="p-6 rounded-2xl bg-[#11141e]/80 backdrop-blur-md border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-3 transition-all hover:border-amber-500/40 hover:bg-[#151926]/90 group">
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-display font-bold text-white tracking-wide">Past Self Dialogue</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Converse directly with your historical reflections. Inquire about former priorities, doubts, and wins.
            </p>
          </div>

          {/* Card 3: Evolution */}
          <div className="p-6 rounded-2xl bg-[#11141e]/80 backdrop-blur-md border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-3 transition-all hover:border-cyan-500/40 hover:bg-[#151926]/90 group">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-display font-bold text-white tracking-wide">Personal Evolution</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesize how your core mindset, recurring themes, and goals evolve over weeks and months.
            </p>
          </div>

          {/* Card 4: Memory Vault */}
          <div className="p-6 rounded-2xl bg-[#11141e]/80 backdrop-blur-md border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-3 transition-all hover:border-indigo-500/40 hover:bg-[#151926]/90 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
              <Bookmark className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-display font-bold text-white tracking-wide">Memory Vault</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curate decisions, principles, and breakthroughs you explicitly choose to anchor in long-term memory.
            </p>
          </div>
        </div>

        {/* Security Checklist */}
        <div className="p-4 rounded-2xl bg-[#0f121a]/80 backdrop-blur-md border border-white/[0.07] max-w-xl mx-auto flex flex-wrap items-center justify-center gap-6 text-xs font-mono-meta text-slate-400 shadow-inner">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Owner-Bound Firestore</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Exposure API Keys</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict User Confirmation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
