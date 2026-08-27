'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

export interface CreditState {
  credits: number;
  isPaid: boolean;
  plan: string;
  loading: boolean;
}

export function useCredits(): CreditState {
  const { user } = useAuth();
  const [state, setState] = useState<CreditState>({
    credits: user?.credits ?? 0,
    isPaid:  user?.isPaid ?? false,
    plan:    user?.plan ?? 'free',
    loading: true,
  });

  useEffect(() => {
    if (!user?.uid) {
      setState({ credits: 0, isPaid: false, plan: 'free', loading: false });
      return;
    }

    // Real-time listener on Firestore user doc
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setState({
          credits: data.credits ?? 0,
          isPaid:  data.isPaid ?? false,
          plan:    data.plan ?? 'free',
          loading: false,
        });
      } else {
        setState({ credits: 0, isPaid: false, plan: 'free', loading: false });
      }
    });

    return unsub;
  }, [user?.uid]);

  return state;
}
