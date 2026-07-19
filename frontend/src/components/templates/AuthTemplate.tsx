import React from 'react';
import Link from 'next/link';

interface AuthTemplateProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  type: 'login' | 'register';
}

export default function AuthTemplate({ children, title, subtitle, type }: AuthTemplateProps) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      {/* Left side - Visual (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-zinc-900 p-12 text-white relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-900 to-zinc-900"></div>
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-zinc-900 font-bold text-xl leading-none">S</span>
          </div>
          <span className="font-medium text-lg">Second Brain</span>
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
          © {new Date().getFullYear()} Second Brain. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          </div>

          {children}

          <div className="text-center text-sm text-zinc-500">
            {type === 'login' ? (
              <>
                Don't have an account?{' '}
                <Link href="/auth/register" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
                  Create one
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
