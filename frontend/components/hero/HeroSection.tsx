'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';

const FEATURES = [
  { icon: '🤖', label: 'AI Hook Extraction' },
  { icon: '📱', label: '9:16 Smart Crop' },
  { icon: '🔍', label: 'Dynamic Zoom' },
  { icon: '🎵', label: 'Music Balancing' },
  { icon: '📝', label: 'Hinglish Captions' },
  { icon: '🎭', label: 'Animated Emojis' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="relative text-center max-w-4xl mx-auto pt-16 pb-12 px-4">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.18) 0%, transparent 65%)' }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-sm font-semibold">
            <Sparkles size={14} />
            AI-Powered Video Editor
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
        >
          Turn long videos into{' '}
          <span className="text-gradient-purple-blue">Viral Shorts</span>
          <br />
          <span className="text-text-secondary text-4xl sm:text-5xl md:text-6xl">in seconds</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-10"
        >
          AI extracts the best hooks, adds smart face-tracking crop, dynamic zoom on keywords, 
          and animated Hinglish captions — automatically.
        </motion.p>

        {/* CTA */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-neon-gradient text-white text-base font-bold shadow-neon-purple hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <Zap size={18} className="fill-white" />
            Start Free — 3 Credits
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-transparent border border-[#333] text-text-secondary hover:border-neon-blue/50 hover:text-text-primary transition-all duration-200">
            Watch Demo ▶
          </button>
        </motion.div>

        <motion.p variants={itemVariants} className="text-text-muted text-sm">
          No credit card required &bull; 3 free shorts &bull; Instant results
        </motion.p>
      </motion.div>
    </div>
  );
}

export default HeroSection;
