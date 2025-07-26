import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', color = 'primary', ...props }, ref) => {
    const sizes = {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
      xl: "w-12 h-12"
    };
    
    const colors = {
      primary: "border-blue-600 border-t-transparent",
      white: "border-white border-t-transparent",
      gray: "border-gray-300 border-t-gray-600"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-2",
          sizes[size],
          colors[color],
          className
        )}
        {...props}
      />
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

interface LoadingStateProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  loading, 
  children, 
  fallback,
  className 
}) => {
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        {fallback || <LoadingSpinner />}
      </div>
    );
  }

  return <>{children}</>;
};

export { LoadingSpinner, LoadingState, type LoadingSpinnerProps };
