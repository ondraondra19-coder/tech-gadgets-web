'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Review } from '@/lib/reviews';
import type { PublicAccount } from '@/lib/accounts';
import type { CurrentSession } from '@/lib/session';
import type { Permission } from '@/lib/permissions';
import type { Product } from '@/lib/products';
import type { Message } from '@/lib/messages';
import type { Claim } from '@/lib/claims';
import type { Discount } from '@/lib/discounts';
import ReviewsAdminList from './recenze/ReviewsAdminList';
import AccountsAdminPanel from './AccountsAdminPanel';
import DiscountsAdminPanel from './DiscountsAdminPanel';
import ProductsAdminList from './ProductsAdminList';
import MessagesAdminList from './MessagesAdminList';
import ClaimsAdminList from './ClaimsAdminList';
import AnalyticsPanel from './AnalyticsPanel';
import CampaignsPanel from './CampaignsPanel';
import OrdersAdminList from './OrdersAdminList';
import MagazinAdminList from './MagazinAdminList';
import DashboardHome from './DashboardHome';
import AdminSearch from './AdminSearch';

export type Tab = 'dashboard' | 'reservations' | 'products' | 'reviews' | 'messages' | 'claims' | 'settings' | 'analytics' | 'discounts' | 'campaigns' | 'accounts';

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

type AdminDashboardProps = {
  session: CurrentSession;
  initialReviews: Review[];
  initialAccounts: PublicAccount[];
  initialDiscounts: Discount[];
  products: Product[];
  productDiscounts: Record<string, number>;
  initialStock: Record<string, number>;
};

