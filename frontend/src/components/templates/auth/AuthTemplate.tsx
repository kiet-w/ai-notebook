'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';
import LanguageSwitcher from '@/components/atoms/common/LanguageSwitcher';

export interface AuthTemplateProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  type: 'login' | 'register';
}

export default function AuthTemplate({ children, title, subtitle, type }: AuthTemplateProps) {
  const { t } = useI18n();

  const displayTitle = title || (type === 'login' ? t('auth.loginTitle') : t('auth.registerTitle'));
  const displaySubtitle = subtitle || (type === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle'));

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 relative">
      {/* Language switcher on top right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Left side - Visual (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-zinc-900 p-12 text-white relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-900 to-zinc-900" />
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-zinc-900 font-bold text-xl leading-none">S</span>
          </div>
          <span className="font-medium text-lg">{t('sidebar.brandTitle')}</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 leading-[1.1]">
            Your mind, organized and AI-powered.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Capture notes, extract insights, and search your thoughts instantly with advanced AI models.
          </p>
        </div>

        <div className="relative z-10 text-sm text-zinc-500">
          © {new Date().getFullYear()} {t('sidebar.brandTitle')}. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
              {displayTitle}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              {displaySubtitle}
            </p>
          </div>

          {children}

          <div className="text-center text-sm text-zinc-500">
            {type === 'login' ? (
              <>
                {t('auth.noAccount')}{' '}
                <Link href="/auth/register" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
                  {t('auth.signUpLink')}
                </Link>
              </>
            ) : (
              <>
                {t('auth.haveAccount')}{' '}
                <Link href="/auth/login" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
                  {t('auth.signInLink')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
