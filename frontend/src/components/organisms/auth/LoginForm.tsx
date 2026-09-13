'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/common/Button';
import { FormField } from '@/components/molecules/auth/FormField';
import { GoogleIcon, GithubIcon } from '@/components/atoms/auth/SocialIcons';
import { useI18n } from '@/hooks/useI18n';
import { useToast } from '@/hooks/useToast';
import { api } from '@/utils/api';
import { parseApiError } from '@/utils/error';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();

  const handleFillTestAccount = () => {
    setEmail('admin@example.com');
    setPassword('password123');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const submitEmail = email || ((new FormData(e.currentTarget)).get('email') as string);
    const submitPassword = password || ((new FormData(e.currentTarget)).get('password') as string);

    try {
      await api.login(submitEmail, submitPassword);
      toast.success(t('auth.loginSuccess'));
      router.push('/');
    } catch (err) {
      const parsed = parseApiError(err);
      console.error('[auth/login error]', {
        status: parsed.statusCode,
        data: parsed.raw,
      });
      const errorMsg = parsed.message || t('auth.loginFailed');
      setError(errorMsg);
      toast.error(errorMsg, `Lỗi ${parsed.statusCode}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo / Test Account Card */}
      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {t('auth.testAccountHint')}
          </p>
          <p className="text-zinc-500 font-mono text-[11px] truncate">
            admin@example.com · password123
          </p>
        </div>
        <button
          type="button"
          onClick={handleFillTestAccount}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors cursor-pointer shrink-0"
        >
          {t('auth.useTestAccount')}
        </button>
      </div>

      {error && (
        <div className="p-3 text-[13px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField 
          id="email"
          name="email"
          label={t('auth.emailLabel')} 
          type="email" 
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FormField 
          id="password"
          name="password"
          label={t('auth.passwordLabel')} 
          type="password" 
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:checked:bg-zinc-100" />
            {t('auth.rememberMe')}
          </label>
          <a href="#" className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100">
            {t('auth.forgotPassword')}
          </a>
        </div>
        <Button fullWidth variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? t('auth.signingInBtn') : t('auth.signInBtn')}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            {t('auth.orContinueWith')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button" onClick={() => router.push('/')}>
          <GoogleIcon className="w-5 h-5 mr-2" />
          {t('auth.google')}
        </Button>
        <Button variant="outline" type="button" onClick={() => router.push('/')}>
          <GithubIcon className="w-5 h-5 mr-2 text-zinc-900 dark:text-zinc-100" />
          {t('auth.github')}
        </Button>
      </div>
    </div>
  );
}