export default function AdminDashboard({
  session,
  initialReviews,
  initialAccounts,
  initialDiscounts,
  products,
  productDiscounts,
  initialStock
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [productsQuery, setProductsQuery] = useState<string | undefined>(undefined);
  const [ordersFocusId, setOrdersFocusId] = useState<string | undefined>(undefined);
  const [reviews, setReviews] = useState(initialReviews);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [messages, setMessages] = useState<Message[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const router = useRouter();

  const hasPermission = (perm: Permission) => session.isMain || session.permissions.includes(perm);
  const canSeeMessages = hasPermission('messages');
  const canSeeClaims = hasPermission('claims');

  // Jakmile admin odejde ze záložky, na kterou ho navedlo hledání, zapomeneme
  // cílový produkt/objednávku — ať se při dalším příchodu na tab (přes menu,
  // ne přes hledání) neotvírá pořád ten samý starý výsledek.
  //
  // Dřív to byl useEffect nad [activeTab], jenže ten běží až PO renderu: nová
  // záložka se stihla jednou vykreslit ještě se starým cílem hledání. Úprava
  // stavu přímo v renderu je na reakci na změnu doporučený postup Reactu —
  // přepočítá se hned, bez commitu mezikroku.
  const [prevTab, setPrevTab] = useState(activeTab);
  if (activeTab !== prevTab) {
    setPrevTab(activeTab);
    if (activeTab !== 'products') setProductsQuery(undefined);
    if (activeTab !== 'reservations') setOrdersFocusId(undefined);
  }

  // Zprávy z chat widgetu — natáhnou se hned po přihlášení, ať se počet
  // nepřečtených v levém menu ukáže i bez otevření záložky "Zprávy".
  useEffect(() => {
    if (!canSeeMessages) return;

    let cancelled = false;
    fetch('/api/admin/messages', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMessages(data.messages ?? []);
      })
      .catch(() => {
        // Tiše ignorujeme — záložka "Zprávy" ukáže prázdný stav, není kritické.
      });

    return () => {
      cancelled = true;
    };
  }, [canSeeMessages]);

  // Reklamace — stejný důvod jako u zpráv: počet otevřených se má ukázat
  // v levém menu i bez otevření záložky.
  useEffect(() => {
    if (!canSeeClaims) return;

    let cancelled = false;
    fetch('/api/admin/claims', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setClaims(data.claims ?? []);
      })
      .catch(() => {
        // Tiše ignorujeme — záložka ukáže prázdný stav, není kritické.
      });

    return () => {
      cancelled = true;
    };
  }, [canSeeClaims]);

  const unreadMessagesCount = messages.filter((m) => !m.read).length;
  const openClaimsCount = claims.filter((c) => c.status !== 'vyrizeno').length;

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

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
      id: 'claims',
      label: 'Reklamace',
      visible: hasPermission('claims'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
      label: 'Magazín',
      visible: hasPermission('settings'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
      ),
    },
    {
      id: 'discounts',
      label: 'Slevové kódy',
      visible: hasPermission('discounts'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
      ),
    },
    {
      id: 'campaigns',
      label: 'Kampaně',
      visible: hasPermission('campaigns'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
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
    <div className="flex h-screen bg-[#f7f6f4] text-[#0f0f10] font-sans antialiased overflow-hidden selection:bg-primary/10 selection:text-primary-ink">

      {/* Overlay pro zavření sidebaru na mobilu kliknutím mimo — stejný vzor jako profil dropdown níže */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 1. LEVÁ LIŠTA (SIDEBAR) — na mobilu výsuvný panel, na desktopu napevno vlevo */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#1c1c1c] text-[#fafafa] flex flex-col justify-between shadow-xl transition-transform duration-200 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.05]">
            <div className="flex items-baseline font-bold tracking-tight text-lg">
              <span>Hack</span>
              <span className="text-primary">Pack</span>
              <span className="ml-1.5 text-[9px] font-mono font-medium bg-white/10 text-zinc-400 px-1 py-0.5 rounded uppercase tracking-wider">
                Admin
              </span>
            </div>
            <button
              className="lg:hidden p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Zavřít menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
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
                  {item.id === 'messages' && unreadMessagesCount > 0 && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-zinc-400'
                      }`}
                    >
                      {unreadMessagesCount}
                    </span>
                  )}
                  {item.id === 'claims' && openClaimsCount > 0 && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-zinc-400'
                      }`}
                    >
                      {openClaimsCount}
                    </span>
                  )}
                  {item.id === 'discounts' && discounts.length > 0 && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-zinc-400'
                      }`}
                    >
                      {discounts.length}
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
        <header className="h-16 bg-white border-b border-[#e5e7eb] flex items-center justify-between gap-3 px-4 sm:px-8 z-10 shadow-sm">

          <button
            className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-[#0f0f10] transition-colors shrink-0"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Otevřít menu"
          >
            <Menu size={22} />
          </button>

          <AdminSearch
            products={products}
            canSeeOrders={hasPermission('reservations')}
            canSeeMagazin={hasPermission('settings')}
            onSelectProduct={(product) => { setProductsQuery(product.name); setActiveTab('products'); }}
            onSelectOrder={(order) => { setOrdersFocusId(order.id); setActiveTab('reservations'); }}
            onSelectPost={() => setActiveTab('settings')}
          />

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
                    className="w-full text-left px-4 py-2.5 text-xs text-primary-ink hover:bg-red-50 flex items-center space-x-2 transition-colors font-semibold"
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f7f6f4]">
          <div className="max-w-4xl mx-auto">

            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight text-[#0f0f10] capitalize">
                {activeTab === 'dashboard' ? 'Přehled' : menuItems.find(i => i.id === activeTab)?.label}
              </h1>
            </div>

            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 min-h-[400px] flex flex-col justify-between shadow-sm relative overflow-hidden">

              <div className={activeTab === 'reviews' || activeTab === 'accounts' || activeTab === 'discounts' || activeTab === 'messages' || activeTab === 'claims' || activeTab === 'campaigns' ? 'w-full' : undefined}>
                {activeTab === 'dashboard' && (
                  <DashboardHome
                    products={products}
                    stock={initialStock}
                    canSeeOrders={hasPermission('reservations')}
                    canSeeAnalytics={hasPermission('analytics')}
                    canSeeProducts={hasPermission('products')}
                    onNavigate={setActiveTab}
                  />
                )}

                {activeTab === 'reservations' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#0f0f10]">Objednávky</h3>
                    <OrdersAdminList initialExpandId={ordersFocusId} />
                  </div>
                )}

                {activeTab === 'products' && (
                  <ProductsAdminList products={products} stock={initialStock} discounts={productDiscounts} initialQuery={productsQuery} />
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
                  <div className="space-y-4">
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-md">
                      Dotazy uživatelů odeslané přes chat widget na e-shopu (kompatibilita, dotazy na naskladnění).
                    </p>
                    <MessagesAdminList messages={messages} onChange={setMessages} />
                  </div>
                )}

                {activeTab === 'claims' && hasPermission('claims') && (
                  <div className="space-y-4">
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-lg">
                      Reklamace, vrácení a výměny odeslané přes formulář na /reklamace. Číslo případu
                      dostal zákazník e-mailem a odkazuje se na něj — proto ho měň jen výjimečně.
                    </p>
                    <ClaimsAdminList claims={claims} onChange={setClaims} />
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#0f0f10]">Analytika</h3>
                    <AnalyticsPanel />
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#0f0f10]">Magazín</h3>
                    <MagazinAdminList />
                  </div>
                )}

                {activeTab === 'discounts' && hasPermission('discounts') && (
                  <div className="space-y-4">
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-lg">
                      Vytvářej slevové kódy pro zákazníky — procentuální nebo pevnou částku, s volitelným
                      minimem objednávky a datem platnosti.
                    </p>
                    <DiscountsAdminPanel discounts={discounts} onChange={setDiscounts} />
                  </div>
                )}

                {activeTab === 'campaigns' && hasPermission('campaigns') && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#0f0f10]">Kampaně</h3>
                    <CampaignsPanel />
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
                <span className="text-primary-ink bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
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