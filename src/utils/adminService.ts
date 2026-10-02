/**
 * Administrative Service for Fox Thief.
 * Handles secure authentication, session management, and querying Firestore or local storage.
 * Only uses real player data — strictly purges and excludes fake/mock test players.
 */

import {
  db,
  auth,
  COLLECTIONS,
  isFirebaseConfigured,
  LeaderboardEntry,
  RecordHistoryEntry,
  SessionLogEntry,
  GameSummaryStats,
} from './firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { KNOWN_FAKE_NAMES } from './leaderboardService';

const ADMIN_SESSION_KEY = 'fox_thief_admin_session_token';

async function computeHash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface AdminSession {
  username: string;
  authenticated: boolean;
  loginTime: number;
  token: string;
}

export async function adminLogin(user: string, pass: string): Promise<boolean> {
  const cleanUser = (user || '').trim().toLowerCase();
  const cleanPass = (pass || '').trim();

  if (!cleanUser || !cleanPass) return false;

  // 1. Direct credentials check (Accepts anapse, email variants, admin)
  const validAdminUsernames = [
    'anapse',
    'elherreroanapse@gmail.com',
    'anapse_video@hotmail.com',
    'admin',
  ];

  if (validAdminUsernames.includes(cleanUser) && cleanPass === '16546203') {
    const sessionToken = await computeHash(`session_${cleanUser}_${Date.now()}`);
    const sessionData: AdminSession = {
      username: 'anapse',
      authenticated: true,
      loginTime: Date.now(),
      token: sessionToken,
    };
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
    return true;
  }

  // 2. If Firebase Auth is configured and available, try Firebase Auth
  if (auth && isFirebaseConfigured) {
    try {
      const email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@foxthief.admin`;
      await signInWithEmailAndPassword(auth, email, cleanPass);
      const sessionToken = await computeHash(`session_${cleanUser}_${Date.now()}`);
      const sessionData: AdminSession = {
        username: cleanUser,
        authenticated: true,
        loginTime: Date.now(),
        token: sessionToken,
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
      return true;
    } catch {
      // ignore
    }
  }

  return false;
}

export function isAdminAuthenticated(): boolean {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return false;
    const session: AdminSession = JSON.parse(raw);
    // Session valid for 4 hours
    const isValid = Date.now() - session.loginTime < 4 * 60 * 60 * 1000;
    if (!isValid) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }
    return Boolean(session.authenticated && session.token);
  } catch {
    return false;
  }
}

export async function adminLogout(): Promise<void> {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  if (auth) {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }
}

export async function fetchAdminSummaryStats(): Promise<GameSummaryStats> {
  const baseStats: GameSummaryStats = {
    totalVisits: 0,
    gamesStarted: 0,
    gamesCompleted: 0,
    uniquePlayers: 0,
    totalCoinsAccumulated: 0,
    highestScore: 0,
    averageScore: 0,
    currentRecordHolder: 'Sin registros',
    currentRecordDate: '-',
    currentRecordTime: '-',
  };

  // If local records exist, calculate real local baseline
  try {
    const localLeaderboard = localStorage.getItem('fox_thief_top50_ranking');
    if (localLeaderboard) {
      const parsed: Array<{ name: string; score: number }> = JSON.parse(localLeaderboard);
      if (Array.isArray(parsed)) {
        const realParsed = parsed.filter((p) => p && !KNOWN_FAKE_NAMES.has(p.name));
        if (realParsed.length > 0) {
          baseStats.gamesCompleted = realParsed.length;
          baseStats.uniquePlayers = new Set(realParsed.map((p) => p.name)).size;
          baseStats.highestScore = realParsed[0]?.score || 0;
          baseStats.currentRecordHolder = realParsed[0]?.name || 'Sin registros';
          baseStats.totalCoinsAccumulated = realParsed.reduce((acc, p) => acc + (p.score || 0), 0);
          baseStats.averageScore = Math.round(baseStats.totalCoinsAccumulated / realParsed.length);
          baseStats.currentRecordDate = new Date().toISOString().split('T')[0];
          baseStats.currentRecordTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
      }
    }
  } catch {
    // ignore
  }

  if (!db || !isFirebaseConfigured) {
    return baseStats;
  }

  try {
    const metaRef = doc(db, COLLECTIONS.META, 'stats');
    const snap = await getDoc(metaRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentHolder = data.currentRecordHolder || baseStats.currentRecordHolder;
      return {
        totalVisits: data.totalVisits || baseStats.totalVisits,
        gamesStarted: data.gamesStarted || baseStats.gamesStarted,
        gamesCompleted: data.gamesCompleted || baseStats.gamesCompleted,
        uniquePlayers: data.uniquePlayers || baseStats.uniquePlayers,
        totalCoinsAccumulated: data.totalCoinsAccumulated || baseStats.totalCoinsAccumulated,
        highestScore: KNOWN_FAKE_NAMES.has(currentHolder) ? 0 : data.highestScore || baseStats.highestScore,
        averageScore: data.gamesCompleted
          ? Math.round((data.totalCoinsAccumulated || 0) / data.gamesCompleted)
          : baseStats.averageScore,
        currentRecordHolder: KNOWN_FAKE_NAMES.has(currentHolder) ? 'Sin registros' : currentHolder,
        currentRecordDate: data.currentRecordDate || baseStats.currentRecordDate,
        currentRecordTime: data.currentRecordTime || baseStats.currentRecordTime,
      };
    }
    return baseStats;
  } catch (err) {
    console.warn('Error loading admin summary:', err);
    return baseStats;
  }
}

export async function fetchAdminRanking(): Promise<LeaderboardEntry[]> {
  if (db && isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, COLLECTIONS.RANKING),
        orderBy('score', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      const list: LeaderboardEntry[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as LeaderboardEntry;
        if (!KNOWN_FAKE_NAMES.has(data.name)) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      return list;
    } catch (err) {
      console.warn('Error fetching admin ranking:', err);
    }
  }

  // Fallback to real local storage records only
  try {
    const local = localStorage.getItem('fox_thief_top50_ranking');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        const real = parsed.filter((item) => !KNOWN_FAKE_NAMES.has(item.name));
        if (real.length > 0) {
          return real.map((item, idx) => ({
            id: `local_${idx + 1}`,
            name: item.name,
            score: item.score,
            gameId: 'FOX_THIEF',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            basketsSold: Math.floor(item.score / 20),
            foxesScared: Math.floor(item.score / 60),
            eggsDelivered: Math.floor(item.score / 2),
          }));
        }
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function fetchRecordsHistory(): Promise<RecordHistoryEntry[]> {
  if (db && isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, COLLECTIONS.RECORDS),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const list: RecordHistoryEntry[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as RecordHistoryEntry;
        if (!KNOWN_FAKE_NAMES.has(data.playerName)) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      return list;
    } catch (err) {
      console.warn('Error fetching records history:', err);
    }
  }

  return [];
}

export async function fetchRecentActivity(): Promise<SessionLogEntry[]> {
  if (db && isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, COLLECTIONS.SESSIONS),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      const snap = await getDocs(q);
      const list: SessionLogEntry[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as SessionLogEntry;
        if (!data.playerName || !KNOWN_FAKE_NAMES.has(data.playerName)) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      return list;
    } catch (err) {
      console.warn('Error fetching recent activity:', err);
    }
  }

  return [];
}
