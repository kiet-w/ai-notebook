'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Inbox, AlertCircle } from 'lucide-react';
import NoteCard from '@/components/organisms/notes/NoteCard';
import Sidebar from '@/components/organisms/layout/Sidebar';
import { useCategoryNotes } from '@/hooks/useCategoryNotes';
import { useI18n } from '@/hooks/useI18n';
import { getCategoryLabel } from '@/utils/category';

const NoteDetailModal = dynamic(() => import('@/components/organisms/notes/NoteDetailModal'), {
  ssr: false,
});

export interface CategoryTemplateProps {
  category: string;
}

export default function CategoryTemplate({ category }: CategoryTemplateProps) {
  const { t } = useI18n();
  const {
    notes,
    groupedNotes,
    unreadCounts,
    activeNoteForModal,
    setActiveNoteForModal,
    observerRef,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    handleSelectCategory,
  } = useCategoryNotes(category);

  const localizedCategory = getCategoryLabel(category, t);

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <Sidebar
        selectedCategory={category}
        onSelectCategory={handleSelectCategory}
        unreadCounts={unreadCounts}
      />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="w-[90%] max-w-[1400px] mx-auto py-16">
          <header className="mb-12">
            <div className="mb-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {localizedCategory}
              </h1>
            </div>
            <p className="text-secondary-text text-lg font-medium max-w-xl">
              {t('categories.everythingTaggedAs', { category: localizedCategory })}
            </p>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {isLoading ? (
              <>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-sm animate-pulse h-48"
                  />
                ))}
              </>
            ) : isError ? (
              <div className="text-center py-20 border border-red-100 dark:border-red-900/20 bg-red-50/10 dark:bg-red-950/5 rounded-2xl p-8 max-w-md mx-auto col-span-full">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/25 text-red-50 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('categories.errorTitle')}</h3>
                <p className="text-secondary-text text-sm mb-6">
                  {t('categories.errorMessage')}
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-5 py-2.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                >
                  {t('categories.retryButton')}
                </button>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-32 border-2 border-dashed border-border rounded-2xl bg-zinc-50/30 dark:bg-zinc-900/10 col-span-full">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4 text-zinc-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t('categories.noNotesYet')}</h3>
                <p className="text-secondary-text max-w-xs mx-auto text-sm">
                  {t('categories.noNotesDesc', { category: localizedCategory })}
                </p>
              </div>
            ) : (
              groupedNotes.flatMap((group) => [
                <div
                  key={`header-${group.dateKey}`}
                  className="col-span-full flex items-center gap-4 mt-6 first:mt-0 mb-1 select-none"
                >
                  <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                    {group.label}
                  </span>
                  <div className="h-[1px] flex-1 bg-zinc-200/60 dark:bg-zinc-800/40" />
                </div>,
                ...group.notes.map((note) => (
                  <NoteCard key={note.id} note={note} onOpenModal={setActiveNoteForModal} />
                )),
              ])
            )}
          </div>

          {hasNextPage && !isError && notes.length > 0 && (
            <div ref={observerRef} className="w-full flex justify-center py-8">
              {isFetchingNextPage && (
                <div className="w-6 h-6 rounded-full border-2 border-zinc-350 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 animate-spin" />
              )}
            </div>
          )}
        </div>
      </main>

      {activeNoteForModal && (
        <NoteDetailModal
          note={activeNoteForModal}
          isOpen={!!activeNoteForModal}
          onClose={() => setActiveNoteForModal(null)}
        />
      )}
    </div>
  );
}
