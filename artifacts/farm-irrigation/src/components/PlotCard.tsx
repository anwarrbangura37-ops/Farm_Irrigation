import { Link } from 'wouter';
import { ArrowUpRight, Droplets, MapPin, Pencil, Thermometer } from 'lucide-react';
import type { Plot } from '@workspace/api-client-react';
import { Panel, StatusBadge } from '@/components/ui';

type PlotCardProps = {
  plot: Plot;
  canEdit?: boolean;
  onEdit?: (plot: Plot) => void;
};

export function PlotCard({ plot, canEdit = false, onEdit }: PlotCardProps) {
  const moisture = plot.moisturePct;

  return (
    <Panel testId={`card-plot-${plot.id}`} className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-extrabold tracking-[-.03em]">
            {plot.name}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#788377]">
            <MapPin size={12} />
            {plot.location}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit && onEdit && (
            <button
              type="button"
              data-testid={`button-edit-plot-${plot.id}`}
              aria-label={`Edit ${plot.name}`}
              title="Edit plot"
              onClick={() => onEdit(plot)}
              className="rounded-lg border border-[#ded8c9] p-2 text-[#5f7061] hover:bg-[#f1eee5] hover:text-[#234a37]"
            >
              <Pencil size={14} />
            </button>
          )}
          <StatusBadge status={plot.status} testId={`status-plot-${plot.id}`} />
        </div>
      </div>

      <div className="mx-5 rounded-xl bg-[#f1eee4] px-4 py-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7e897b]">
              Soil moisture
            </p>
            <p
              data-testid={`text-moisture-${plot.id}`}
              className={`mt-1 font-display font-extrabold leading-none tracking-[-.06em] text-[#244a37] ${
                moisture === null ? 'text-lg' : 'text-[30px]'
              }`}
            >
              {moisture === null ? 'No reading yet' : `${moisture}%`}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[5px] border-[#d6dfcc] text-[#47714d]">
            <Droplets size={17} />
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dedbce]">
          <div
            className="h-full rounded-full bg-[#64895d]"
            style={{ width: `${Math.min(moisture ?? 0, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-[11px] text-[#758075]">
        <span>
          {plot.crop} · {plot.areaHectares} ha
        </span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Thermometer size={12} />
            {plot.temperatureC === null ? '—' : `${plot.temperatureC}°`}
          </span>
          <span
            className={`inline-flex items-center gap-1 ${
              plot.nodeStatus === 'ONLINE' ? 'text-[#458454]' : 'text-[#a86c28]'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {plot.nodeId
              ? `${plot.nodeStatus.toLowerCase()} · sample`
              : 'No sensor'}
          </span>
        </span>
      </div>

      <Link
        href={`/plots/${plot.id}`}
        data-testid={`link-plot-details-${plot.id}`}
        className="flex items-center justify-between border-t border-[#e9e3d7] px-5 py-3 text-xs font-bold text-[#365b40] hover:bg-[#f4f2e9]"
      >
        <span>View field twin</span>
        <ArrowUpRight size={15} />
      </Link>
    </Panel>
  );
}
