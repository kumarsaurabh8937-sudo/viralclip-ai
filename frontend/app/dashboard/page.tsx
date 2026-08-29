'use client';



import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { CreditCounter } from '@/components/dashboard/CreditCounter';
import { JobGrid } from '@/components/dashboard/JobGrid';
import type { Job } from '@/components/dashboard/JobCard';
import { LogOut, Upload, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { credits, isPaid, plan } = useCredits();
  const [jobs, setJobs]     = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [user, authLoading, router]);

  // Real-time Firestore listener for user's jobs
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'jobs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data: Job[] = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id:         doc.id,
          filename:   d.filename ?? 'video.mp4',
          status:     d.status ?? 'queued',
          progress:   d.progress ?? 0,
          step:       d.step,
          createdAt:  d.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
          expiresAt:  d.expiresAt?.toDate?.()?.toISOString(),
          captionLang: d.captionLanguage ?? 'hinglish',
          outputUrl:  d.outputUrl,
          duration:   d.duration,
        };
      });
      setJobs(data);
      setJobsLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-base-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  const completed  = jobs.filter((j) => j.status === 'completed').length;
  const processing = jobs.filter((j) => ['queued', 'processing'].includes(j.status)).length;

  return (
    <main className="min-h-screen bg-base-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-[#222] bg-base-bg/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">🎬</span>
            <span className="text-gradient-purple-blue">KlipShort AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <CreditCounter credits={credits} isPaid={isPaid} plan={plan} />
            <Link href="/" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neon-gradient text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              <Upload size={14} /> New Video
            </Link>
            <button onClick={() => signOut()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-text-muted hover:text-red-400 text-sm transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Your Shorts</h1>
          <p className="text-text-muted mt-1">
            Welcome back, {user?.displayName?.split(' ')[0] ?? 'there'} 👋
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Videos',  value: jobs.length,  icon: '🎬' },
            { label: 'Completed',     value: completed,    icon: '✅' },
            { label: 'Processing',    value: processing,   icon: '⚙️'  },
            { label: 'Credits Left',  value: isPaid ? '∞' : credits, icon: '⚡' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-surface border border-[#333] p-4">
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-text-muted text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Job list */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Videos</h2>
          <JobGrid jobs={jobs} loading={jobsLoading} />
        </div>
      </div>
    </main>
  );
}
