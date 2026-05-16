import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, leftIcon: LeftIcon, rightIcon: RightIcon, children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md border border-primary/20',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
      outline: 'border border-border/50 bg-transparent hover:bg-accent text-foreground hover:border-border',
      ghost: 'bg-transparent hover:bg-accent text-foreground',
      danger: 'bg-danger text-white hover:bg-danger/90',
      glass: 'glass text-white hover:bg-white/10 border-white/10 shadow-lg shadow-black/20',
      premium: 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-blue-500/20'
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-[10px] uppercase tracking-wider font-bold',
      sm: 'h-9 px-4 text-xs font-medium',
      md: 'h-11 px-6 text-sm font-medium',
      lg: 'h-13 px-10 text-base font-semibold',
      icon: 'h-10 w-10'
    };

    return (
      <motion.button
        ref={ref as any}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <>
            {LeftIcon && <LeftIcon className={`w-4 h-4 ${children ? 'mr-2' : ''}`} />}
            {children}
            {RightIcon && <RightIcon className={`w-4 h-4 ${children ? 'ml-2' : ''}`} />}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
