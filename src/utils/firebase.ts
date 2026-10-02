/**
 * Firebase Firestore & Authentication Integration for Fox Thief.
 * Global Top 50 Leaderboard, Telemetry, Record History, and Admin Analytics.
 * Safe fallback to LocalStorage/Memory when environment keys are not configured.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  Firestore,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  Auth,
  User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase initialization skipped/failed:', err);
  }
}

export { db, auth };

// Collections
export const COLLECTIONS = {
  RANKING: 'fox_thief_ranking',
  RECORDS: 'fox_thief_records_history',
  SESSIONS: 'fox_thief_sessions',
  META: 'fox_thief_meta',
};

export interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  gameId: 'FOX_THIEF';
  date: string;
  time: string;
  timestamp?: number | Timestamp;
  basketsSold?: number;
  foxesScared?: number;
  eggsDelivered?: number;
  sessionId?: string;
}

export interface RecordHistoryEntry {
  id?: string;
  playerName: string;
  previousRecord: number;
  newRecord: number;
  difference: number;
  date: string;
  time: string;
  timestamp?: number | Timestamp;
  gameId: 'FOX_THIEF';
}

export interface SessionLogEntry {
  id?: string;
  type: 'visit' | 'game_start' | 'game_complete' | 'record_broken';
  score?: number;
  basketsSold?: number;
  foxesScared?: number;
  playerName?: string;
  date: string;
  time: string;
  timestamp?: number | Timestamp;
  userAgent?: string;
}

export interface GameSummaryStats {
  totalVisits: number;
  gamesStarted: number;
  gamesCompleted: number;
  uniquePlayers: number;
  totalCoinsAccumulated: number;
  highestScore: number;
  averageScore: number;
  currentRecordHolder: string;
  currentRecordDate: string;
  currentRecordTime: string;
}

/**
 * Fetch Top 50 records from Firestore
 */
export async function fetchFirebaseTop50(): Promise<LeaderboardEntry[] | null> {
  if (!db || !isFirebaseConfigured) return null;
  try {
    const q = query(
      collection(db, COLLECTIONS.RANKING),
      orderBy('score', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const results: LeaderboardEntry[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as LeaderboardEntry;
      results.push({
        ...data,
        id: docSnap.id,
      });
    });
    return results;
  } catch (err) {
    console.warn('Could not fetch Top 50 from Firebase:', err);
    return null;
  }
}

/**
 * Save new score and check if it breaks the global record
 */
export async function addFirebaseScoreWithRecordCheck(
  name: string,
  score: number,
  meta?: { basketsSold?: number; foxesScared?: number; eggsDelivered?: number }
): Promise<{ success: boolean; isNewRecord: boolean; previousRecord: number }> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (!db || !isFirebaseConfigured) {
    return { success: false, isNewRecord: false, previousRecord: 0 };
  }

  try {
    // 1. Add score entry
    await addDoc(collection(db, COLLECTIONS.RANKING), {
      name: name.trim(),
      score,
      gameId: 'FOX_THIEF',
      date: dateStr,
      time: timeStr,
      basketsSold: meta?.basketsSold || 0,
      foxesScared: meta?.foxesScared || 0,
      eggsDelivered: meta?.eggsDelivered || 0,
      createdAt: serverTimestamp(),
      timestamp: Date.now(),
    });

    // 2. Fetch or initialize meta stats to check for new global record
    const metaRef = doc(db, COLLECTIONS.META, 'stats');
    const metaSnap = await getDoc(metaRef);
    let previousRecord = 0;
    let isNewRecord = false;

    if (metaSnap.exists()) {
      const currentMeta = metaSnap.data() as Partial<GameSummaryStats>;
      previousRecord = currentMeta.highestScore || 0;
      if (score > previousRecord) {
        isNewRecord = true;
      }
    } else {
      isNewRecord = score > 0;
      previousRecord = 0;
    }

    if (isNewRecord) {
      // Record history entry
      await addDoc(collection(db, COLLECTIONS.RECORDS), {
        playerName: name.trim(),
        previousRecord,
        newRecord: score,
        difference: score - previousRecord,
        date: dateStr,
        time: timeStr,
        gameId: 'FOX_THIEF',
        createdAt: serverTimestamp(),
        timestamp: Date.now(),
      });

      // Update meta record doc
      await setDoc(
        metaRef,
        {
          highestScore: score,
          currentRecordHolder: name.trim(),
          currentRecordDate: dateStr,
          currentRecordTime: timeStr,
          gamesCompleted: increment(1),
          totalCoinsAccumulated: increment(score),
        },
        { merge: true }
      );
    } else {
      // Increment stats
      await setDoc(
        metaRef,
        {
          gamesCompleted: increment(1),
          totalCoinsAccumulated: increment(score),
        },
        { merge: true }
      );
    }

    // Log completion session
    await addDoc(collection(db, COLLECTIONS.SESSIONS), {
      type: isNewRecord ? 'record_broken' : 'game_complete',
      playerName: name.trim(),
      score,
      basketsSold: meta?.basketsSold || 0,
      foxesScared: meta?.foxesScared || 0,
      date: dateStr,
      time: timeStr,
      createdAt: serverTimestamp(),
      timestamp: Date.now(),
    });

    return { success: true, isNewRecord, previousRecord };
  } catch (err) {
    console.warn('Error saving score to Firebase:', err);
    return { success: false, isNewRecord: false, previousRecord: 0 };
  }
}

/**
 * Log game session events (visit, game start)
 */
export async function logSessionEvent(
  type: 'visit' | 'game_start',
  meta?: Record<string, unknown>
) {
  if (!db || !isFirebaseConfigured) return;
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    await addDoc(collection(db, COLLECTIONS.SESSIONS), {
      type,
      date: dateStr,
      time: timeStr,
      createdAt: serverTimestamp(),
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      ...meta,
    });

    const metaRef = doc(db, COLLECTIONS.META, 'stats');
    if (type === 'visit') {
      await setDoc(metaRef, { totalVisits: increment(1) }, { merge: true });
    } else if (type === 'game_start') {
      await setDoc(metaRef, { gamesStarted: increment(1) }, { merge: true });
    }
  } catch (err) {
    // Non-blocking telemetry
    console.warn('Telemetry event skipped:', err);
  }
}
