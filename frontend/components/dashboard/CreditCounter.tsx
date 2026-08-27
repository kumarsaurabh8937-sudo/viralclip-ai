'use client';

import { motion } from 'framer-motion';
import { Zap, Crown, ShoppingBag } from 'lucide-react';

interface CreditCounterProps {
  credits: number;
  isPaid: boolean;
  plan: string;
  onUpgrade?: () => void;
}

export function CreditCounter({ credits, isPaid, plan, onUpgrade }: CreditCounterProps) {
  if (isPaid) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
        <Crown size={15} className="text-yellow-400 fill-yellow-400" />
        <span className="text-yellow-400 font-semibold text-sm">PRO — Unlimited</span>
      </div>
    );
  }

  const low = credits <= 1;

  return (
    <div className="flex items-center gap-2">
      <motion.div
        key={credits}
        initial={{ scale: 1.25 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${
          credits > 0
            ? 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}
      >
        <Zap size={14} className="fill-current" />
        {credits} credit{credits !== 1 ? 's' : ''}
      </motion.div>

      {low && onUpgrade && (
        <motion.button
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onUpgrade}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neon-gradient text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-neon-purple"
        >
          <ShoppingBag size={12} />
          Upgrade
        </motion.button>
      )}
    </div>
  );
}

export default CreditCounter;
