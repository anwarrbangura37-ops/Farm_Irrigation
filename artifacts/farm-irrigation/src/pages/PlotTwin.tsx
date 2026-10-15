import { useState } from 'react';
import { useUser } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Clock3, Droplets, Gauge, Radio, RefreshCw, Thermometer, Waves } from 'lucide-react';
import { getGetFarmDashboardQueryKey, getGetPlotTwinQueryKey, getListPlotsQueryKey, useControlIrrigation, useGetPlotTwin } from '@workspace/api-client-react';
import { Panel, StatusBadge, ErrorState, LoadingState } from '@/components/ui';
import { hasFarmAdminAccess } from '@/lib/farmPermissions';

function MoistureChart({ history, forecast }: { history: { time: string; moisturePct: number }[]; forecast: { time: string; moisturePct: number }[] }) {
  const points = [...history, ...forecast];
  const width = 700;
  const height = 210;
  const coords = points.map((point, index) => ({ x: 24 + (index / Math.max(points.length - 1, 1)) * (width - 48), y: height - 26 - Math.max(0, Math.min(100, point.moisturePct)) * 1.55 }));
  const split = history.length;
  const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const forecastLine = coords.slice(Math.max(split - 1, 0)).map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  if (points.length === 0) {
    return (
      <div
        data-testid="chart-moisture-empty"
        className="flex min-h-52 items-center justify-center rounded-xl bg-[#f5f2e9] px-6 text-center text-sm leading-6 text-[#788377]"
      >
        No sensor readings are available for this plot yet.
      </div>
    );
  }
  return <div data-testid="chart-moisture-twin"><svg role="img" aria-label="Example soil moisture history and illustrative forecast chart" viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
    {[20, 40, 60, 80].map((value) => <g key={value}><line x1="24" x2={width - 20} y1={height - 26 - value * 1.55} y2={height - 26 - value * 1.55} stroke="#e4e2d7" strokeDasharray="4 6" /><text x="0" y={height - 22 - value * 1.55} fill="#859084" fontSize="10">{value}%</text></g>)}
    {split > 0 && <path d={line} fill="none" stroke="#518056" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
    {forecast.length > 0 && <path d={forecastLine} fill="none" stroke="#dda83f" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 7" />}
    {coords.map((point, index) => <circle key={`${index}-${point.x}`} cx={point.x} cy={point.y} r={index === split - 1 ? 5 : 3} fill={index >= split ? '#dda83f' : '#518056'} stroke="#faf9f2" strokeWidth="2" />)}
    <text x="24" y={height - 5} fill="#879085" fontSize="10">Example history</text><text x={width - 95} y={height - 5} fill="#879085" fontSize="10">Outlook →</text>
  </svg></div>;
}

export function PlotTwin() {
  const params = useParams<{ plotId: string }>();
  const plotId = params.plotId || '';
  const queryClient = useQueryClient();
  const { user } = useUser();
  const isVerifiedAdmin = hasFarmAdminAccess(user?.emailAddresses);
  const [duration, setDuration] = useState(30);
  const twinQuery = useGetPlotTwin(plotId, { query: { queryKey: getGetPlotTwinQueryKey(plotId), enabled: Boolean(plotId), refetchOnWindowFocus: true } });
  const control = useControlIrrigation({ mutation: { onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: getGetPlotTwinQueryKey(plotId) });
    void queryClient.invalidateQueries({ queryKey: getGetFarmDashboardQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListPlotsQueryKey() });
  } } });
  const retry = () => void queryClient.invalidateQueries({ queryKey: getGetPlotTwinQueryKey(plotId) });
  if (twinQuery.isLoading) return <LoadingState label="Building the field twin…" />;
  if (twinQuery.isError || !twinQuery.data) return <ErrorState onRetry={retry} />;
  const twin = twinQuery.data;
  const plot = twin.plot;
  const activate = () => control.mutate({ plotId, data: { command: plot.pumpActive ? 'STOP' : 'START', durationMinutes: plot.pumpActive ? undefined : duration } });
  const combined = [...twin.history, ...twin.forecast];
  const latest = combined[combined.length - 1]?.time;
  return <div data-testid="page-plot-twin" className="space-y-6">
    <Link href="/plots" data-testid="link-back-plots" className="inline-flex items-center gap-2 text-xs font-bold text-[#627365] hover:text-[#365b40]"><ArrowLeft size={14} />All plots</Link>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#9a722a]">{plot.crop} · {plot.location} · {plot.areaHectares} hectares · sample plot</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="font-display text-3xl font-extrabold tracking-[-.06em] sm:text-[40px]">{plot.name}</h1><StatusBadge status={plot.status} testId={`status-plot-${plot.id}`} /></div><p className="mt-2 text-sm text-[#728073]">Demonstration field twin · {plot.nodeId ? `Node ${plot.nodeId}` : 'No sensor connected'} · example status: {plot.nodeStatus.toLowerCase()}</p></div><button data-testid="button-sync-twin" onClick={retry} className="inline-flex items-center gap-2 rounded-xl border border-[#ddd6c6] bg-[#faf8f1] px-4 py-2.5 text-xs font-bold text-[#4b6651] hover:bg-white"><RefreshCw size={14} />Refresh sample</button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Panel className="flex items-center gap-4 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5eddf] text-[#436a4a]"><Droplets size={19} /></div><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#788377]">Soil moisture · demo</p><p data-testid="value-moisture-current" className="mt-1 font-display text-2xl font-extrabold tracking-[-.05em]">{plot.moisturePct === null ? '—' : `${plot.moisturePct}%`}</p></div></Panel><Panel className="flex items-center gap-4 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5e9cc] text-[#a67927]"><Clock3 size={19} /></div><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#788377]">Wilting estimate · demo</p><p data-testid="value-hours-wilting" className="mt-1 font-display text-2xl font-extrabold tracking-[-.05em]">{twin.hoursToWilting === null ? '—' : twin.hoursToWilting}<span className="ml-1 text-sm">{twin.hoursToWilting === null ? '' : 'hours'}</span></p></div></Panel><Panel className="flex items-center gap-4 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0e9df] text-[#816e53]"><Thermometer size={19} /></div><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#788377]">Air temperature · demo</p><p className="mt-1 font-display text-2xl font-extrabold tracking-[-.05em]">{plot.temperatureC === null ? '—' : plot.temperatureC}<span className="ml-1 text-sm">{plot.temperatureC === null ? '' : '°C'}</span></p></div></Panel><Panel className="flex items-center gap-4 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7eee8] text-[#456a52]"><Gauge size={19} /></div><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#788377]">VPD · sample</p><p className="mt-1 font-display text-2xl font-extrabold tracking-[-.05em]">{plot.vpdKpa === null ? '—' : plot.vpdKpa}<span className="ml-1 text-sm">{plot.vpdKpa === null ? '' : 'kPa'}</span></p></div></Panel></div>
    <div className="grid gap-5 xl:grid-cols-[1.45fr_.75fr]"><Panel className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9a722a]">Demonstration soil twin</p><h2 className="mt-1 font-display text-xl font-extrabold tracking-[-.04em]">Sample readings & illustrative outlook</h2></div><div className="flex gap-3 text-[10px] font-bold text-[#778276]"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#518056]" />Example history</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#dda83f]" />Illustrative forecast</span></div></div><div className="mt-7"><MoistureChart history={twin.history} forecast={twin.forecast} /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#ece6db] pt-3 text-[10px] text-[#838c80]"><span>Demo values only · forecast is not field-validated</span><span>Illustrative trend only; no accuracy claims</span></div></Panel>
      <Panel className="overflow-hidden"><div className="border-b border-[#e9e3d7] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9a722a]">Field guide · demo</p><h2 className="mt-1 font-display text-xl font-extrabold tracking-[-.04em]">Illustrative guidance</h2></div><div className="space-y-4 p-5"><div className="rounded-xl bg-[#edf0e5] p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#47684b]"><Waves size={15} />{plot.status === 'NO_DATA' ? 'No sensor readings yet' : plot.status === 'NEEDS_WATER' ? 'Example: water may be needed' : plot.status === 'WATCH' ? 'Example: review moisture trend' : 'Example: conditions appear steady'}</div><p className="mt-2 text-xs leading-5 text-[#748174]">This is seeded demonstration data, not a field-validated irrigation recommendation.</p></div>
        {isVerifiedAdmin ? <><div className="flex items-center justify-between"><div><p className="text-xs font-bold">Pump status · demo field</p><p data-testid="status-pump" className={`mt-1 text-[11px] font-semibold ${plot.pumpActive ? 'text-[#498253]' : 'text-[#7b857a]'}`}>{plot.pumpActive ? 'Example: running' : 'Example: stopped'}</p></div><span className={`relative h-5 w-9 rounded-full transition-colors ${plot.pumpActive ? 'bg-[#5b8d5c]' : 'bg-[#c8c9bc]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${plot.pumpActive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></span></div>
          {!plot.pumpActive && <label className="block text-[10px] font-bold uppercase tracking-[.1em] text-[#7b867b]">Irrigation duration<select data-testid="select-irrigation-duration" value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="mt-2 block w-full rounded-lg border border-[#ddd6c6] bg-[#faf8f0] px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-[#344d3a] outline-none focus:border-[#638567]"><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label>}
          <button data-testid="button-pump-control" onClick={activate} disabled={control.isPending || plot.nodeStatus === 'OFFLINE'} className={`w-full rounded-xl px-4 py-3 text-xs font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${plot.pumpActive ? 'border border-[#d9c7bd] bg-[#fbf2ed] text-[#994831] hover:bg-[#f8e6dc]' : 'bg-[#234a37] text-white hover:bg-[#193c2b]'}`}>{control.isPending ? 'Sending command…' : plot.pumpActive ? 'Stop irrigation' : 'Start irrigation'}</button>
          {plot.nodeStatus === 'OFFLINE' && <p className="text-[11px] text-[#a05b3a]">Example node status is offline; backend may reject pump commands.</p>}
          {control.isError && <p role="alert" data-testid="text-pump-error" className="text-[11px] text-[#a34832]">Command not accepted. Confirm field and admin access.</p>}</> : <div data-testid="notice-admin-only" className="rounded-xl border border-[#e5ddca] bg-[#f7f3e9] p-4 text-xs leading-5 text-[#707d70]">Pump controls are available only to verified admins. The server remains the authority for pump permissions.</div>}
        <div className="flex items-center gap-2 border-t border-[#ece6db] pt-3 text-[10px] text-[#7c887c]"><Radio size={13} />Sample timestamp {plot.lastSync ? new Date(plot.lastSync).toLocaleString() : 'not available'}</div></div></Panel></div>
     <Panel className="p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#9a722a]">Sample telemetry</p><h2 className="mt-1 font-display text-lg font-extrabold">Example field conditions</h2></div><p className="text-[10px] text-[#819082]">{latest ? new Date(latest).toLocaleString() : 'No timestamp'}</p></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#f1eee4] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7e897b]">Relative humidity · demo</p><p className="mt-1 font-display text-xl font-extrabold">{plot.humidityPct === null ? '—' : `${plot.humidityPct}%`}</p></div><div className="rounded-xl bg-[#f1eee4] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7e897b]">Vapor pressure deficit · demo</p><p className="mt-1 font-display text-xl font-extrabold">{plot.vpdKpa === null ? '—' : plot.vpdKpa} <span className="text-xs">{plot.vpdKpa === null ? '' : 'kPa'}</span></p></div><div className="rounded-xl bg-[#f1eee4] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7e897b]">Example sensor node</p><p className="mt-1 flex items-center gap-2 font-display text-xl font-extrabold">{plot.nodeId ?? 'Not assigned'}<span className={`h-2 w-2 rounded-full ${plot.nodeStatus === 'ONLINE' ? 'bg-[#4e965b]' : 'bg-[#d39339]'}`} /></p></div></div></Panel>
  </div>;
}
