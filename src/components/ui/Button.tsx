import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isFullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isFullWidth = false,
      icon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-300 dark:text-white active:bg-primary-800',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-100 disabled:text-gray-400 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-800',
      outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400 disabled:text-gray-300 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-800',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400 disabled:text-gray-300 dark:text-white dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-800',
      danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 disabled:bg-error-300 dark:text-white active:bg-error-800',
    };
    
    const sizes = {
      sm: 'text-xs py-2 px-3 gap-1.5 min-h-[36px] touch-manipulation',
      md: 'text-sm py-2.5 px-4 gap-2 min-h-[44px] touch-manipulation',
      lg: 'text-base py-3 px-5 gap-2.5 min-h-[48px] touch-manipulation',
    };
    
    const widthClass = isFullWidth ? 'w-full' : '';
    
    const variantClasses = variants[variant];
    const sizeClasses = sizes[size];
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantClasses} ${sizeClasses} ${widthClass} ${className} ${disabled || isLoading ? 'cursor-not-allowed' : ''}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="inline-flex items-center gap-2">
            {icon}
            <span className="truncate">{children}</span>
          </span>
        ) : (
          <span className="truncate">{children}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

export { Button }