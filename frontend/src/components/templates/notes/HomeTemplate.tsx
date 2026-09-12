'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import NoteInput from '@/components/molecules/notes/NoteInput';
import AnalyzingToast from '@/components/molecules/notes/AnalyzingToast';
import { useHomeNotes } from '@/hooks/useHomeNotes';
import { ImportHero, CategoryGrid, RecentImportsList } from '@/components/organisms/notes';

const Sidebar = dynamic(() => import('@/components/organisms/layout/Sidebar'), { ssr: false });

export default function HomeTemplate() {
  const {
    unreadCounts,
    recentImports,
    categoryStats,
    availableCategories,
    isAnalyzing,
    totalNotesCount,
    handleCapture,
    handleUpload,
    handleSelectCategory,
    navigateToCategory,
    handleCreateCategory,
  } = useHomeNotes();

  return (
    <div className="flex h-[100dvh] bg-background font-sans overflow-hidden">
      <Sidebar
        selectedCategory={null}
        onSelectCategory={handleSelectCategory}
        unreadCounts={unreadCounts}
        categories={availableCategories}
      />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="w-full max-w-3xl mx-auto px-6 py-16 sm:px-12">
          <ImportHero onCreateCategory={handleCreateCategory} />

          <div className="mb-12">
            <NoteInput
              onSubmit={handleCapture}
              onUpload={handleUpload}
              showCategorySelector
              categories={availableCategories}
            />
          </div>

          <CategoryGrid
            unreadCounts={unreadCounts}
            categoryStats={categoryStats}
            categories={availableCategories}
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
