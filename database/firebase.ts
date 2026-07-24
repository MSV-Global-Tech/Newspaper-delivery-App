import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDP_RxsRZSgIgsY3NYEoJgcJdNOgz-isF0",
  authDomain: "newspaper-6323a.firebaseapp.com",
  projectId: "newspaper-6323a",
  storageBucket: "newspaper-6323a.firebasestorage.app",
  messagingSenderId: "233764829289",
  appId: "1:233764829289:web:d5c17ef58e31b152d9caf8",
  measurementId: "G-EV6R42CB4R",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export default app;
