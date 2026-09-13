import React from 'react';
import { cn, badgeVariants, type BadgeVariantProps } from '@/lib/ui-styles';

export interface BadgeProps extends BadgeVariantProps {
  icon?: string;
  text: string;
  className?: string;
}

export function Badge({ icon, text, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {icon && (
        <span role="img" aria-label={text} className="text-[11px] leading-none">
          {icon}
        </span>
      )}
      <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider leading-none">
        {text}
      </span>
    </span>
  );
}

export default Badge;

