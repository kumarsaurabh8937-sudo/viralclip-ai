'use client';

import { motion } from 'framer-motion';
import { Play, Download, Loader2, CheckCircle, AlertCircle, Clock, Timer } from 'lucide-react';
import Link from 'next/link';

export interface Job {
  id: string;
  filename: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  progress: number;
  step?: string;
  createdAt: string;
  expiresAt?: string;
  captionLang: string;
  outputUrl?: string;
  duration?: number;
}

const STATUS_CONFIG = {
  queued:     { label: 'Queued',     Icon: Clock,        color: 'text-yellow-400',  bg: 'bg-yellow-400/10 border-yellow-400/30' },
  processing: { label: 'Processing', Icon: Loader2,      color: 'text-neon-blue',   bg: 'bg-neon-blue/10 border-neon-blue/30',  spin: true },
  completed:  { label: 'Completed',  Icon: CheckCircle,  color: 'text-neon-green',  bg: 'bg-neon-green/10 border-neon-green/30' },
  failed:     { label: 'Failed',     Icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/30' },
  expired:    { label: 'Expired',    Icon: Timer,        color: 'text-text-muted',  bg: 'bg-surface-raised border-surface-border' },
} as const;

export function JobCard({ job, index = 0 }: { job: Job; index?: number }) {
  const cfg  = STATUS_CONFIG[job.status];
  const Icon = cfg.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-surface border border-[#333] p-4 hover:border-neon-purple/30 transition-colors"
    >
      {/* Thumbnail / play button */}
      <Link
        href={`/shorts/${job.id}`}
        className="w-20 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-neon-purple/10 border border-neon-purple/20 hover:border-neon-purple/60 hover:bg-neon-purple/20 transition-all"
      >
        <Play size={20} className="text-neon-purple fill-neon-purple/60" />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary truncate">{job.filename}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-text-muted text-xs capitalize">{job.captionLang}</span>
          {job.duration && <span className="text-text-muted text-xs">{job.duration}s</span>}
          <span className="text-text-muted text-xs">{new Date(job.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Processing bar */}
        {job.status === 'processing' && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full progress-shimmer"
                initial={{ width: 0 }}
                animate={{ width: `${job.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {job.step && <p className="text-text-muted text-xs">{job.step}</p>}
          </div>
        )}
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
          <Icon size={12} className={'spin' in cfg && cfg.spin ? 'animate-spin' : ''} />
          {cfg.label}
          {job.status === 'processing' && ` ${job.progress}%`}
        </span>

        {job.status === 'completed' && job.outputUrl && (
          <a
            href={job.outputUrl}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-xs font-semibold hover:bg-neon-purple/20 transition-colors"
          >
            <Download size={12} />
            Download
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default JobCard;
