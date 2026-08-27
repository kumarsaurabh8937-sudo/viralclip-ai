'use client';

import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type GlowColor = 'purple' | 'blue' | 'pink' | 'none';

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: GlowColor;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  hoverable?: boolean;
}

const GLOW: Record<GlowColor, string> = {
  purple: 'border-neon-purple/20 hover:border-neon-purple/50 hover:shadow-[0_0_24px_rgba(168,85,247,0.15)]',
  blue:   'border-neon-blue/20 hover:border-neon-blue/50 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)]',
  pink:   'border-neon-pink/20 hover:border-neon-pink/50 hover:shadow-[0_0_24px_rgba(236,72,153,0.15)]',
  none:   'border-surface-border',
};

const PAD: Record<string, string> = { sm: 'p-4', md: 'p-6', lg: 'p-8', none: '' };

export const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  ({ glow = 'purple', padding = 'md', hoverable = true, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'rounded-2xl bg-surface border transition-all duration-300',
        GLOW[glow],
        PAD[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GlowCard.displayName = 'GlowCard';
export default GlowCard;
