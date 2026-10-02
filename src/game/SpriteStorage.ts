/**
 * Persistent IndexedDB store for official game assets.
 * Ensures user-supplied assets survive browser reloads and render instantly.
 */

import { assetManager } from './AssetManager';

const DB_NAME = 'FoxTiefoAssetsDB';
const STORE_NAME = 'sprites';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAssetBlob(id: string, file: Blob | File): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(dataUrl, id);
      tx.oncomplete = () => {
        assetManager.loadSprite(id, dataUrl);
        resolve(dataUrl);
      };
      tx.onerror = () => reject(tx.error);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function loadAllSavedAssets() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getAllKeysReq = store.getAllKeys();

    getAllKeysReq.onsuccess = () => {
      const keys = getAllKeysReq.result as string[];
      keys.forEach((key) => {
        const getValReq = store.get(key);
        getValReq.onsuccess = () => {
          const dataUrl = getValReq.result as string;
          if (dataUrl) {
            assetManager.loadSprite(key, dataUrl);
          }
        };
      });
    };
  } catch {
    // Ignore if IndexedDB is unavailable
  }
}

// Map filenames to asset IDs
export function mapFilenameToAssetId(filename: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.includes('cesta')) return 'basket';
  if (lower.includes('gallina')) return 'hen';
  if (lower.includes('huevo')) return 'egg';
  if (lower.includes('logo')) return 'logo';
  if (lower.includes('maceta')) return 'pots';
  if (lower.includes('zorro')) return 'fox';
  if (lower.includes('fondo') || lower.includes('background') || lower.includes('image')) return 'background';
  return null;
}
