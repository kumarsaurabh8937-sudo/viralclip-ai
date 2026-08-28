'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { useJobStatus } from '@/hooks/useJobStatus';
import { useAuth } from '@/hooks/useAuth';
import { Download, ArrowLeft, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ShortsPage() {
  const params = useParams();
  const jobId  = params?.jobId as string;
  const { user } = useAuth();
  const { status, loading, error } = useJobStatus(jobId);

  const isProcessing = status?.status === 'processing' || status?.status === 'queued';
  const isDone       = status?.status === 'completed';
  const isFailed     = status?.status === 'failed';

  return (
    <main className="min-h-screen bg-base-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-[#222] bg-base-bg/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <span className="text-[#333]">/</span>
          <span className="text-text-primary text-sm font-medium truncate">{status?.filename ?? 'Processing…'}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {loading && !status && (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-neon-purple" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {status && (
          <div className="space-y-8">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-surface border border-[#333] p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-text-primary">{status.filename}</h1>
                  <p className="text-text-muted text-sm mt-1 capitalize">
                    Caption: {status.caption_language} &bull; Created {new Date(status.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={status.status} />
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{status.step ?? 'Processing…'}</span>
                    <span className="text-neon-purple font-semibold">{status.progress}%</span>
                  </div>
                  <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full progress-shimmer"
                      initial={{ width: 0 }}
                      animate={{ width: `${status.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {/* Done state */}
              {isDone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-neon-green/10 border border-neon-green/30"
                >
                  <CheckCircle size={20} className="text-neon-green flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-neon-green font-semibold text-sm">Your short is ready!</p>
                    {status.expires_at && (
                      <p className="text-text-muted text-xs mt-0.5">
                        Expires {new Date(status.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {status.output_url && (
                    <a
                      href={status.output_url}
                      download
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-gradient text-white text-sm font-bold shadow-neon-purple hover:opacity-90 transition-opacity flex-shrink-0"
                    >
                      <Download size={15} /> Download
                    </a>
                  )}
                </motion.div>
              )}

              {/* Failed state */}
              {isFailed && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-semibold text-sm">Processing failed</p>
                    <p className="text-text-muted text-xs mt-0.5">
                      {status.error_message ?? 'An error occurred during processing. Your credit has been refunded.'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Video preview */}
            {isDone && status.output_url && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl overflow-hidden bg-surface border border-[#333] aspect-[9/16] max-w-sm mx-auto flex items-center justify-center"
              >
                <video
                  src={status.output_url}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, { label: string; cls: string }> = {
    queued:     { label: 'Queued',     cls: 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' },
    processing: { label: 'Processing', cls: 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' },
    completed:  { label: 'Completed',  cls: 'bg-neon-green/10 border-neon-green/30 text-neon-green' },
    failed:     { label: 'Failed',     cls: 'bg-red-500/10 border-red-500/30 text-red-400' },
    expired:    { label: 'Expired',    cls: 'bg-surface-raised border-surface-border text-text-muted' },
  };
  const cfg = MAP[status] ?? MAP.queued;
  return (
    <span className={`px-3 py-1 rounded-full border text-xs font-semibold flex-shrink-0 ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
