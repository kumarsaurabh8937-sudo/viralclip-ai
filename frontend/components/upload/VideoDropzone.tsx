'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Film, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface VideoDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const ACCEPTED = { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'], 'video/x-msvideo': ['.avi'], 'video/webm': ['.webm'] };

export function VideoDropzone({ onFileSelect, disabled }: VideoDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[], rejected: unknown[]) => {
    setError(null);
    if (rejected && (rejected as File[]).length > 0) {
      setError('Invalid file. Please upload an MP4, MOV, AVI or WebM video under 2GB.');
      return;
    }
    if (accepted[0]) onFileSelect(accepted[0]);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled,
  });

  return (
    <div className="w-full space-y-3">
      <div
        {...getRootProps()}
        className={clsx(
          'relative w-full rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300',
          isDragActive
            ? 'border-neon-purple bg-neon-purple/10 shadow-neon-purple scale-[1.01]'
            : 'border-[#333] hover:border-neon-blue/60 hover:bg-neon-blue/5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        {/* Background glow orb */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
          style={{
            background: isDragActive
              ? 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.15) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.05) 0%, transparent 70%)',
          }}
        />

        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div
              key="drop"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative"
            >
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-neon-purple font-bold text-xl">Drop it here!</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 border border-neon-purple/30 flex items-center justify-center mx-auto mb-5"
              >
                <Upload size={28} className="text-neon-purple" />
              </motion.div>

              <h3 className="text-xl font-bold text-text-primary mb-2">
                Drop your video here
              </h3>
              <p className="text-text-muted text-sm mb-6">
                or click to browse your files
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neon-gradient text-white text-sm font-semibold shadow-neon-purple hover:opacity-90 transition-opacity">
                <Film size={16} />
                Select Video
              </div>

              <p className="mt-5 text-text-muted text-xs">
                MP4, MOV, AVI, WebM &bull; Max 2GB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VideoDropzone;
