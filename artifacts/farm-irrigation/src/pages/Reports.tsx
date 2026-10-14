import { useQueryClient } from '@tanstack/react-query';
import { ArrowDownToLine, Droplets, RefreshCw, Sprout } from 'lucide-react';
import { getGetWeeklyReportQueryKey, useGetWeeklyReport } from '@workspace/api-client-react';
import { EmptyState, ErrorState, LoadingState, Metric, Panel } from '@/components/ui';

function WeeklyChart({ days }: { days: { day: string; averageMoisturePct: number; irrigationMinutes: number }[] }) {
  const max = Math.max(100, ...days.map((day) => day.averageMoisturePct));
  return <div data-testid="chart-weekly-moisture" className="flex min-h-[235px] items-end gap-2 border-b border-[#dcd7ca] px-2 pt-5 sm:gap-4">{days.map((day, index) => <div key={`${day.day}-${index}`} className="flex h-[205px] min-w-0 flex-1 flex-col items-center justify-end gap-2"><span data-testid={`text-day-moisture-${index}`} className="text-[10px] font-bold text-[#6d7d6d]">{day.averageMoisturePct}%</span><div className="relative flex h-[150px] w-full max-w-[42px] items-end overflow-hidden rounded-t-lg bg-[#e8e5d9]"><div className="w-full rounded-t-lg bg-[#648a61] transition-all" style={{ height: `${Math.max(5, (day.averageMoisturePct / max) * 100)}%` }} /><div className="absolute bottom-0 left-0 w-full border-t border-dashed border-white/80" style={{ bottom: '38%' }} /></div><span className="text-[10px] font-semibold text-[#788377]">{day.day}</span></div>)}</div>;
}

export function Reports() {
  const queryClient = useQueryClient();
  const reportQuery = useGetWeeklyReport({ query: { queryKey: getGetWeeklyReportQueryKey(), refetchOnWindowFocus: true } });
  const retry = () => void queryClient.invalidateQueries({ queryKey: getGetWeeklyReportQueryKey() });
  if (reportQuery.isLoading) return <LoadingState label="Preparing your weekly field report…" />;
  if (reportQuery.isError || !reportQuery.data) return <ErrorState onRetry={retry} />;
  const report = reportQuery.data;
  const averageIrrigation = report.days.length ? Math.round(report.days.reduce((sum, day) => sum + day.irrigationMinutes, 0) / report.days.length) : 0;
  const exportCsv = () => {
    const rows = [['Day', 'Average moisture (%)', 'Irrigation minutes'], ...report.days.map((day) => [day.day, String(day.averageMoisturePct), String(day.irrigationMinutes)])];
    const file = new Blob([rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'farm-irrigation-weekly-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  return <div data-testid="page-reports"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#9a722a]">Field performance</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-.06em] sm:text-[40px]">Weekly report</h1><p data-testid="text-week-label" className="mt-2 text-sm text-[#728073]">{report.weekLabel} · A simple picture of the week.</p></div><button data-testid="button-export-report" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl bg-[#244a37] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#193b2a]"><ArrowDownToLine size={15} />Download CSV</button></div>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Weekly moisture" value={`${report.averageMoisturePct}%`} note="Farm-wide daily average" accent /><Metric label="Sensor readings" value={report.readingsCount.toLocaleString()} note="Readings included this week" /><Metric label="Daily irrigation" value={`${averageIrrigation} min`} note="Average minutes per day" /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]"><Panel className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9a722a]">Moisture rhythm</p><h2 className="mt-1 font-display text-xl font-extrabold tracking-[-.04em]">Daily average moisture</h2></div><div className="flex items-center gap-2 text-[10px] font-semibold text-[#738072]"><span className="h-2 w-2 rounded-sm bg-[#648a61]" />Average moisture</div></div>{report.days.length === 0 ? <div className="mt-6"><EmptyState title="No readings for this week" detail="The weekly view will fill in as field sensors report." /></div> : <WeeklyChart days={report.days} />}<div className="mt-4 flex items-center gap-2 text-[10px] text-[#849083]"><span className="h-2 w-2 rounded-sm border border-dashed border-[#a3a596]" />Reference guide at 38%</div></Panel>
      <Panel className="p-5 sm:p-6"><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9a722a]">Daily breakdown</p><h2 className="mt-1 font-display text-xl font-extrabold tracking-[-.04em]">Irrigation & readings</h2>{report.days.length === 0 ? <div className="mt-5"><EmptyState title="No daily details yet" detail="Daily totals will appear here once data is available." /></div> : <div className="mt-4 divide-y divide-[#ece6db]">{report.days.map((day, index) => <div key={`${day.day}-${index}`} data-testid={`row-report-day-${index}`} className="flex items-center justify-between gap-3 py-3"><div><p className="text-xs font-bold">{day.day}</p><p className="mt-1 text-[10px] text-[#859083]">{day.averageMoisturePct}% avg moisture</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4ebd7] px-2.5 py-1.5 text-[10px] font-bold text-[#906c25]"><Droplets size={12} />{day.irrigationMinutes} min</span></div>)}</div>}<div className="mt-4 flex items-start gap-3 rounded-xl bg-[#edf0e5] p-4"><Sprout size={17} className="mt-0.5 text-[#4a714e]" /><p className="text-[11px] leading-5 text-[#6d7d6e]">Use this week’s trend to compare watering needs across changing weather and crop stages.</p></div></Panel></div>
    <Panel className="mt-5 flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#9a722a]">Reporting note</p><p className="mt-1 text-sm font-bold">This summary uses sample sensor and irrigation activity.</p><p className="mt-1 text-xs text-[#7d887c]">Missing days may indicate a sample node was offline or unable to sync.</p></div><button aria-label="Refresh weekly report" data-testid="button-refresh-report" onClick={retry} className="rounded-lg p-2 text-[#627565] hover:bg-[#eeeade]"><RefreshCw size={16} /></button></Panel>
  </div>;
}
