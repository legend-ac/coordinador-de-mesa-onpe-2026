import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  collection,
  doc,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

/*
 * Mantiene una copia local duradera de Firestore. Así, una edición no se pierde
 * si se corta la red: Firestore la encola y la sincroniza cuando el servicio
 * vuelva a estar disponible. El fallback evita errores durante HMR/desarrollo
 * si otra instancia ya inicializó Firestore.
 */
let firestore: Firestore;
try {
  firestore = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    databaseId,
  );
} catch {
  firestore = getFirestore(app, databaseId);
}

export const db = firestore;

// ─── Rutas con scope por coordinador ─────────────────────────────────────────

/** Colección de miembros de un coordinador */
export function getMembersCollectionRef(coordinadorDni: string) {
  return collection(db, `coordinadores/${coordinadorDni}/miembros`);
}

/** Documento de un miembro específico de un coordinador */
export function getMemberDocRef(coordinadorDni: string, memberId: string) {
  return doc(db, `coordinadores/${coordinadorDni}/miembros`, memberId);
}

/** Documento del perfil/configuración del coordinador */
export function getPerfilDocRef(coordinadorDni: string) {
  return doc(db, `coordinadores/${coordinadorDni}/config`, 'perfil');
}

// ─── Auth Google (para Google Sheets) ────────────────────────────────────────

export const auth = getAuth(app);

export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
];

const provider = new GoogleAuthProvider();
GOOGLE_SHEETS_SCOPES.forEach((scope) => provider.addScope(scope));

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export default db;
