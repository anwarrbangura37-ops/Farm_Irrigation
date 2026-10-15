import { type ReactNode } from 'react';
import { AlertTriangle, Check, RefreshCw } from 'lucide-react';

export function Panel({ children, className = '', testId }: { children: ReactNode; className?: string; testId?: string }) {
  return <section data-testid={testId} className={`rounded-2xl border border-[#e6dfd0] bg-[#fbf9f2] shadow-[0_5px_18px_rgba(58,65,44,.035)] ${className}`}>{children}</section>;
}

export function StatusBadge({ status, testId }: { status: string; testId?: string }) {
  const label = status === 'NO_DATA' ? 'No readings' : status === 'NEEDS_WATER' ? 'Needs water' : status === 'OPTIMAL' ? 'Optimal' : 'Watch';
  const tone = status === 'NO_DATA' ? 'bg-[#e9e7de] text-[#667064]' : status === 'NEEDS_WATER' ? 'bg-[#f9e5dc] text-[#a54830]' : status === 'OPTIMAL' ? 'bg-[#e3eee1] text-[#356342]' : 'bg-[#f7ebcf] text-[#8d6418]';
  return <span data-testid={testId || `status-plot-${status.toLowerCase()}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[.02em] ${tone}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

export function LoadingState({ label = 'Reading the field…' }: { label?: string }) {
  return <div data-testid="state-loading" className="space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-[#e9e3d5]" /><div className="h-44 animate-pulse rounded-2xl bg-[#e9e3d5]" /><p className="text-sm text-[#778276]">{label}</p></div>;
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div data-testid="state-error" className="flex flex-col items-start gap-3 rounded-2xl border border-[#e6c6b8] bg-[#fbf3ed] p-6"><div className="flex items-center gap-2 font-bold text-[#8b422e]"><AlertTriangle size={18} />The field data did not come through.</div><p className="text-sm text-[#6f625a]">Check your connection and try syncing again.</p><button data-testid="button-retry" onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-[#244c38] px-4 py-2 text-sm font-semibold text-white hover:bg-[#193b2a]"><RefreshCw size={15} />Try again</button></div>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div data-testid="state-empty" className="rounded-2xl border border-dashed border-[#d8cfbd] bg-[#f7f3e9] px-6 py-14 text-center"><span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#e8eee3] text-[#34583d]"><Check size={20} /></span><h3 className="font-display text-lg font-bold">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#718075]">{detail}</p></div>;
}

export function Metric({ label, value, note, accent = false }: { label: string; value: string | number; note: string; accent?: boolean }) {
  return <Panel className="p-5"><p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#788377]">{label}</p><div data-testid={`metric-${label.toLowerCase().replace(/ /g, '-')}`} className={`mt-3 font-display text-3xl font-extrabold tracking-[-.05em] ${accent ? 'text-[#b67d1f]' : 'text-[#244a37]'}`}>{value}</div><p className="mt-1 text-xs text-[#7c877b]">{note}</p></Panel>;
}
