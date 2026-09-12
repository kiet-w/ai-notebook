'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Download, Settings, Soup, Terminal, BookOpen, Briefcase, Coins, Folder, Brain, LucideIcon, LogOut } from 'lucide-react';
import Button from '@/components/atoms/common/Button';
import Icon from '@/components/atoms/common/Icon';
import LanguageSwitcher from '@/components/atoms/common/LanguageSwitcher';
import { useI18n } from '@/hooks/useI18n';
import { api } from '@/utils/api';
import { useRouter } from 'next/navigation';

export interface SidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  unreadCounts?: Record<string, number>;
}

const CATEGORIES = [
  { id: 'Cooking', key: 'cooking', fallback: 'Cooking' },
  { id: 'Tech', key: 'tech', fallback: 'Tech' },
  { id: 'Learning', key: 'learning', fallback: 'Learning' },
  { id: 'Work', key: 'work', fallback: 'Work' },
  { id: 'Finance', key: 'finance', fallback: 'Finance' },
  { id: 'Other', key: 'other', fallback: 'Other' },
] as const;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Cooking: Soup,
  Tech: Terminal,
  Learning: BookOpen,
  Work: Briefcase,
  Finance: Coins,
  Other: Folder,
};

const Sidebar = memo(function Sidebar({ selectedCategory, onSelectCategory, unreadCounts }: SidebarProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <aside className="w-64 shrink-0 bg-sidebar dark:bg-[#09090b]/40 border-r border-zinc-200/50 dark:border-zinc-900/45 flex flex-col h-full sticky top-0 px-4 py-6 select-none backdrop-blur-md">
      <div className="flex items-center gap-2.5 px-2.5 py-2 mb-6 rounded-xl hover:bg-zinc-200/20 dark:hover:bg-zinc-900/30 border border-transparent hover:border-zinc-200/30 dark:hover:border-zinc-900/20 cursor-pointer group">
        <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 flex items-center justify-center shadow-md shadow-zinc-950/10 dark:shadow-none">
          <Icon icon={Brain} size={15} className="text-white dark:text-zinc-950 stroke-[2]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-[13px] text-foreground truncate leading-none mb-1">{t('sidebar.brandTitle')}</span>
          <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.18em] leading-none">{t('sidebar.workspace')}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <Button
          variant="nav"
          isActive={selectedCategory === null}
          onClick={() => onSelectCategory(null)}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <Icon icon={Download} className="w-4 h-4" />
              <span>{t('sidebar.importNav')}</span>
            </div>
          </div>
        </Button>

        <div className="mt-6 mb-2">
          <h2 className="px-3.5 font-mono text-[9px] tracking-[0.18em] uppercase text-zinc-400 dark:text-zinc-500 font-medium">
            {t('sidebar.categoriesTitle')}
          </h2>
        </div>
        
        {CATEGORIES.map((cat) => {
          const IconComponent = CATEGORY_ICONS[cat.id] || Folder;
          const unreadCount = unreadCounts?.[cat.id] || 0;
          const label = t(`categories.${cat.key}`) || cat.fallback;
          return (
            <Button
              key={cat.id}
              variant="nav"
              isActive={selectedCategory === cat.id}
              onClick={() => onSelectCategory(cat.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <Icon icon={IconComponent} className="w-4 h-4" />
                  <span>{label}</span>
                </div>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 dark:bg-emerald-500 px-1.5 text-[10px] font-bold text-white tabular-nums shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
            </Button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <LanguageSwitcher variant="compact" />
        <Button variant="ghost">
          <Icon icon={Settings} className="w-4 h-4" />
          <span>{t('sidebar.settings')}</span>
        </Button>
        <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-900/50">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-200/20 dark:hover:bg-zinc-900/30 border border-transparent hover:border-zinc-200/30 dark:hover:border-zinc-900/20 group/footer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0 flex items-center justify-center w-8.5 h-8.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                JD
                <span className="absolute bottom-0.5 right-0.5 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate leading-none mb-1">{t('sidebar.defaultUser')}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none">{t('sidebar.defaultEmail')}</span>
              </div>
            </div>
            
            <Link
              href="/auth/login"
              onClick={async () => {
                try {
                  await api.logout();
                } catch (error) {
                  console.warn(t('sidebar.logoutFailedWarning'), error);
                } finally {
                  router.push('/auth/login'); 
                }
              }}
              className="flex-shrink-0 p-1.5 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
              title={t('sidebar.logout')}
              aria-label={t('sidebar.logout')}
            >
              <Icon icon={LogOut} className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
