'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api, Note } from '@/utils/api';
import { Category } from '@/types/note';
import { groupNotesByDate, GroupedNotes } from '@/utils/date';

export function useCategoryNotes(category: string) {
  const router = useRouter();
  const [activeNoteForModal, setActiveNoteForModal] = useState<Note | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data: unreadCounts = {} as Record<string, number> } = useQuery<Record<string, number>>({
    queryKey: ['unreadCounts'],
    queryFn: () => api.fetchUnreadCounts(),
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['notes', 'category', category],
    queryFn: ({ pageParam }) => api.fetchNotes(category as Category, 25, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.length === 25 ? lastPage[lastPage.length - 1].id : undefined),
  });

  const notes = useMemo<Note[]>(() => data?.pages.flat() || [], [data]);

  useEffect(() => {
    const currentTarget = observerRef.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage && hasNextPage && !isLoading) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, isFetchingNextPage, hasNextPage, isLoading]);

  const groupedNotes = useMemo<GroupedNotes[]>(() => {
    return groupNotesByDate(notes);
  }, [notes]);

  const handleSelectCategory = useCallback(
    (cat: string | null) => {
      if (cat) {
        router.push(`/${cat}`);
      } else {
        router.push('/');
      }
    },
    [router]
  );

  const getCategoryIcon = useCallback(() => {
    switch (category) {
      case 'Cooking':
        return '🍳';
      case 'Tech':
        return '💻';
      case 'Learning':
        return '📚';
      case 'Work':
        return '💼';
      case 'Finance':
        return '💰';
      case 'Other':
        return '📝';
      default:
        return '🧠';
    }
  }, [category]);

  return {
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
    getCategoryIcon,
  };
}
