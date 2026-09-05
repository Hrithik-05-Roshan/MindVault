import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import type {
  JournalEntry,
  PersonalEvolutionData,
  EvolutionTimeRange,
  PastSelfMessage,
  MemoryItem,
} from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

// Initialize Firebase App
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfigData) : getApp();

// Initialize Auth
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific database ID if available
export const db: Firestore = (() => {
  const databaseId = firebaseConfigData.firestoreDatabaseId;
  if (databaseId && databaseId !== '(default)') {
    try {
      return getFirestore(app, databaseId);
    } catch (e) {
      console.warn('Initializing with custom database ID failed, falling back to default:', e);
      return getFirestore(app);
    }
  }
  return getFirestore(app);
})();

// Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      return value === undefined ? null : value;
    })
  );
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Sign-in error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Firestore Database Service - User Isolated Data Path: /users/{userId}/entries/{entryId}

export function subscribeToUserEntries(
  userId: string,
  onData: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
) {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || 'Untitled Reflection',
          content: data.content || '',
          mood: data.mood || 'Reflective',
          summary: data.summary || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          location: data.location || undefined,
          messages: Array.isArray(data.messages) ? data.messages : [],
          reflectionInsight: data.reflectionInsight || undefined,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });
      onData(entries);
    },
    (err) => {
      console.error('Error fetching user entries from Firestore:', err);
      onError(err);
    }
  );
}

export async function saveJournalEntry(
  userId: string,
  entry: Partial<JournalEntry> & { id: string }
): Promise<void> {
  if (!userId) throw new Error('User ID is required to save entry');
  if (!entry.id) throw new Error('Entry ID is required');

  const now = Date.now();
  const entryDocRef = doc(db, 'users', userId, 'entries', entry.id);

  const payload: JournalEntry = {
    id: entry.id,
    userId,
    title: entry.title?.trim() || 'Untitled Reflection',
    content: entry.content || '',
    mood: entry.mood || 'Reflective',
    summary: entry.summary || '',
    tags: entry.tags || [],
    ...(entry.location ? { location: entry.location } : {}),
    messages: entry.messages || [],
    ...(entry.reflectionInsight ? { reflectionInsight: entry.reflectionInsight } : {}),
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };

  // Zero-Crash Payload Hygiene before passing to Firestore
  const cleanPayload = sanitizePayload(payload);
  await setDoc(entryDocRef, cleanPayload, { merge: true });
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('User ID and Entry ID required');
  const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryDocRef);
}

// Personal Evolution Persistence Cache: /users/{userId}/evolution/{timeRange}
export async function fetchCachedEvolution(
  userId: string,
  timeRange: EvolutionTimeRange
): Promise<PersonalEvolutionData | null> {
  if (!userId) return null;
  try {
    const evolutionDocRef = doc(db, 'users', userId, 'evolution', timeRange);
    const snap = await getDoc(evolutionDocRef);
    if (!snap.exists()) return null;
    return snap.data() as PersonalEvolutionData;
  } catch (err) {
    console.warn(`Could not fetch cached evolution for range ${timeRange}:`, err);
    return null;
  }
}

export async function saveCachedEvolution(
  userId: string,
  data: PersonalEvolutionData
): Promise<void> {
  if (!userId || !data.timeRange) return;
  const evolutionDocRef = doc(db, 'users', userId, 'evolution', data.timeRange);
  const cleanPayload = sanitizePayload(data);
  await setDoc(evolutionDocRef, cleanPayload, { merge: true });
}

// Past Self Conversation Persistence: /users/{userId}/past_self/history
export async function fetchPastSelfConversation(
  userId: string
): Promise<PastSelfMessage[]> {
  if (!userId) return [];
  try {
    const chatDocRef = doc(db, 'users', userId, 'past_self', 'history');
    const snap = await getDoc(chatDocRef);
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.messages) ? (data.messages as PastSelfMessage[]) : [];
  } catch (err) {
    console.warn('Could not fetch past self conversation:', err);
    return [];
  }
}

export async function savePastSelfConversation(
  userId: string,
  messages: PastSelfMessage[]
): Promise<void> {
  if (!userId) return;
  try {
    const chatDocRef = doc(db, 'users', userId, 'past_self', 'history');
    const cleanPayload = sanitizePayload({
      userId,
      messages: messages.slice(-50), // keep recent 50 messages
      updatedAt: Date.now(),
    });
    await setDoc(chatDocRef, cleanPayload, { merge: true });
  } catch (err) {
    console.warn('Could not save past self conversation:', err);
  }
}

export async function clearPastSelfConversation(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const chatDocRef = doc(db, 'users', userId, 'past_self', 'history');
    await deleteDoc(chatDocRef);
  } catch (err) {
    console.warn('Could not clear past self conversation:', err);
  }
}

// Memory Vault Persistence: /users/{userId}/memories/{memoryId}
export function subscribeToUserMemories(
  userId: string,
  onData: (memories: MemoryItem[]) => void,
  onError: (error: Error) => void
) {
  if (!userId) return () => {};
  const memoriesCol = collection(db, 'users', userId, 'memories');
  const q = query(memoriesCol, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: MemoryItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<MemoryItem, 'id'>),
      }));
      onData(items);
    },
    (err) => {
      console.error('Firestore memories subscription error:', err);
      onError(err);
    }
  );
}

export async function saveMemory(userId: string, memory: MemoryItem): Promise<void> {
  if (!userId || !memory.id) throw new Error('Valid User ID and Memory ID are required.');
  const memoryDocRef = doc(db, 'users', userId, 'memories', memory.id);
  const cleanPayload = sanitizePayload(memory);
  await setDoc(memoryDocRef, cleanPayload, { merge: true });
}

export async function deleteMemory(userId: string, memoryId: string): Promise<void> {
  if (!userId || !memoryId) throw new Error('Valid User ID and Memory ID are required.');
  const memoryDocRef = doc(db, 'users', userId, 'memories', memoryId);
  await deleteDoc(memoryDocRef);
}

