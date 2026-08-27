'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Upload, X } from 'lucide-react';

type UploadStage = 'idle' | 'uploading' | 'queued' | 'processing' | 'done' | 'error';

interface UploadProgressProps {
  stage: UploadStage;
  uploadPercent: number;  // 0-100 during file upload
  processPercent: number; // 0-100 during AI processing
  step?: string;
  filename?: string;
  onCancel?: () => void;
}

const STAGE_CONFIG: Record<UploadStage, { label: string; color: string }> = {
  idle:       { label: 'Ready',        color: '#6B7280' },
  uploading:  { label: 'Uploading…',   color: '#3B82F6' },
  queued:     { label: 'Queued',       color: '#F59E0B' },
  processing: { label: 'Processing…', color: '#A855F7' },
  done:       { label: 'Done!',        color: '#10B981' },
  error:      { label: 'Error',        color: '#EF4444' },
};

export function UploadProgress({
  stage,
  uploadPercent,
  processPercent,
  step,
  filename,
  onCancel,
}: UploadProgressProps) {
  if (stage === 'idle') return null;

  const cfg    = STAGE_CONFIG[stage];
  const isActive = stage === 'uploading' || stage === 'processing';
  const barPct = stage === 'uploading' ? uploadPercent : stage === 'processing' ? processPercent : stage === 'done' ? 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-2xl bg-surface border border-[#333] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {isActive ? (
            <Loader2 size={18} className="animate-spin flex-shrink-0" style={{ color: cfg.color }} />
          ) : stage === 'done' ? (
            <CheckCircle size={18} className="text-neon-green flex-shrink-0" />
          ) : (
            <Upload size={18} className="flex-shrink-0" style={{ color: cfg.color }} />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{ color: cfg.color }}>{cfg.label}</p>
            {filename && <p className="text-text-muted text-xs truncate">{filename}</p>}
          </div>
        </div>
        {onCancel && stage !== 'done' && (
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-full bg-surface-raised flex items-center justify-center text-text-muted hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${cfg.color}, #A855F7)` }}
          initial={{ width: '0%' }}
          animate={{ width: `${barPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Step label */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{step ?? cfg.label}</span>
        <span>{Math.round(barPct)}%</span>
      </div>
    </motion.div>
  );
}

export default UploadProgress;
