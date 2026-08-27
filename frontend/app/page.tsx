'use client';

import { useState, useCallback } from 'react';
import { HeroSection } from '@/components/hero/HeroSection';
import { FeaturePills } from '@/components/hero/FeaturePills';
import { VideoDropzone } from '@/components/upload/VideoDropzone';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { CaptionToggle } from '@/components/upload/CaptionToggle';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { uploadVideo } from '@/lib/api';
import { CreditCounter } from '@/components/dashboard/CreditCounter';
import { LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type CaptionLang = 'hinglish' | 'hindi' | 'english';
type UploadStage = 'idle' | 'uploading' | 'queued' | 'processing' | 'done' | 'error';

// Simple device fingerprint (client-side)
function getDeviceId(): string {
  const key = 'vc_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { credits, isPaid, plan } = useCredits();

  const [authOpen, setAuthOpen]       = useState(false);
  const [captionLang, setCaptionLang] = useState<CaptionLang>('hinglish');
  const [stage, setStage]             = useState<UploadStage>('idle');
  const [uploadPct, setUploadPct]     = useState(0);
  const [processPct, setProcessPct]   = useState(0);
  const [step, setStep]               = useState<string>('');
  const [filename, setFilename]       = useState('');

  const handleFileSelect = useCallback(async (file: File) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isPaid && credits <= 0) {
      toast.error('No credits remaining. Please upgrade your plan.');
      return;
    }

    setFilename(file.name);
    setStage('uploading');
    setUploadPct(0);

    try {
      const deviceId = getDeviceId();
      const result = await uploadVideo(file, captionLang, deviceId, (pct) => setUploadPct(pct));

      setStage('queued');
      setStep('Queued for AI processing…');
      toast.success('Video uploaded! Processing started 🚀');

      // Redirect to shorts page after a moment
      setTimeout(() => {
        router.push(`/shorts/${result.job_id}`);
      }, 1500);
    } catch (err: unknown) {
      setStage('error');
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      toast.error(msg);
    }
  }, [user, isPaid, credits, captionLang, router]);

  return (
    <main className="min-h-screen bg-base-bg flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-[#222] bg-base-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">🎬</span>
            <span className="text-gradient-purple-blue">ViralClip AI</span>
          </Link>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 rounded-lg bg-surface animate-pulse" />
            ) : user ? (
              <>
                <CreditCounter credits={credits} isPaid={isPaid} plan={plan} />
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised text-sm transition-colors"
                >
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-text-muted hover:text-red-400 text-sm transition-colors"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-5 py-2 rounded-xl bg-neon-gradient text-white text-sm font-semibold shadow-neon-purple hover:opacity-90 transition-opacity"
              >
                Sign In — Free
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <HeroSection onGetStarted={() => user ? document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' }) : setAuthOpen(true)} />

      {/* Feature Pills */}
      <div className="pb-16">
        <FeaturePills />
      </div>

      {/* Upload Section */}
      <section id="upload-section" className="max-w-2xl mx-auto w-full px-4 pb-24 space-y-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-1">Upload Your Video</h2>
          <p className="text-text-muted text-sm">MP4, MOV, AVI or WebM &bull; Up to 2GB</p>
        </div>

        <CaptionToggle value={captionLang} onChange={setCaptionLang} disabled={stage !== 'idle'} />
        <VideoDropzone onFileSelect={handleFileSelect} disabled={stage !== 'idle'} />
        <UploadProgress
          stage={stage}
          uploadPercent={uploadPct}
          processPercent={processPct}
          step={step}
          filename={filename}
          onCancel={() => setStage('idle')}
        />
      </section>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </main>
  );
}
