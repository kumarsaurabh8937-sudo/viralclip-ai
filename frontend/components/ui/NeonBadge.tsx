'use client';

import { HTMLAttributes } from 'react';
import clsx from 'clsx';

type BadgeVariant = 'purple' | 'blue' | 'pink' | 'green' | 'yellow' | 'red' | 'muted';

interface NeonBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulseDot?: boolean;
}

const VARIANT: Record<BadgeVariant, string> = {
  purple: 'bg-neon-purple/10 border-neon-purple/40 text-neon-purple',
  blue:   'bg-neon-blue/10   border-neon-blue/40   text-neon-blue',
  pink:   'bg-neon-pink/10   border-neon-pink/40   text-neon-pink',
  green:  'bg-neon-green/10  border-neon-green/40  text-neon-green',
  yellow: 'bg-yellow-500/10  border-yellow-500/40  text-yellow-400',
  red:    'bg-red-500/10     border-red-500/40     text-red-400',
  muted:  'bg-surface-raised border-surface-border text-text-muted',
};

export function NeonBadge({ variant = 'purple', size = 'md', dot, pulseDot, children, className, ...props }: NeonBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        VARIANT[variant],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        className
      )}
      {...props}
    >
      {(dot || pulseDot) && (
        <span className="relative flex h-2 w-2">
          {pulseDot && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

export default NeonBadge;
