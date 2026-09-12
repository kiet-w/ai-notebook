'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/common/Button';
import { FormField } from '@/components/molecules/auth/FormField';
import { GoogleIcon, GithubIcon } from '@/components/atoms/auth/SocialIcons';
import { useI18n } from '@/hooks/useI18n';
import { api } from '@/utils/api';

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = `${firstName} ${lastName}`.trim();

    try {
      await api.register(email, password, username);
      router.push('/');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || t('auth.registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-[13px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField 
            id="firstName"
            name="firstName"
            label={t('auth.firstNameLabel')} 
            type="text" 
            placeholder={t('auth.firstNamePlaceholder')}
            required
          />
          <FormField 
            id="lastName"
            name="lastName"
            label={t('auth.lastNameLabel')} 
            type="text" 
            placeholder={t('auth.lastNamePlaceholder')}
            required
          />
        </div>
        <FormField 
          id="email"
          name="email"
          label={t('auth.emailLabel')} 
          type="email" 
          placeholder={t('auth.emailPlaceholder')}
          required
        />
        <FormField 
          id="password"
          name="password"
          label={t('auth.passwordLabel')} 
          type="password" 
          placeholder={t('auth.passwordPlaceholder')}
          required
        />
        <Button fullWidth variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? t('auth.creatingAccountBtn') : t('auth.createAccountBtn')}
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
