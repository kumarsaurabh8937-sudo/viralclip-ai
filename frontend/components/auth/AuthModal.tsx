'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Globe, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome! You have 3 free credits 🎉');
      onClose();
    } catch {
      toast.error('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: '#1E1E1E',
              border: '1px solid rgba(168,85,247,0.35)',
              boxShadow: '0 0 60px rgba(168,85,247,0.2)',
            }}
          >
            {/* Header */}
            <div
              className="px-6 py-5 border-b border-[#333]"
              style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.12),rgba(59,130,246,0.12))' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-neon-gradient">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">Welcome to ViralClip AI</h3>
                    <p className="text-text-muted text-xs">Get 3 free credits — no card required</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-3">
              {/* Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-[#333] bg-surface-raised hover:border-[#A855F7]/50 text-text-primary font-medium transition-all disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#333]" />
                <span className="text-text-muted text-xs">or</span>
                <div className="flex-1 h-px bg-[#333]" />
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-[#333] bg-surface-raised hover:border-[#3B82F6]/50 text-text-primary font-medium transition-all disabled:opacity-50"
              >
                <Globe size={18} className="text-neon-blue" />
                Continue with Email
              </button>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-[#333] bg-surface-raised hover:border-neon-green/50 text-text-primary font-medium transition-all disabled:opacity-50"
              >
                <Smartphone size={18} className="text-neon-green" />
                Continue with Mobile OTP
              </button>

              <p className="text-center text-text-muted text-xs pt-1">
                By signing in, you agree to our Terms &amp; Privacy Policy.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;
