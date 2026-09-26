import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';

// Support both embedded firebase-applet-config.json and Vercel/Vite environment variables
export const resolvedFirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || rawConfig?.apiKey || '',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || rawConfig?.authDomain || '',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || rawConfig?.projectId || '',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || rawConfig?.storageBucket || '',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || rawConfig?.messagingSenderId || '',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || rawConfig?.appId || '',
  firestoreDatabaseId:
    (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) ||
    (rawConfig as any)?.firestoreDatabaseId ||
    '(default)',
};

export const isFirebaseConfigured = Boolean(
  resolvedFirebaseConfig.apiKey &&
  resolvedFirebaseConfig.projectId &&
  resolvedFirebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

// Initialize Firebase App safely (prevent duplicate or top-level crash)
let appInstance: FirebaseApp;
if (!getApps().length) {
  appInstance = initializeApp(resolvedFirebaseConfig);
} else {
  appInstance = getApp();
}

export const app = appInstance;

// Enterprise Firestore instance matching databaseId
export const db: Firestore = resolvedFirebaseConfig.firestoreDatabaseId &&
  resolvedFirebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firebase Auth instance
export const auth: Auth = getAuth(app);

/**
 * Validate Connection to Firestore (Per SKILL.md mandate)
 */
export async function testFirestoreConnection(): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    // Only attempt if authenticated or testing readiness
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice. Please check network connection.');
    }
    return false;
  }
}

// Trigger initial check safely without unhandled rejections
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  testFirestoreConnection().catch(() => {});
}

/**
 * Mandatory Error Handler for Firestore (Conforming to SKILL.md FirestoreErrorInfo)
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
