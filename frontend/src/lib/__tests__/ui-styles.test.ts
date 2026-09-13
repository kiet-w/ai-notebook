import {
  cn,
  buttonVariants,
  badgeVariants,
  inputVariants,
  toastVariants,
  popoverVariants,
} from '../ui-styles';

describe('ui-styles utility', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2 py-1', 'bg-blue-500')).toContain('px-2');
      expect(cn('px-2 py-1', 'bg-blue-500')).toContain('bg-blue-500');
    });

    it('handles conditional class names and falsy values', () => {
      const isHidden = false;
      const isVisible = true;
      expect(cn('base-class', isHidden && 'hidden', isVisible && 'block')).toBe('base-class block');
    });

    it('resolves conflicting tailwind classes with precedence to the latter', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('buttonVariants', () => {
    it('generates primary button classes by default', () => {
      const classes = buttonVariants();
      expect(classes).toContain('bg-zinc-900');
      expect(classes).toContain('inline-flex');
    });

    it('generates nav button with active compound state', () => {
      const activeNav = buttonVariants({ variant: 'nav', isActive: true });
      expect(activeNav).toContain('pl-[18px]');
      expect(activeNav).toContain('bg-zinc-200/50');

      const inactiveNav = buttonVariants({ variant: 'nav', isActive: false });
      expect(inactiveNav).not.toContain('pl-[18px]');
    });

    it('generates ghost and outline variants', () => {
      const ghost = buttonVariants({ variant: 'ghost' });
      expect(ghost).toContain('hover:bg-zinc-200/35');

      const outline = buttonVariants({ variant: 'outline' });
      expect(outline).toContain('border-zinc-200');
    });

    it('handles fullWidth option', () => {
      const full = buttonVariants({ fullWidth: true });
      expect(full).toContain('w-full');
    });
  });

  describe('badgeVariants', () => {
    it('generates default variant', () => {
      const badge = badgeVariants();
      expect(badge).toContain('rounded-full');
      expect(badge).toContain('bg-zinc-150/40');
    });

    it('generates status variants', () => {
      expect(badgeVariants({ variant: 'success' })).toContain('emerald');
      expect(badgeVariants({ variant: 'error' })).toContain('rose');
      expect(badgeVariants({ variant: 'warning' })).toContain('amber');
      expect(badgeVariants({ variant: 'info' })).toContain('blue');
    });
  });

  describe('inputVariants', () => {
    it('generates default input classes', () => {
      const input = inputVariants();
      expect(input).toContain('h-11');
      expect(input).toContain('rounded-xl');
    });

    it('generates textarea classes', () => {
      const textarea = inputVariants({ variant: 'textarea' });
      expect(textarea).toContain('resize-none');
    });
  });

  describe('toastVariants', () => {
    it('generates toast variant styles', () => {
      expect(toastVariants({ type: 'success' })).toContain('emerald');
      expect(toastVariants({ type: 'error' })).toContain('red');
      expect(toastVariants({ type: 'warning' })).toContain('amber');
      expect(toastVariants({ type: 'info' })).toContain('zinc');
    });
  });

  describe('popoverVariants', () => {
    it('generates popover align classes', () => {
      expect(popoverVariants({ align: 'center' })).toContain('left-1/2');
      expect(popoverVariants({ align: 'start' })).toContain('left-0');
      expect(popoverVariants({ align: 'end' })).toContain('right-0');
    });
  });
});
