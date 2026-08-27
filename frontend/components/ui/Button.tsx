'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

type ButtonVariant = 'neon-purple' | 'neon-blue' | 'neon-pink' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  'neon-purple': 'bg-neon-gradient text-white shadow-neon-purple hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] hover:-translate-y-px active:translate-y-0',
  'neon-blue':   'bg-gradient-to-r from-neon-blue to-neon-blue-dark text-white shadow-neon-blue hover:-translate-y-px active:translate-y-0',
  'neon-pink':   'bg-gradient-to-r from-neon-pink to-purple-600 text-white shadow-neon-pink hover:-translate-y-px active:translate-y-0',
  ghost:         'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-raised',
  outline:       'bg-transparent border border-surface-border text-text-secondary hover:border-neon-purple/50 hover:text-text-primary hover:bg-neon-purple/5',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'neon-purple', size = 'md', loading = false, icon, iconPosition = 'left', children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-semibold transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        icon && iconPosition === 'left' && icon
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  )
);
Button.displayName = 'Button';
export default Button;
