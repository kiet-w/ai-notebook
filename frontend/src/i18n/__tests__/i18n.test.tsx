import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n, vi, en } from '../index';
import { LanguageSwitcher } from '@/components/atoms/common/LanguageSwitcher';

function TestConsumer() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="sidebar-import">{t('sidebar.importNav')}</span>
      <span data-testid="char-count">{t('notes.charCount', { count: 42 })}</span>
      <span data-testid="everything-tagged">{t('categories.everythingTaggedAs', { category: 'Tech' })}</span>
      <span data-testid="fallback-test">{t('common.save')}</span>
      <button onClick={() => setLocale('en')} data-testid="btn-en">
        Set EN
      </button>
      <button onClick={() => setLocale('vi')} data-testid="btn-vi">
        Set VI
      </button>
    </div>
  );
}

describe('i18n Infrastructure', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Key Parity & Completeness', () => {
    it('has 100% key parity between Vietnamese and English dictionaries', () => {
      const getKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
        return Object.entries(obj).flatMap(([key, value]) => {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            return getKeys(value as Record<string, unknown>, newKey);
          }
          return [newKey];
        });
      };

      const viKeys = getKeys(vi as unknown as Record<string, unknown>).sort();
      const enKeys = getKeys(en as unknown as Record<string, unknown>).sort();

      expect(viKeys).toEqual(enKeys);
    });

    it('covers all required domains: common, sidebar, categories, auth, notes, ws', () => {
      const requiredSections = ['common', 'sidebar', 'categories', 'auth', 'notes', 'ws'] as const;
      requiredSections.forEach((section) => {
        expect(vi).toHaveProperty(section);
        expect(en).toHaveProperty(section);
      });
    });
  });

  describe('I18nProvider & useI18n', () => {
    it('defaults to Vietnamese and translates correctly', () => {
      render(
        <I18nProvider>
          <TestConsumer />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-locale')).toHaveTextContent('vi');
      expect(screen.getByTestId('sidebar-import')).toHaveTextContent('Nhập dữ liệu');
      expect(screen.getByTestId('char-count')).toHaveTextContent('42 ký tự');
      expect(screen.getByTestId('everything-tagged')).toHaveTextContent('Tất cả ghi chú được gắn thẻ Tech.');
    });

    it('switches locale to English dynamically and interpolates variables', async () => {
      const user = userEvent.setup();

      render(
        <I18nProvider>
          <TestConsumer />
        </I18nProvider>
      );

      await user.click(screen.getByTestId('btn-en'));

      expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
      expect(screen.getByTestId('sidebar-import')).toHaveTextContent('Import');
      expect(screen.getByTestId('char-count')).toHaveTextContent('42 characters');
      expect(screen.getByTestId('everything-tagged')).toHaveTextContent('Everything tagged as Tech.');
      expect(localStorage.getItem('secondary_brain_locale')).toBe('en');
    });

    it('hydrates saved locale from localStorage', () => {
      localStorage.setItem('secondary_brain_locale', 'en');

      render(
        <I18nProvider>
          <TestConsumer />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
      expect(screen.getByTestId('sidebar-import')).toHaveTextContent('Import');
    });

    it('falls back gracefully when key is missing or invalid', () => {
      function FallbackComponent() {
        const { t } = useI18n();
        return <span data-testid="missing-key">{t('non.existent.key' as never)}</span>;
      }

      render(
        <I18nProvider>
          <FallbackComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('missing-key')).toHaveTextContent('non.existent.key');
    });

    it('throws when useI18n is used outside I18nProvider', () => {
      // Suppress console.error for expected thrown error
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestConsumer />)).toThrow('useI18n must be used within an I18nProvider');

      spy.mockRestore();
    });
  });

  describe('LanguageSwitcher Component', () => {
    it('renders segmented language switcher and switches locale', async () => {
      const user = userEvent.setup();

      render(
        <I18nProvider>
          <LanguageSwitcher />
          <TestConsumer />
        </I18nProvider>
      );

      const enBtn = screen.getByRole('button', { name: /english/i });
      await user.click(enBtn);

      expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
      expect(screen.getByTestId('sidebar-import')).toHaveTextContent('Import');

      const viBtn = screen.getByRole('button', { name: /tiếng việt/i });
      await user.click(viBtn);

      expect(screen.getByTestId('current-locale')).toHaveTextContent('vi');
      expect(screen.getByTestId('sidebar-import')).toHaveTextContent('Nhập dữ liệu');
    });

    it('renders compact variant and toggles language', async () => {
      const user = userEvent.setup();

      render(
        <I18nProvider>
          <LanguageSwitcher variant="compact" />
          <TestConsumer />
        </I18nProvider>
      );

      const toggleBtn = screen.getByRole('button', { name: /toggle language/i });
      await user.click(toggleBtn);

      expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
    });

    it('renders ghost variant and toggles language', async () => {
      const user = userEvent.setup();

      render(
        <I18nProvider>
          <LanguageSwitcher variant="ghost" />
          <TestConsumer />
        </I18nProvider>
      );

      const toggleBtn = screen.getByRole('button', { name: /toggle language/i });
      await user.click(toggleBtn);

      expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
    });
  });
});
