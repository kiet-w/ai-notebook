'use client';

import React from 'react';

export function NoteDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full p-6 lg:p-8">
      {/* Left Column Skeleton */}
      <div className="lg:col-span-7 space-y-6 animate-pulse">
        <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-800/50 rounded mb-4" />
        <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/30 space-y-4">
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800/50 rounded w-2/3 mb-2" />
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/50 rounded w-full" />
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/50 rounded w-11/12" />
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/50 rounded w-4/5" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800/50 rounded w-1/2 mt-6 mb-2" />
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/50 rounded w-full" />
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800/50 rounded w-9/12" />
        </div>
      </div>
      {/* Right Column Skeleton */}
      <div className="lg:col-span-5 space-y-6 animate-pulse lg:pl-4 border-t lg:border-t-0 lg:border-l border-zinc-200/50 dark:border-zinc-800/40">
        <div>
          <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800/50 rounded mb-3" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800/50 rounded w-full" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800/50 rounded w-5/6" />
          </div>
        </div>
        <div>
          <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800/50 rounded mb-3" />
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800/50 rounded w-11/12" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800/50 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteDetailSkeleton;
