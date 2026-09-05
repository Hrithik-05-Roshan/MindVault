import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  Clock,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import type { JournalEntry, PastSelfMessage, UserProfile } from '../types';
import {
  fetchPastSelfConversation,
  savePastSelfConversation,
  clearPastSelfConversation,
} from '../lib/firebase';

interface PastSelfChatProps {
  user: UserProfile;
  entries: JournalEntry[];
  onNavigateToJournal: () => void;
  onSelectEntry?: (entry: JournalEntry) => void;
  onNewEntry: () => void;
}

const SUGGESTED_QUESTIONS = [
  "What's been on my mind lately?",
  "What patterns keep showing up?",
  "What goals have I mentioned repeatedly?",
  "What has changed in my thinking?",
  "What was I worried about last month?",
  "What should I remember from my past reflections?",
];

export const PastSelfChat: React.FC<PastSelfChatProps> = ({
  user,
  entries,
  onNavigateToJournal,
  onSelectEntry,
  onNewEntry,
}) => {
  const [messages, setMessages] = useState<PastSelfMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load persisted Past Self conversation from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSavedChat() {
      if (!user?.uid) return;
      setIsLoadingHistory(true);
      try {
        const saved = await fetchPastSelfConversation(user.uid);
        if (isMounted && saved && saved.length > 0) {
          setMessages(saved);
        }
      } catch (err) {
        console.warn('Failed to load past self conversation:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }
    loadSavedChat();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Submit question to Past Self endpoint
  const handleAsk = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading || !user?.uid) return;

    if (entries.length === 0) {
      setErrorMessage(
        'You have no saved journal entries yet. Past Self requires at least one reflection to answer questions about your history.'
      );
      return;
    }

    setErrorMessage(null);
    setInputQuestion('');

    const userMessage: PastSelfMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Prepare conversational history turns for multi-turn context
      const historyTurns = newMessages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      // Bounded journal payload to prevent token bloat
      const sanitizedEntriesPayload = entries.slice(0, 40).map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content,
        mood: e.mood,
        createdAt: e.createdAt,
      }));

      const response = await fetch('/api/past-self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          history: historyTurns,
          entries: sanitizedEntriesPayload,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to receive response from Past Self.');
      }

      const botMessage: PastSelfMessage = {
        id: `past-self-${Date.now()}`,
        sender: 'past_self',
        text: json.data.answer,
        timestamp: Date.now(),
        referencedEntries: json.data.referencedEntries || [],
        modelUsed: json.data.modelUsed,
      };

      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);

      // Persist conversation to Firestore
      await savePastSelfConversation(user.uid, finalMessages);
    } catch (err: any) {
      console.error('Error asking Past Self:', err);
      setErrorMessage(
        err.message || 'An error occurred while conversing with Past Self. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user?.uid) return;
    if (window.confirm('Clear your conversation with Past Self?')) {
      setMessages([]);
      setErrorMessage(null);
      await clearPastSelfConversation(user.uid);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk(inputQuestion);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full h-full">
      {/* Editorial Header */}
      <div className="bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-6 sm:p-7 shadow-2xl shrink-0 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-950/60 text-violet-300 border border-violet-500/30">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="font-mono-meta">Archival Grounding</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-mono-meta">Private & isolated</span>
              </span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-normal text-white tracking-tight">
              Talk to Your Past Self
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
              Converse with an introspective mirror grounded strictly in your personal journal history.
              Ask about past worries, recurring goals, or how your thinking has evolved over time.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 self-start sm:self-center">
            {messages.length > 0 && (
              <button
                id="btn-clear-past-self-chat"
                onClick={handleClearHistory}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.06] text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                title="Clear current dialogue"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Chat</span>
              </button>
            )}
            <div className="text-xs font-mono-meta font-semibold px-3 py-1.5 bg-white/[0.05] text-slate-300 border border-white/[0.08] rounded-xl">
              {entries.length} reflection{entries.length === 1 ? '' : 's'} in archive
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversational Workspace */}
      <div className="flex-1 bg-[#0e121c]/90 backdrop-blur-xl rounded-3xl border border-white/[0.08] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="m-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-start justify-between text-rose-200 text-xs shrink-0 backdrop-blur-md">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Notice</p>
                <p className="mt-0.5 text-rose-300">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 0 Entries in Journal State */}
        {entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-display font-bold text-white">Your archive is currently empty</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Past Self converses with you by grounding its responses in your authentic journal reflections.
                Write your first reflection to start asking questions about your past.
              </p>
            </div>
            <button
              id="btn-past-self-empty-new"
              onClick={onNewEntry}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>+ Write First Reflection</span>
            </button>
          </div>
        ) : (
          /* Conversation Message Stream */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Welcoming state when conversation is empty */}
            {messages.length === 0 && !isLoadingHistory && (
              <div className="space-y-6 py-4">
                <div className="bg-[#131724]/80 border border-white/[0.06] rounded-2xl p-6 text-center space-y-3 max-w-2xl mx-auto backdrop-blur-md">
                  <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/40 text-violet-300 flex items-center justify-center mx-auto">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-display font-bold text-white">
                    What would you like to ask your Past Self?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Select a suggested prompt below or type your own question into the box below.
                    Answers are strictly distilled from your {entries.length} recorded reflection
                    {entries.length === 1 ? '' : 's'}.
                  </p>
                </div>

                {/* Suggested Prompt Chips */}
                <div className="space-y-2 max-w-2xl mx-auto">
                  <div className="flex items-center space-x-2 text-xs font-mono-meta font-semibold text-slate-400">
                    <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                    <span>Suggested Questions</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SUGGESTED_QUESTIONS.map((question, idx) => (
                      <button
                        key={idx}
                        id={`btn-suggested-prompt-${idx}`}
                        onClick={() => handleAsk(question)}
                        disabled={isLoading}
                        className="p-3 rounded-2xl border border-white/[0.08] hover:border-violet-500/40 bg-[#131724]/60 hover:bg-[#181d2d] text-left text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                      >
                        <span className="line-clamp-2">{question}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rendered Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Past Self Avatar */}
                {msg.sender === 'past_self' && (
                  <div className="w-8 h-8 rounded-xl bg-violet-950/80 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0 shadow-md mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-4 rounded-3xl text-sm leading-relaxed relative group ${
                      msg.sender === 'user'
                        ? 'bg-[#181e2b] border border-white/[0.08] text-slate-100 rounded-tr-xs shadow-sm'
                        : 'bg-gradient-to-br from-[#151928] to-[#1a162e] border border-violet-500/30 text-slate-100 rounded-tl-xs shadow-[0_4px_25px_rgba(139,92,246,0.1)]'
                    }`}
                  >
                    <p className="whitespace-pre-line font-sans">{msg.text}</p>

                    {/* Copy action on hover for Past Self messages */}
                    {msg.sender === 'past_self' && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/[0.08] cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Referenced Entries Badges / Citations */}
                  {msg.referencedEntries && msg.referencedEntries.length > 0 && (
                    <div className="p-3 bg-violet-950/40 border border-violet-500/30 rounded-2xl space-y-1.5 text-xs backdrop-blur-md">
                      <div className="flex items-center space-x-1.5 text-violet-300 font-semibold text-[11px] font-mono-meta">
                        <BookOpen className="w-3 h-3 text-violet-400" />
                        <span>Referenced Historical Reflections:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.referencedEntries.map((ref, rIdx) => {
                          const originalEntry = entries.find((e) => e.id === ref.id);
                          return (
                            <button
                              key={rIdx}
                              onClick={() => {
                                if (originalEntry && onSelectEntry) {
                                  onSelectEntry(originalEntry);
                                  onNavigateToJournal();
                                }
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-slate-200 font-medium text-[11px] transition-colors cursor-pointer shadow-xs"
                              title="Click to view in Journal Workspace"
                            >
                              <span>{ref.title}</span>
                              <span className="text-violet-400">•</span>
                              <span className="text-slate-400 text-[10px] font-mono-meta">{ref.dateStr}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Metadata */}
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 px-1 font-mono-meta">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.modelUsed && (
                      <>
                        <span>•</span>
                        <span className="text-violet-400 font-medium">{msg.modelUsed}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/[0.08] text-slate-300 flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4 items-start animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-violet-950/80 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-4 h-4 animate-spin text-violet-400" />
                </div>
                <div className="p-4 rounded-3xl rounded-tl-xs bg-[#131724]/90 border border-violet-500/30 text-slate-300 text-xs flex items-center space-x-2 shadow-md backdrop-blur-md">
                  <span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-bounce"></span>
                  <span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-slate-400 font-medium pl-1 font-sans">
                    Reflecting on your journal archive...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Bar */}
        {entries.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-white/[0.06] bg-[#0c0f17]/90 shrink-0 backdrop-blur-md">
            {/* Suggested quick prompt pills if conversation active */}
            {messages.length > 0 && (
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 text-[11px] no-scrollbar">
                <span className="text-slate-500 shrink-0 font-medium font-mono-meta">Ask:</span>
                {SUGGESTED_QUESTIONS.slice(0, 4).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAsk(q)}
                    disabled={isLoading}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] hover:text-white text-slate-300 border border-white/[0.08] transition-colors shrink-0 cursor-pointer font-sans"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 bg-[#090b11] border border-white/[0.08] rounded-2xl p-2 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/30 transition-all shadow-inner">
              <textarea
                ref={inputRef}
                id="past-self-question-input"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about past concerns, goals, shifts in perspective... (Enter to send)"
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none resize-none focus:outline-hidden text-sm text-slate-100 placeholder:text-slate-500 px-2 py-1.5 max-h-32 min-h-[38px] font-sans"
              />
              <button
                id="btn-submit-past-self-question"
                onClick={() => handleAsk(inputQuestion)}
                disabled={!inputQuestion.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
                title="Send Question"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-2 mt-1.5 font-mono-meta">
              <span>Enter to send • Shift+Enter for new line</span>
              <span>Grounded in {entries.length} reflections</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
