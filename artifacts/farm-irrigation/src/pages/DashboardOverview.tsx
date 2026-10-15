import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import { Link } from 'wouter';
import { ArrowRight, CloudSun, RefreshCw, Sprout, Waves } from 'lucide-react';
import {
  getGetFarmDashboardQueryKey,
  getListPlotsQueryKey,
  useGetFarmDashboard,
} from '@workspace/api-client-react';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Metric,
  Panel,
} from '@/components/ui';
import { PlotCard } from '@/components/PlotCard';

export function Dashboard() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const greetingName =
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    user?.username?.trim() ||
    'there';
  const dashboard = useGetFarmDashboard({
    query: {
      queryKey: getGetFarmDashboardQueryKey(),
      refetchInterval: 60000,
      refetchOnWindowFocus: true,
    },
  });

  const reload = () => {
    void queryClient.invalidateQueries({
      queryKey: getGetFarmDashboardQueryKey(),
    });
    void queryClient.invalidateQueries({ queryKey: getListPlotsQueryKey() });
  };

  if (dashboard.isLoading) {
    return <LoadingState label="Bringing your farm readings together…" />;
  }
  if (dashboard.isError || !dashboard.data) {
    return <ErrorState onRetry={reload} />;
  }

  const farm = dashboard.data;
  const plotsNeedingReview = farm.plots.filter(
    (plot) => plot.status === 'WATCH' || plot.status === 'NEEDS_WATER',
  );
  const plotsWithoutReadings = farm.plots.filter(
    (plot) => plot.status === 'NO_DATA',
  );

  return (
    <div data-testid="page-dashboard" className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#9a722a]">
            Field overview · Mile 91
          </p>
          <h1
            data-testid="text-dashboard-greeting"
            className="mt-2 font-display text-3xl font-extrabold tracking-[-.06em] sm:text-[40px]"
          >
            Hello, {greetingName}.
          </h1>
          <p className="mt-2 text-sm text-[#728073]">
            Here’s what your farm is telling us today.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#e2dac9] bg-[#faf8f0] px-3.5 py-2 text-xs font-semibold text-[#6e7b70]">
          <CloudSun size={16} className="text-[#c79231]" />
          Field conditions · updated{' '}
          {farm.generatedAt
            ? new Date(farm.generatedAt).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'just now'}
          <button
            type="button"
            aria-label="Refresh farm readings"
            data-testid="button-refresh-dashboard"
            onClick={reload}
            className="ml-1 rounded-md p-1 hover:bg-[#eee9db]"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Active plots"
          value={farm.activePlotCount}
          note={`${farm.plots.length} example fields`}
        />
        <Metric
          label="Average moisture"
          value={`${farm.averageMoisturePct}%`}
          note="Sample plot average"
          accent
        />
        <Metric
          label="Need attention"
          value={farm.urgentAlertCount}
          note="Example field alerts"
        />
        <Metric
          label="Sample nodes"
          value={`${farm.onlineNodeCount}/${farm.totalNodeCount}`}
          note="Demo telemetry status"
        />
      </div>

      <section
        aria-label="Dynamic field status"
        className="grid gap-4 lg:grid-cols-2"
      >
        <Panel className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#9a722a]">
                Field status · demo
              </p>
              <h2 className="mt-1 font-display text-lg font-extrabold">
                Needs a closer look
              </h2>
            </div>
            <span className="rounded-full bg-[#f7ebcf] px-3 py-1 text-xs font-extrabold text-[#8d6418]">
              {plotsNeedingReview.length}
            </span>
          </div>
          {plotsNeedingReview.length ? (
            <ul className="mt-4 space-y-2">
              {plotsNeedingReview.slice(0, 3).map((plot) => (
                <li
                  key={plot.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f3e9] px-3.5 py-2.5 text-sm"
                >
                  <span className="truncate font-semibold text-[#415844]">
                    {plot.name}
                  </span>
                  <span className="shrink-0 text-xs text-[#8d6418]">
                    {plot.moisturePct === null
                      ? 'Review'
                      : `${plot.moisturePct}% moisture`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[#728073]">
              No demonstration plots need a review right now.
            </p>
          )}
          <Link
            href="/plots"
            data-testid="link-review-plots"
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#416148] hover:text-[#a47725]"
          >
            Review field plots <ArrowRight size={14} />
          </Link>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#9a722a]">
                Sensor readiness
              </p>
              <h2 className="mt-1 font-display text-lg font-extrabold">
                Waiting for readings
              </h2>
            </div>
            <span className="rounded-full bg-[#e9e7de] px-3 py-1 text-xs font-extrabold text-[#667064]">
              {plotsWithoutReadings.length}
            </span>
          </div>
          {plotsWithoutReadings.length ? (
            <ul className="mt-4 space-y-2">
              {plotsWithoutReadings.slice(0, 3).map((plot) => (
                <li
                  key={plot.id}
                  className="flex items-center gap-2 rounded-xl bg-[#f7f3e9] px-3.5 py-2.5 text-sm font-semibold text-[#5f7061]"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#aeb3a5]" />
                  <span className="truncate">{plot.name}</span>
                  <span className="ml-auto shrink-0 text-xs font-normal">
                    No sensor data
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[#728073]">
              New plots will appear here until readings are available.
            </p>
          )}
          <Link
            href="/plots"
            data-testid="link-manage-plots"
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#416148] hover:text-[#a47725]"
          >
            Manage field plots <ArrowRight size={14} />
          </Link>
        </Panel>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9a722a]">
              Your growing areas
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold tracking-[-.04em]">
              Plot conditions
            </h2>
          </div>
          <Link
            href="/plots"
            data-testid="link-view-all-plots"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#416148] hover:text-[#a47725]"
          >
            All field plots <ArrowRight size={14} />
          </Link>
        </div>
        {farm.plots.length === 0 ? (
          <EmptyState
            title="Your field is ready for its first reading"
            detail="Once your sensor nodes check in, plot conditions will appear here."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {farm.plots.slice(0, 6).map((plot) => (
              <PlotCard key={plot.id} plot={plot} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
        <Panel className="relative overflow-hidden bg-[#e8ecdf] p-6 sm:p-7">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border border-[#cbd7c1]" />
          <div className="absolute -right-2 -top-8 h-44 w-44 rounded-full border border-[#cbd7c1]" />
          <div className="relative max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#dbe6d5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#42664b]">
              <Waves size={13} />
              Field guidance
            </span>
            <h3 className="mt-4 font-display text-2xl font-extrabold tracking-[-.05em]">
              Small changes, better harvests.
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6e7e6d]">
              Use soil moisture trends to plan irrigation before crops begin to
              show stress. The field twin keeps recent readings and the
              next-day outlook together.
            </p>
            <Link
              href="/plots"
              data-testid="link-open-field-plots"
              className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-[#365b40]"
            >
              Explore field twins <ArrowRight size={14} />
            </Link>
          </div>
        </Panel>
        <Panel className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4e6c7] text-[#9c7021]">
            <Sprout size={21} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8f752f]">
              Field tip
            </p>
            <h3 className="mt-1 font-display text-base font-extrabold">
              Check the trend, not one number.
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#788276]">
              Moisture can shift through the day. Compare with yesterday before
              you water.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
