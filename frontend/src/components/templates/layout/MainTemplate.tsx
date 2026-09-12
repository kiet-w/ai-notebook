import React from 'react';

export interface MainTemplateProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function MainTemplate({ sidebar, children }: MainTemplateProps) {
  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {sidebar}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {children}
      </main>
    </div>
  );
}
