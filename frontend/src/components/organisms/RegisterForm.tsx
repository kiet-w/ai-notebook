"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../atoms/Button';
import { FormField } from '../molecules/FormField';
import { GoogleIcon, GithubIcon } from '../atoms/SocialIcons';
import { api } from '@/utils/api';

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
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
            name="firstName"
            label="First name" 
            type="text" 
            placeholder="John"
            required
          />
          <FormField 
            name="lastName"
            label="Last name" 
            type="text" 
            placeholder="Doe"
            required
          />
        </div>
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
        <Button fullWidth variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
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
