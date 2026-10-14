import { useQueryClient } from '@tanstack/react-query';
import { MapPinned, RefreshCw } from 'lucide-react';
import { getListPlotsQueryKey, useListPlots } from '@workspace/api-client-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { PlotCard } from '@/components/PlotCard';

export function Plots() {
  const client = useQueryClient();
  const query = useListPlots({ query: { queryKey: getListPlotsQueryKey(), refetchOnWindowFocus: true } });
  const retry = () => void client.invalidateQueries({ queryKey: getListPlotsQueryKey() });
  if (query.isLoading) return <LoadingState label="Loading your field plots…" />;
  if (query.isError || !query.data) return <ErrorState onRetry={retry} />;
  return <div data-testid="page-plots"><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#9a722a]">Field sites · Western Area</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-.06em] sm:text-[40px]">Field plots</h1><p className="mt-2 text-sm text-[#728073]">Example soil and node conditions across demonstration plots.</p></div><button data-testid="button-refresh-plots" onClick={retry} className="inline-flex items-center gap-2 rounded-xl border border-[#ddd6c6] bg-[#faf8f1] px-4 py-2.5 text-xs font-bold text-[#4b6651] hover:bg-white"><RefreshCw size={14} />Refresh sample</button></div>
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#e2dac9] bg-[#faf8f0] px-4 py-3 text-xs text-[#718075]"><MapPinned size={16} className="text-[#a77a2a]" /><span><strong className="text-[#385742]">{query.data.length} demonstration plots</strong> · live sensors are not connected.</span></div>
    {query.data.length === 0 ? <EmptyState title="No plots connected yet" detail="Your fields will show here after the first sensor node is registered." /> : <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{query.data.map((plot) => <PlotCard key={plot.id} plot={plot} />)}</div>}
  </div>;
}
