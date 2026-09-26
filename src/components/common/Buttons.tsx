import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'tonal';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all rounded-xl border select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none';

  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-13 px-6 text-base font-semibold gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-neutral-900 hover:bg-neutral-800 text-white border-transparent shadow-sm hover:shadow active:bg-neutral-950 focus-visible:ring-neutral-900',
    secondary:
      'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200/80 shadow-none focus-visible:ring-neutral-400',
    danger:
      'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm hover:shadow active:bg-red-800 focus-visible:ring-red-600',
    outline:
      'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300 shadow-sm focus-visible:ring-neutral-400',
    tonal:
      'bg-red-50 hover:bg-red-100 text-red-700 border-red-200/60 focus-visible:ring-red-500',
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...(props as any)}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </motion.button>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = (props) => {
  return <PrimaryButton variant="secondary" {...props} />;
};

export const EmergencyButton: React.FC<{
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'normal' | 'hero';
}> = ({ onClick, isLoading = false, disabled = false, size = 'hero' }) => {
  const isHero = size === 'hero';

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer subtle emergency pulse rings */}
      <span className="absolute inline-flex h-full w-full rounded-full bg-red-500/15 animate-ping duration-1000" />
      <span className="absolute inline-flex h-[115%] w-[115%] rounded-full border border-red-200" />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`relative z-10 flex flex-col items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 transition-colors select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/30 disabled:opacity-60 ${
          isHero ? 'w-44 h-44 sm:w-52 sm:h-52' : 'w-24 h-24'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-10 h-10 animate-spin text-white mb-2" />
        ) : (
          <div className="flex flex-col items-center">
            <span className={`${isHero ? 'text-4xl' : 'text-2xl'} font-black tracking-wider`}>
              SOS
            </span>
            <span
              className={`font-semibold tracking-wider uppercase text-red-100 ${
                isHero ? 'text-xs mt-1' : 'text-[10px]'
              }`}
            >
              Emergency
            </span>
          </div>
        )}
      </motion.button>
    </div>
  );
};
