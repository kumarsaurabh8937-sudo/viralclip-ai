'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

const FREE_TRIAL_CREDITS = 3;

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  credits: number;
  isPaid: boolean;
  plan: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async (firebaseUser: User) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    let userDoc = await getDoc(userRef);

    // First-time user → initialize with free credits
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        credits: FREE_TRIAL_CREDITS,
        isPaid: false,
        plan: 'free',
        createdAt: serverTimestamp(),
        totalJobsCreated: 0,
      });
      userDoc = await getDoc(userRef);
    }

    const data = userDoc.data()!;
    setUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      credits: data.credits ?? 0,
      isPaid: data.isPaid ?? false,
      plan: data.plan ?? 'free',
    });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await hydrateUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [hydrateUser]);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await hydrateUser(result.user);
    return result.user;
  }, [hydrateUser]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await hydrateUser(result.user);
      return result.user;
    },
    [hydrateUser]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await hydrateUser(result.user);
      return result.user;
    },
    [hydrateUser]
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) await hydrateUser(firebaseUser);
  }, [hydrateUser]);

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshUser,
    isAuthenticated: !!user,
  };
}
