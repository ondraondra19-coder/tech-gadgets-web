'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Review } from '@/lib/reviews';
import type { PublicAccount } from '@/lib/accounts';
import type { CurrentSession } from '@/lib/session';
import type { Permission } from '@/lib/permissions';
import type { Product } from '@/lib/products';
import ReviewsAdminList from './recenze/ReviewsAdminList';
import AccountsAdminPanel from './AccountsAdminPanel';
import ProductsAdminList from './ProductsAdminList'; // 1. Import komponenty

type Tab = 'dashboard' | 'reservations' | 'products' | 'reviews' | 'messages' | 'settings' | 'analytics' | 'accounts';

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

// 2. Rozšíření props o produkty a sklad
type AdminDashboardProps = {
  session: CurrentSession;
  initialReviews: Review[];
  initialAccounts: PublicAccount[];
  products: Product[];
  initialStock: Record<string, number>;
};

export default function AdminDashboard({ 
  session, 
  initialReviews, 
  initialAccounts, 
  products, 
  initialStock 
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);
  const [accounts, setAccounts] = useState(initialAccounts);
  const router = useRouter();

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const hasPermission = (perm: Permission) => session.isMain || session.permissions.includes(perm);

  const allMenuItems: { id: Tab; label: string; icon: React.ReactNode; visible: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      visible: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
      ),
    },
    {
      id: 'reservations',
      label: 'Objednávky',
      visible: hasPermission('reservations'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
      ),
    },
    {
      id: 'products',
      label: 'Produkty',
      visible: hasPermission('products'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
      ),
    },
    {
      id: 'reviews',
      label: 'Recenze',
      visible: hasPermission('reviews'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.381-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
      ),
    },
    {
      id: 'messages',
      label: 'Zprávy',
      visible: hasPermission('messages'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytika',
      visible: hasPermission('analytics'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M8 17V9m4 8V5m4 12v-6" /></svg>
      ),
    },
    {
      id: 'settings',
      label: 'Nastavení',
      visible: hasPermission('settings'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
      ),
    },
    {
      id: 'accounts',
      label: 'Správa účtů',
      visible: session.isMain,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
      ),
    },
  ];

  const menuItems = allMenuItems.filter((item) => item.visible);

  return (
    <div className="flex h-screen bg-[#f7f6f4] text-[#0f0f10] font-sans antialiased overflow-hidden selection:bg-primary/10 selection:text-primary">

      {/* 1. LEVÁ LIŠTA (SIDEBAR) */}
      <aside className="w-64 bg-[#1c1c1c] text-[#fafafa] flex flex-col justify-between z-20 shadow-xl">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-white/[0.05]">
            <div className="flex items-baseline font-bold tracking-tight text-lg">
              <span>Tech</span>
              <span className="text-primary">Gadgets</span>
              <span className="ml-1.5 text-[9px] font-mono font-medium bg-white/10 text-zinc-400 px-1 py-0.5 rounded uppercase tracking-wider">
                Admin
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-zinc-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.id === 'reviews' && reviews.length > 0 && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-zinc-400'
                      }`}
                    >
                      {reviews.length}
                    </span>
                  )}
                  {item.id === 'accounts' && accounts.length > 0 && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-zinc-400'
                      }`}
                    >
                      {accounts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/[0.05] text-[10px] text-zinc-600 font-mono text-center">
          CONSOLE // ACTIVE
        </div>
      </aside>

      {/* PRAVÁ STRANA (HEADER + OBSAH) */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 2. HORNÍ LIŠTA (HEADER) */}
        <header className="h-16 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-8 z-10 shadow-sm">

          <div className="relative w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Hledat v administraci..."
              className="w-full bg-[#f1f1f3] border border-[#e5e7eb] rounded-xl pl-9 pr-4 py-2 text-xs text-[#0f0f10] placeholder-zinc-400 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-1.5 hover:bg-[#f1f1f3] rounded-xl transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-[#1c1c1c] text-white flex items-center justify-center font-bold text-xs">
                {getInitials(session.name)}
              </div>
              <span className="text-xs font-semibold text-[#0f0f10] hidden sm:inline">{session.name}</span>
              <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />

                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e5e7eb] rounded-xl shadow-xl py-1 z-20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                  <div className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider text-zinc-400 border-b border-[#e5e7eb]">
                    {session.isMain ? 'Hlavní účet' : 'Správa účtu'}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs text-primary hover:bg-red-50 flex items-center space-x-2 transition-colors font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>Odhlásit se</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* 3. HLAVNÍ PLOCHA (OBSAH PODLE SEKCE) */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#f7f6f4]">
          <div className="max-w-4xl mx-auto">

            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight text-[#0f0f10] capitalize">
                {activeTab === 'dashboard' ? 'Přehled' : menuItems.find(i => i.id === activeTab)?.label}
              </h1>
            </div>

            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 min-h-[400px] flex flex-col justify-between shadow-sm relative overflow-hidden">

              <div className={activeTab === 'reviews' || activeTab === 'accounts' ? 'w-full' : undefined}>
                {activeTab === 'dashboard' && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-[#0f0f10]">Vítej na administraci Tech Gadgets</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-md">Zde brzy uvidíš grafy prodejů, rychlé přehledy a upozornění na nízké zásoby doplňků na skladě.</p>
                  </div>
                )}

                {activeTab === 'reservations' && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-[#0f0f10]">Přehled objednávek</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-lg">Tady se ti načtou lidé, co odeslali košík. Budeš tu moct jedním kliknutím měnit stavy rezervace:</p>
                    <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold">
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md">Zabalená</span>
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md">Odeslaná</span>
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-md">Na cestě</span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md">Doručená</span>
                    </div>
                  </div>
                )}

                {/* 3. Zde proběhla výměna textu za novou tabulku */}
                {activeTab === 'products' && (
                  <ProductsAdminList products={products} stock={initialStock} />
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-md">
                      Výpis hodnocení, která lidé zanechali u tvých gadgetů. Nevhodné nebo spamové komentáře odsud smažeš.
                    </p>
                    <ReviewsAdminList
                      reviews={reviews}
                      onDeleted={(id) => setReviews((prev) => prev.filter((r) => r.id !== id))}
                    />
                  </div>
                )}

                {activeTab === 'messages' && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-[#0f0f10]">Zprávy z formuláře</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-md">Dotazy uživatelů, které přijdou přes kontaktní sekci e-shopu (kompatibilita, dotazy na naskladnění).</p>
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-[#0f0f10]">Analytika</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-md">Zde brzy uvidíš grafy tržeb, návštěvnosti a nejprodávanějších produktů.</p>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-[#0f0f10]">Globální nastavení</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-md">Nastavení cen dopravy, přepínání Stripe platebního prostředí a úprava kontaktních informací.</p>
                  </div>
                )}

                {activeTab === 'accounts' && session.isMain && (
                  <div className="space-y-4">
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-lg">
                      Vytvářej účty pro zaměstnance a uděluj jim přístup jen k těm sekcím, které potřebují.
                    </p>
                    <AccountsAdminPanel accounts={accounts} onChange={setAccounts} />
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#e5e7eb] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>ACTIVE_ROUTE</span>
                <span className="text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                  /admin/{activeTab}
                </span>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}