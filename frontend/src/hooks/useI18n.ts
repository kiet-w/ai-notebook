'use client';

import { useContext } from 'react';
import { I18nContext } from '@/i18n/I18nContext';
import { I18nContextValue } from '@/i18n/types';

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export default useI18n;
