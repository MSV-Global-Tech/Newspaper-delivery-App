import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDP_RxsRZSgIgsY3NYEoJgcJdNOgz-isF0",
  authDomain: "newspaper-6323a.firebaseapp.com",
  projectId: "newspaper-6323a",
  storageBucket: "newspaper-6323a.firebasestorage.app",
  messagingSenderId: "233764829289",
  appId: "1:233764829289:web:d5c17ef58e31b152d9caf8",
  measurementId: "G-EV6R42CB4R",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);

// Custom AsyncStorage persistence for Firebase Auth
class AsyncStoragePersistence {
  static type = 'LOCAL';
  type = 'LOCAL' as const;

  async _isAvailable(): Promise<boolean> {
    try {
      await ReactNativeAsyncStorage.setItem('firebase:persistence:test', '1');
      await ReactNativeAsyncStorage.removeItem('firebase:persistence:test');
      return true;
    } catch {
      return false;
    }
  }

  async _set(key: string, value: any): Promise<void> {
    await ReactNativeAsyncStorage.setItem(key, JSON.stringify(value));
  }

  async _get<T>(key: string): Promise<T | null> {
    const json = await ReactNativeAsyncStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  }

  async _remove(key: string): Promise<void> {
    await ReactNativeAsyncStorage.removeItem(key);
  }

  _addListener(_key: string, _listener: any): void {}
  _removeListener(_key: string, _listener: any): void {}
}

function initAuthInstance() {
  try {
    // Try to use initializeAuth with AsyncStorage persistence
    return initializeAuth(app, {
      persistence: AsyncStoragePersistence as any,
    });
  } catch (error) {
    console.log('initializeAuth failed, trying getAuth:', error);
    try {
      // Fallback to getAuth
      return getAuth(app);
    } catch (error2) {
      console.log('getAuth also failed:', error2);
      return null;
    }
  }
}

let authInstance: any = null;
let authInitialized = false;

// Initialize auth only when needed (lazy initialization)
export function getFirebaseAuth() {
  if (authInitialized) return authInstance;
  try {
    authInstance = initAuthInstance();
    authInitialized = true;
    console.log('Firebase Auth initialized:', authInstance ? 'Success' : 'Failed');
  } catch (error) {
    console.log('Auth initialization error:', error);
  }
  return authInstance;
}

export const auth = authInstance;
export default app;
