'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/common/Button';
import { FormField } from '@/components/molecules/auth/FormField';
import { GoogleIcon, GithubIcon } from '@/components/atoms/auth/SocialIcons';
import { api } from '@/utils/api';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await api.login(email, password);
      router.push('/');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
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
        <FormField 
          name="email"
          label="Email address" 
          type="email" 
          placeholder="name@example.com"
          required
        />
        <FormField 
          name="password"
          label="Password" 
          type="password" 
          placeholder="••••••••"
          required
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:checked:bg-zinc-100" />
            Remember me
          </label>
          <a href="#" className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100">
            Forgot password?
          </a>
        </div>
        <Button fullWidth variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button" onClick={() => router.push('/')}>
          <GoogleIcon className="w-5 h-5 mr-2" />
          Google
        </Button>
        <Button variant="outline" type="button" onClick={() => router.push('/')}>
          <GithubIcon className="w-5 h-5 mr-2 text-zinc-900 dark:text-zinc-100" />
          GitHub
        </Button>
      </div>
    </div>
  );
}
