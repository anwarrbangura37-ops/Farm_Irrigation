import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { Activity, Bell, ChartNoAxesCombined, ChevronDown, ChevronRight, CircleHelp, Droplets, LogOut, Menu, Sprout, X } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: Activity },
  { href: '/plots', label: 'Field plots', icon: Sprout },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/reports', label: 'Weekly report', icon: ChartNoAxesCombined },
];

export function Shell({ children }: { children: ReactNode }) {
  const [path] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const isAdmin = user?.emailAddresses.some((address) => address.emailAddress.toLowerCase() === 'koromajoel933@gmail.com' && address.verification?.status === 'verified') ?? false;
  const initials = user?.firstName?.slice(0, 1) || email.slice(0, 1).toUpperCase() || 'F';

  return <div className="min-h-[100dvh] bg-[#f4f0e5] md:flex">
    {mobileOpen && <button aria-label="Close navigation" data-testid="button-close-menu-backdrop" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-[#10281d]/50 md:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#1d4733] px-5 py-6 text-[#f3f0e5] transition-transform duration-300 md:sticky md:top-0 md:h-[100dvh] md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3" data-testid="link-brand-sidebar">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Sierra Leone flag" data-testid="img-sierra-leone-flag" className="h-10 w-10 rounded-xl shadow-sm" />
          <span><span className="block font-display text-[17px] font-extrabold tracking-[-.04em]">Farm-Irrigation</span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.16em] text-[#bbcfbc]">Field intelligence</span></span>
        </Link>
        <button aria-label="Close navigation" data-testid="button-close-menu" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-[#d0dece] hover:bg-white/10 md:hidden"><X size={19} /></button>
      </div>
      <div className="mt-10 rounded-xl border border-white/10 bg-white/[.06] p-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#e5eddf]"><span className="h-2 w-2 rounded-full bg-[#e9b150]" />Western Area demonstration plots</div>
        <p className="mt-2 pl-4 text-[11px] text-[#adc2b1]">Sierra Leone · sample field data</p>
      </div>
      <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#98b19b]">Farm management</p>
      <nav aria-label="Main navigation" className="space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = path === item.href || (item.href === '/plots' && path.startsWith('/plots/'));
          return <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replace(/ /g, '-')}`} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors ${active ? 'bg-[#f2bd59] text-[#254430] shadow-sm' : 'text-[#d0ddcf] hover:bg-white/[.08] hover:text-white'}`}><Icon size={17} strokeWidth={2.1} />{item.label}{active && <ChevronRight className="ml-auto" size={15} />}</Link>;
        })}
      </nav>
      <div className="mt-auto">
        <div className="mb-4 rounded-2xl bg-[#153b2a] p-4">
          <div className="flex items-center gap-2"><Droplets size={16} className="text-[#f0b64f]" /><span className="text-xs font-bold">Field note</span></div>
          <p className="mt-2 text-xs leading-5 text-[#b6c9b8]">Example readings show how field conditions and watering decisions can appear.</p>
        </div>
        <div className="flex items-center gap-3 border-t border-white/10 pt-4">
          <div data-testid="avatar-user" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8b453] text-sm font-extrabold text-[#234731]">{initials}</div>
          <div className="min-w-0 flex-1"><p data-testid="text-user-name" className="truncate text-xs font-bold">{user?.fullName || 'Field officer'}</p><div className="mt-0.5 flex items-center gap-1.5"><span className="truncate text-[10px] text-[#adbfaf]">{isAdmin ? 'Admin' : 'Field team'}</span>{isAdmin && <span data-testid="badge-admin" className="rounded bg-[#f2bd59]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#f2bd59]">ADMIN</span>}</div></div>
          <button type="button" aria-label="Sign out" data-testid="button-sign-out" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })} className="rounded-lg p-2 text-[#b7c9b8] hover:bg-white/10 hover:text-white"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#e6dfd0] bg-[#f4f0e5]/90 px-4 backdrop-blur-md sm:px-7 lg:px-10">
        <div className="flex items-center gap-3"><button aria-label="Open navigation" data-testid="button-open-menu" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-[#284a37] hover:bg-[#e9e3d5] md:hidden"><Menu size={20} /></button><div className="flex items-center gap-2 text-xs text-[#778276]"><span className="hidden sm:inline">Farm</span><ChevronRight size={13} className="hidden sm:block" /><span className="font-semibold text-[#365541]">{path === '/dashboard' ? 'Overview' : path.startsWith('/plots/') ? 'Plot twin' : nav.find((item) => item.href === path)?.label || 'Field'}</span></div></div>
        <div className="flex items-center gap-2"><span data-testid="badge-demo-telemetry" className="inline-flex items-center gap-2 rounded-full bg-[#f4e7c8] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#82601f]"><span className="h-1.5 w-1.5 rounded-full bg-[#d49d37]" />Demo data</span><button data-testid="button-help" onClick={() => window.location.assign('mailto:field-support@farm-irrigation.sl')} className="inline-flex items-center gap-2 rounded-lg border border-[#dfd8c9] px-3 py-2 text-xs font-semibold text-[#536759] hover:bg-[#fbf9f2]"><CircleHelp size={15} /><span className="hidden sm:inline">Help</span></button><ChevronDown size={15} className="text-[#788377]" /></div>
      </header>
      <div data-testid="notice-demo-data" className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-[#eadbb6] bg-[#f8f0dc] px-4 py-3 text-[11px] leading-5 text-[#765d2b] sm:mx-7 lg:mx-10"><span className="mt-0.5 shrink-0 font-extrabold uppercase tracking-[.09em]">Demo</span><span>Plots, telemetry, alerts, forecasts and reports are sample data for demonstration; they are not live or field-validated readings.</span></div>
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-7 sm:px-7 lg:px-10 lg:pt-9 page-enter">{children}</div>
    </main>
  </div>;
}
