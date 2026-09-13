import * as React from 'react';
import { AuthInput, type AuthInputProps } from '@/components/atoms/auth/AuthInput';
import { cn } from '@/lib/ui-styles';

export interface FormFieldProps extends AuthInputProps {
  label: string;
  error?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={cn('space-y-1.5', className)}>
        <label htmlFor={inputId} className="text-[13px] font-medium leading-none text-zinc-900 dark:text-zinc-200">
          {label}
        </label>
        <AuthInput id={inputId} ref={ref} {...props} />
        {error && <p className="text-[13px] text-red-500">{error}</p>}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
export default FormField;

