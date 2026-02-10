import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const PUBLIC_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
} as const;

type PublicFirebaseEnv = keyof typeof PUBLIC_ENV;

function requiredPublicEnv(name: PublicFirebaseEnv): string {
  const value = PUBLIC_ENV[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function getClientApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    apiKey: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    appId: requiredPublicEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  });
}

export function getClientAuth() {
  return getAuth(getClientApp());
}

export function getClientDb() {
  return getFirestore(getClientApp());
}
