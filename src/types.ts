export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: number;
  modelUsed?: string;
}

export interface ReflectionInsight {
  theme: string;
  keyInsight: string;
  goalDetected: string;
  recurringPattern: string;
  suggestedMemory: string;
  suggestedMemoryCategory?: MemoryCategory;
  generatedAt: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  summary?: string;
  tags?: string[];
  messages: ChatMessage[];
  reflectionInsight?: ReflectionInsight;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

export type ReflectionMode = 'conversation' | 'summarize' | 'brainstorm';

export type EvolutionTimeRange = '7d' | '30d' | '90d' | 'all';

export interface EvolutionGoal {
  title: string;
  status: 'progressing' | 'unresolved' | 'achieved';
  details: string;
  evolutionNote?: string;
}

export interface EvolutionPattern {
  pattern: string;
  category: 'behavioral' | 'cognitive' | 'emotional';
  observation: string;
  recurrence: string;
}

export interface GrowthArea {
  area: string;
  type: 'progress' | 'uncertainty' | 'repeated_difficulty';
  description: string;
  constructivePerspective: string;
}

export interface EvolutionTheme {
  theme: string;
  frequency: string;
  description: string;
  moodAssociation?: string;
}

export interface PersonalEvolutionData {
  timeRange: EvolutionTimeRange;
  calculatedAt: number;
  modelUsed?: string;
  entryCount: number;
  interactionCount: number;
  totalWords: number;
  recurringThemes: EvolutionTheme[];
  goals: EvolutionGoal[];
  personalPatterns: EvolutionPattern[];
  growthAreas: GrowthArea[];
  recentReflectionSynthesis: string;
  keyEvolutionInsight: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface PastSelfReferencedEntry {
  id: string;
  title: string;
  dateStr: string;
}

export interface PastSelfMessage {
  id: string;
  sender: 'user' | 'past_self';
  text: string;
  timestamp: number;
  referencedEntries?: PastSelfReferencedEntry[];
  modelUsed?: string;
}

export interface PastSelfConversation {
  userId: string;
  messages: PastSelfMessage[];
  updatedAt: number;
}

export type MemoryCategory =
  | 'Goal'
  | 'Project'
  | 'Learning'
  | 'Personal Insight'
  | 'Important Decision'
  | 'Principle';

export interface MemoryItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: MemoryCategory;
  sourceJournalId?: string;
  sourceJournalTitle?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface MemorySuggestion {
  id: string;
  title: string;
  content: string;
  category: MemoryCategory;
  reasoning: string;
  sourceJournalId?: string;
  sourceJournalTitle?: string;
}

