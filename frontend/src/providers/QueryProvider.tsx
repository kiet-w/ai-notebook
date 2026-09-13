'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { normalizeNote, Note, getAccessToken } from '@/utils/api';
import { io, Socket } from 'socket.io-client';

const BASE_SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }));

  useEffect(() => {
    let socket: Socket | null = null;
    let isMounted = true;

    function connect() {
      if (socket) socket.disconnect();
      
      const token = getAccessToken();
      // Only connect if we have a token (user is logged in)
      if (!token) return;

      socket = io(BASE_SOCKET_URL, {
        query: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1500,
      });

      socket.on('note-updated', (payload) => {
        if (!isMounted) return;
        
        try {
          const updatedNote = normalizeNote(payload);
          
          let wasUpdatedInCache = false;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryClient.setQueriesData({ queryKey: ['notes'] }, (oldData: any) => {
            if (!oldData) return oldData;
            
            // Infinite query structure
            if (oldData.pages) {
              const newPages = oldData.pages.map((page: Note[]) => {
                const exists = page.some(n => n.id === updatedNote.id);
                if (exists) {
                  wasUpdatedInCache = true;
                  return page.map(n => n.id === updatedNote.id ? updatedNote : n);
                }
                return page;
              });
              return { ...oldData, pages: newPages };
            }
            
            // Flat array structure
            if (Array.isArray(oldData)) {
              const exists = oldData.some((n: Note) => n.id === updatedNote.id);
              if (exists) {
                wasUpdatedInCache = true;
                return oldData.map((n: Note) => n.id === updatedNote.id ? updatedNote : n);
              }
              return oldData;
            }
            
            return oldData;
          });

          // Nếu note không có sẵn trong cache HOẶC note vừa xử lý xong (COMPLETED)
          // thì force refetch toàn bộ query 'notes' để category tabs được cập nhật
          if (!wasUpdatedInCache || updatedNote.status === 'COMPLETED') {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
          }

          queryClient.invalidateQueries({ queryKey: ['unreadCounts'] });

        } catch (error) {
          console.warn('[WebSocket] Failed to parse note data:', error);
        }
      });

      socket.on('connect_error', (err) => {
        console.warn('[WebSocket] Connection attempt notice:', err.message);
      });
    }
    
    connect();

    // Auto-reconnect if token changes
    const handleTokenRefresh = () => {
      connect();
    };
    window.addEventListener('token_refreshed', handleTokenRefresh);

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
      window.removeEventListener('token_refreshed', handleTokenRefresh);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
