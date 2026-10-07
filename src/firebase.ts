import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import defaultFirebaseConfig from '../firebase-applet-config.json';
import { OperationType } from './types';

// Check if user specified custom environment variables for their own Firebase project
const env = (import.meta as any).env || {};
const customConfig = env.VITE_FIREBASE_API_KEY ? {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
} : null;

const effectiveConfig = customConfig || defaultFirebaseConfig;
const databaseId = customConfig
  ? (env.VITE_FIREBASE_DATABASE_ID || '(default)')
  : ((defaultFirebaseConfig as any).firestoreDatabaseId || '(default)');

// Initialize Firebase
const app = initializeApp(effectiveConfig);
export const db = databaseId && databaseId !== '(default)' ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);
export const oauthClientId = (effectiveConfig as any).oAuthClientId || (defaultFirebaseConfig as any).oAuthClientId;

// Validate Connection on Boot as requested by system rules
async function testConnection() {
  try {
    // Try reading a test path using server fetching to verify Firestore connection is active
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Bitte überprüfe deine Firebase-Verbindung. Der Client ist offline.");
    }
  }
}
testConnection();

// Centralized error handler conforming to FirestoreErrorInfo standard
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    }
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
