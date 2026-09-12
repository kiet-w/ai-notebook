'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import NoteInput from '@/components/molecules/notes/NoteInput';
import { useHomeNotes } from '@/hooks/useHomeNotes';
import { ImportHero, CategoryGrid, RecentImportsList } from '@/components/organisms/notes';

const Sidebar = dynamic(() => import('@/components/organisms/layout/Sidebar'), { ssr: false });

export function AnalyzingToast({ isAnalyzing }: { isAnalyzing: boolean }) {
  if (!isAnalyzing) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 bg-white/80 dark:bg-[#0b0b0f]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl rounded-2xl p-4 max-w-xs">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-primary">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-500 dark:text-zinc-400" />
      </div>
      <div className="flex flex-col min-w-0">
        <h4 className="text-xs font-bold text-foreground leading-none mb-1 select-none">
          Analyzing note
        </h4>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none">
          Classifying category...
        </p>
      </div>
    </div>
  );
}

export default function HomeTemplate() {
  const {
    unreadCounts,
    recentImports,
    categoryStats,
    isAnalyzing,
    totalNotesCount,
    handleCapture,
    handleUpload,
    handleSelectCategory,
    navigateToCategory,
  } = useHomeNotes();

  return (
    <div className="flex h-[100dvh] bg-background font-sans overflow-hidden">
      <Sidebar
        selectedCategory={null}
        onSelectCategory={handleSelectCategory}
        unreadCounts={unreadCounts}
      />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="w-full max-w-3xl mx-auto px-6 py-16 sm:px-12">
          <ImportHero />

          <div className="mb-12">
            <NoteInput
              onSubmit={handleCapture}
              onUpload={handleUpload}
              showCategorySelector
            />
          </div>

          <CategoryGrid
            unreadCounts={unreadCounts}
            categoryStats={categoryStats}
            onSelectCategory={navigateToCategory}
          />

          <RecentImportsList
            recentImports={recentImports}
            totalNotesCount={totalNotesCount}
            onSelectNoteCategory={navigateToCategory}
          />
        </div>
      </main>

      <AnalyzingToast isAnalyzing={isAnalyzing} />
    </div>
  );
}
