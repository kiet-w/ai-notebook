import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Utility function to merge Tailwind classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export { cva, type VariantProps };

/**
 * Button variants configuration
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:
          'gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-xl text-sm shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_1px_rgba(9,9,11,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)] border border-zinc-900 dark:border-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:border-zinc-800 dark:hover:border-zinc-200 disabled:opacity-30',
        nav:
          'w-full relative flex items-center justify-start gap-2.5 px-3.5 py-2 text-[13px] rounded-lg border border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/35 dark:hover:bg-zinc-800/20 hover:text-zinc-900 dark:hover:text-zinc-100 group',
        ghost:
          'w-full flex items-center justify-start gap-2.5 px-3.5 py-2 text-[13px] text-zinc-500 dark:text-zinc-400 rounded-lg border border-transparent hover:bg-zinc-200/35 dark:hover:bg-zinc-800/20 hover:text-zinc-900 dark:hover:text-zinc-100',
        outline:
          'gap-2 px-4 py-2 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900 shadow-sm',
      },
      isActive: {
        true: '',
        false: '',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      size: {
        sm: 'text-xs px-2.5 py-1.5 rounded-lg',
        md: 'text-sm px-4 py-2 rounded-xl',
        lg: 'text-base px-5 py-2.5 rounded-xl',
        icon: 'h-9 w-9 p-0 rounded-lg',
      },
    },
    compoundVariants: [
      {
        variant: 'nav',
        isActive: true,
        className:
          'bg-zinc-200/50 dark:bg-zinc-800/40 text-zinc-900 dark:text-zinc-50 border-zinc-200/60 dark:border-zinc-850/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] pl-[18px]',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      isActive: false,
      fullWidth: false,
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

/**
 * Badge variants configuration
 */
export const badgeVariants = cva(
  'shrink-0 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)] border font-bold uppercase tracking-wider leading-none',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-150/40 dark:bg-zinc-800/45 border-zinc-200/40 dark:border-zinc-800/30 text-zinc-500 dark:text-zinc-400',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        error: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;

/**
 * Input / Textarea variants configuration
 */
export const inputVariants = cva(
  'flex w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm transition-all duration-200 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300',
  {
    variants: {
      variant: {
        default: 'h-11',
        textarea:
          'px-4 py-3 bg-transparent border-none focus:ring-0 resize-none min-h-[52px] max-h-[300px] overflow-y-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type InputVariantProps = VariantProps<typeof inputVariants>;

/**
 * Toast container variants configuration
 */
export const toastVariants = cva(
  'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 min-w-[280px] max-w-sm',
  {
    variants: {
      type: {
        success:
          'bg-emerald-50/95 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200',
        error:
          'bg-red-50/95 dark:bg-red-950/80 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200',
        warning:
          'bg-amber-50/95 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
        info:
          'bg-zinc-50/95 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200',
      },
    },
    defaultVariants: {
      type: 'info',
    },
  }
);

export type ToastVariantProps = VariantProps<typeof toastVariants>;

/**
 * Popover variants configuration
 */
export const popoverVariants = cva(
  'absolute bottom-full mb-2 z-50 min-w-[200px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-lg',
  {
    variants: {
      align: {
        start: 'left-0',
        center: 'left-1/2 -translate-x-1/2',
        end: 'right-0',
      },
    },
    defaultVariants: {
      align: 'center',
    },
  }
);

export type PopoverVariantProps = VariantProps<typeof popoverVariants>;
