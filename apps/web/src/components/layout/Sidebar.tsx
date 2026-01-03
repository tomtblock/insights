'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  Target,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Compass,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import clsx from 'clsx';

const navItems = [
  { 
    section: 'Core',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/opportunities', label: 'Opportunities', icon: TrendingUp, badge: 'Live', badgeColor: 'emerald' },
      { href: '/markets', label: 'Markets', icon: Target },
    ]
  },
  {
    section: 'Intelligence',
    items: [
      { href: '/intelligence', label: 'Geo Monitor', icon: Globe, badge: 'New', badgeColor: 'red' },
      { href: '/events', label: 'Events', icon: Calendar },
      { href: '/topics', label: 'Topics', icon: Compass, badge: 'AI', badgeColor: 'purple' },
      { href: '/stocks', label: 'Stocks', icon: BarChart3 },
    ]
  },
  {
    section: 'Automation',
    items: [
      { href: '/rules', label: 'Rules', icon: Zap },
      { href: '/algorithm', label: 'Algorithm', icon: Activity },
    ]
  },
  {
    section: 'System',
    items: [
      { href: '/health', label: 'Health', icon: Shield },
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  return (
    <aside className={clsx(
      'flex flex-col border-r border-zinc-800/50 bg-zinc-950 transition-all duration-300 ease-in-out',
      sidebarCollapsed ? 'w-[68px]' : 'w-60'
    )}>
      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto no-scrollbar">
        {navItems.map((section, sectionIdx) => (
          <div key={section.section} className={clsx(sectionIdx > 0 && 'mt-6')}>
            {!sidebarCollapsed && (
              <h3 className="px-4 mb-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                {section.section}
              </h3>
            )}
            <ul className="space-y-1 px-3">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={clsx(
                        'w-5 h-5 flex-shrink-0',
                        isActive && 'text-emerald-400'
                      )} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-sm font-medium">{item.label}</span>
                          {item.badge && (
                            <span className={clsx(
                              'px-1.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide',
                              item.badgeColor === 'emerald' && 'bg-emerald-500/20 text-emerald-400',
                              item.badgeColor === 'purple' && 'bg-purple-500/20 text-purple-400',
                              item.badgeColor === 'blue' && 'bg-blue-500/20 text-blue-400',
                              item.badgeColor === 'red' && 'bg-red-500/20 text-red-400',
                              !item.badgeColor && 'bg-zinc-700 text-zinc-400'
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pro badge / CTA */}
      {!sidebarCollapsed && (
        <div className="px-3 pb-4">
          <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Pro Features</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Unlock advanced arbitrage detection and AI-powered insights.
            </p>
            <button className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 text-xs font-bold rounded-lg transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-12 border-t border-zinc-800/50 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <div className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Collapse</span>
          </div>
        )}
      </button>
    </aside>
  );
}
