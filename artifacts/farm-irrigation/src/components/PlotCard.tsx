import { Link } from 'wouter';
import { ArrowUpRight, Droplets, MapPin, Thermometer } from 'lucide-react';
import type { Plot } from '@workspace/api-client-react';
import { Panel, StatusBadge } from '@/components/ui';

export function PlotCard({ plot }: { plot: Plot }) {
  return <Panel testId={`card-plot-${plot.id}`} className="overflow-hidden">
    <div className="flex items-start justify-between p-5 pb-3"><div><p className="font-display text-lg font-extrabold tracking-[-.03em]">{plot.name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-[#788377]"><MapPin size={12} />{plot.location}</p></div><StatusBadge status={plot.status} testId={`status-plot-${plot.id}`} /></div>
    <div className="mx-5 rounded-xl bg-[#f1eee4] px-4 py-3"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7e897b]">Soil moisture</p><p data-testid={`text-moisture-${plot.id}`} className="mt-1 font-display text-[32px] font-extrabold leading-none tracking-[-.06em] text-[#244a37]">{plot.moisturePct}<span className="ml-0.5 text-base font-bold">%</span></p></div><div className="flex h-12 w-12 items-center justify-center rounded-full border-[5px] border-[#d6dfcc] text-[#47714d]"><Droplets size={17} /></div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dedbce]"><div className="h-full rounded-full bg-[#64895d]" style={{ width: `${Math.min(plot.moisturePct, 100)}%` }} /></div></div>
    <div className="flex items-center justify-between px-5 py-4 text-[11px] text-[#758075]"><span>{plot.crop} · {plot.areaHectares} ha</span><span className="flex items-center gap-3"><span className="inline-flex items-center gap-1"><Thermometer size={12} />{plot.temperatureC}°</span><span className={`inline-flex items-center gap-1 ${plot.nodeStatus === 'ONLINE' ? 'text-[#458454]' : 'text-[#a86c28]'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{plot.nodeStatus.toLowerCase()} · sample</span></span></div>
    <Link href={`/plots/${plot.id}`} data-testid={`link-plot-details-${plot.id}`} className="flex items-center justify-between border-t border-[#e9e3d7] px-5 py-3 text-xs font-bold text-[#365b40] hover:bg-[#f4f2e9]"><span>View field twin</span><ArrowUpRight size={15} /></Link>
  </Panel>;
}
