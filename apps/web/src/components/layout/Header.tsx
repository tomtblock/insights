'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, Settings, User, Command, Activity } from 'lucide-react';
import { useStore } from '@/lib/store';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import clsx from 'clsx';

export function Header() {
  const [showSearch, setShowSearch] = useState(false);
  const healthStatus = useStore((s) => s.healthStatus);

  return (
    <header className="h-16 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Logo & Brand */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white">
              Arb<span className="text-emerald-400">Platform</span>
            </span>
            <p className="text-xs text-zinc-500 -mt-0.5">Market Intelligence</p>
          </div>
        </Link>
        
        {/* Health indicator */}
        <div className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
          healthStatus === 'green' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          healthStatus === 'yellow' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          healthStatus === 'red' && 'bg-red-500/10 text-red-400 border-red-500/20',
          (!healthStatus || healthStatus === 'unknown') && 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
        )}>
          <div className={clsx(
            'w-2 h-2 rounded-full',
            healthStatus === 'green' && 'bg-emerald-500 animate-pulse',
            healthStatus === 'yellow' && 'bg-amber-500 animate-pulse',
            healthStatus === 'red' && 'bg-red-500',
            (!healthStatus || healthStatus === 'unknown') && 'bg-zinc-500'
          )} />
          <Activity className="w-3 h-3" />
          {healthStatus === 'green' ? 'All Systems Live' :
           healthStatus === 'yellow' ? 'Degraded' :
           healthStatus === 'red' ? 'Read-Only Mode' :
           'Connecting...'}
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-2xl mx-8">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm flex-1 text-left">Search markets, events, stocks...</span>
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg text-xs text-zinc-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        <button className="relative p-2.5 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-zinc-950" />
        </button>
        <Link href="/settings" className="p-2.5 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </Link>
        <button className="ml-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium hidden md:block">User</span>
        </button>
      </div>

      {/* Global search modal */}
      {showSearch && (
        <GlobalSearch onClose={() => setShowSearch(false)} />
      )}
    </header>
  );
}
