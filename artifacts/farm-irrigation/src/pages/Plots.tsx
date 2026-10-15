import { useState } from 'react';
import { useUser } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { MapPinned, Plus, RefreshCw, Search } from 'lucide-react';
import {
  getGetFarmDashboardQueryKey,
  getGetPlotTwinQueryKey,
  getListPlotsQueryKey,
  useCreatePlot,
  useListPlots,
  useUpdatePlot,
  type Plot,
  type PlotInput,
} from '@workspace/api-client-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { PlotCard } from '@/components/PlotCard';
import { PlotFormDialog } from '@/components/PlotFormDialog';
import { hasFarmAdminAccess } from '@/lib/farmPermissions';

type PlotFilter = 'ALL' | 'ATTENTION' | 'OPTIMAL' | 'NO_DATA';

const filterOptions: { value: PlotFilter; label: string }[] = [
  { value: 'ALL', label: 'All plots' },
  { value: 'ATTENTION', label: 'Needs review' },
  { value: 'OPTIMAL', label: 'Optimal' },
  { value: 'NO_DATA', label: 'No readings' },
];

export function Plots() {
  const client = useQueryClient();
  const { user } = useUser();
  const isAdmin = hasFarmAdminAccess(user?.emailAddresses);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PlotFilter>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const query = useListPlots({
    query: {
      queryKey: getListPlotsQueryKey(),
      refetchOnWindowFocus: true,
    },
  });

  const invalidatePlotData = () => {
    void client.invalidateQueries({ queryKey: getListPlotsQueryKey() });
    void client.invalidateQueries({ queryKey: getGetFarmDashboardQueryKey() });
  };

  const createPlot = useCreatePlot({
    mutation: {
      onSuccess: () => {
        invalidatePlotData();
        setEditingPlot(null);
        setDialogOpen(false);
      },
    },
  });
  const updatePlot = useUpdatePlot({
    mutation: {
      onSuccess: (plot) => {
        invalidatePlotData();
        void client.invalidateQueries({
          queryKey: getGetPlotTwinQueryKey(plot.id),
        });
        setEditingPlot(null);
        setDialogOpen(false);
      },
    },
  });

  const retry = () =>
    void client.invalidateQueries({ queryKey: getListPlotsQueryKey() });

  const openAddPlot = () => {
    createPlot.reset();
    updatePlot.reset();
    setEditingPlot(null);
    setDialogOpen(true);
  };

  const openEditPlot = (plot: Plot) => {
    createPlot.reset();
    updatePlot.reset();
    setEditingPlot(plot);
    setDialogOpen(true);
  };

  const savePlot = (values: PlotInput) => {
    if (editingPlot) {
      updatePlot.mutate({ plotId: editingPlot.id, data: values });
      return;
    }
    createPlot.mutate({ data: values });
  };

  if (query.isLoading) return <LoadingState label="Loading your field plots…" />;
  if (query.isError || !query.data) return <ErrorState onRetry={retry} />;

  const plots = query.data;
  const searchTerm = search.trim().toLocaleLowerCase();
  const visiblePlots = plots.filter((plot) => {
    const statusMatches =
      filter === 'ALL' ||
      (filter === 'ATTENTION' &&
        (plot.status === 'WATCH' || plot.status === 'NEEDS_WATER')) ||
      plot.status === filter;
    const searchMatches =
      !searchTerm ||
      [plot.name, plot.crop, plot.location].some((value) =>
        value.toLocaleLowerCase().includes(searchTerm),
      );
    return statusMatches && searchMatches;
  });
  const countForFilter = (selectedFilter: PlotFilter) =>
    selectedFilter === 'ALL'
      ? plots.length
      : selectedFilter === 'ATTENTION'
        ? plots.filter(
            (plot) => plot.status === 'WATCH' || plot.status === 'NEEDS_WATER',
          ).length
        : plots.filter((plot) => plot.status === selectedFilter).length;
  const pending = createPlot.isPending || updatePlot.isPending;
  const errorMessage =
    createPlot.isError || updatePlot.isError
      ? 'Could not save the plot. Check the details and try again.'
      : undefined;

  return (
    <div data-testid="page-plots" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#9a722a]">
            Field sites · Western Area
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-.06em] sm:text-[40px]">
            Field plots
          </h1>
          <p className="mt-2 text-sm text-[#728073]">
            Search, filter, and manage your field plots.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            data-testid="button-refresh-plots"
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-xl border border-[#ddd6c6] bg-[#faf8f1] px-4 py-2.5 text-xs font-bold text-[#4b6651] hover:bg-white"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            data-testid="button-add-plot"
            onClick={openAddPlot}
            className="inline-flex items-center gap-2 rounded-xl bg-[#234a37] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#193c2b]"
          >
            <Plus size={15} />
            Add plot
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[#e2dac9] bg-[#faf8f0] px-4 py-3 text-xs text-[#718075]">
        <MapPinned size={16} className="shrink-0 text-[#a77a2a]" />
        <span>
          <strong className="text-[#385742]">
            {visiblePlots.length} of {plots.length} plots
          </strong>
          {' · '}
          sensor readings appear when a node is connected.
        </span>
      </div>

      <section
        aria-label="Plot search and filters"
        className="rounded-2xl border border-[#e6dfd0] bg-[#fbf9f2] p-4 sm:p-5"
      >
        <label className="relative block">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7f8a7d]"
          />
          <input
            data-testid="input-search-plots"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by plot, crop, or location"
            aria-label="Search plots by name, crop, or location"
            className="h-11 w-full rounded-xl border border-[#ded8c9] bg-[#fffdf8] pl-10 pr-3 text-sm text-[#334a39] outline-none placeholder:text-[#899184] focus:border-[#719070]"
          />
        </label>
        <div
          role="group"
          aria-label="Filter plots by condition"
          className="mt-4 flex flex-wrap gap-2"
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              data-testid={`filter-plots-${option.value.toLowerCase()}`}
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                filter === option.value
                  ? 'bg-[#234a37] text-white'
                  : 'border border-[#ded8c9] bg-[#fffdf8] text-[#647466] hover:bg-[#f1eee5]'
              }`}
            >
              {option.label}
              <span className="ml-1.5 opacity-75">
                {countForFilter(option.value)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {plots.length === 0 ? (
        <EmptyState
          title="No plots yet"
          detail="Add a field plot to start organizing your farm."
        />
      ) : visiblePlots.length === 0 ? (
        <EmptyState
          title="No matching plots"
          detail="Try another search or condition filter."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visiblePlots.map((plot) => (
            <PlotCard
              key={plot.id}
              plot={plot}
              canEdit={isAdmin}
              onEdit={openEditPlot}
            />
          ))}
        </div>
      )}

      <PlotFormDialog
        open={dialogOpen}
        plot={editingPlot}
        pending={pending}
        errorMessage={errorMessage}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingPlot(null);
        }}
        onSubmit={savePlot}
      />
    </div>
  );
}
