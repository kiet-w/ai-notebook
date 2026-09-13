import * as React from 'react';
import { cn, inputVariants } from '@/lib/ui-styles';

export type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant: 'default' }),
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

AuthInput.displayName = 'AuthInput';
export default AuthInput;

