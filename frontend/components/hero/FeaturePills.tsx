'use client';

import { motion } from 'framer-motion';

const FEATURES = [
  { icon: '🤖', label: 'AI Hook Extraction',  desc: 'Finds the best 15-60s segment' },
  { icon: '📱', label: '9:16 Face-Tracking',  desc: 'MediaPipe smart crop' },
  { icon: '🔍', label: 'Dynamic Zoom',         desc: 'Zooms on high-energy words' },
  { icon: '🎵', label: 'Music Balancing',      desc: 'Auto-ducks background audio' },
  { icon: '📝', label: 'Hinglish Captions',   desc: 'Hindi + English by default' },
  { icon: '🎭', label: 'Animated Emojis',      desc: 'Context-aware emoji overlays' },
];

export function FeaturePills() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.07 }}
            className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl bg-surface border border-[#333] hover:border-neon-purple/40 hover:bg-neon-purple/5 transition-all text-center cursor-default"
          >
            <span className="text-2xl">{f.icon}</span>
            <div>
              <p className="text-text-primary text-xs font-semibold leading-tight">{f.label}</p>
              <p className="text-text-muted text-xs mt-0.5 leading-tight hidden sm:block">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default FeaturePills;
