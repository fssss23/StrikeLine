import { useState, useMemo } from 'react';
import { Download, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { HistoryFilterBar } from '../components/history/HistoryFilterBar';
import { HistoryTable } from '../components/history/HistoryTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useAlertHistory } from '../hooks/queries/useAlertHistoryQuery';

function exportToCsv(alerts) {
  if (!alerts.length) {
    toast.error('No alerts to export');
    return;
  }
  const header = ['Triggered At', 'Symbol', 'Company', 'Level Type', 'Configured Level', 'Actual Price', 'Status'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = alerts.map(a => [
    format(new Date(a.triggered_at), 'yyyy-MM-dd HH:mm:ss'),
    a.symbol,
    a.company_name,
    a.level_type,
    a.level_value?.toFixed(2) ?? '',
    a.actual_price?.toFixed(2) ?? '',
    a.push_status ?? ''
  ].map(escape).join(','));

  const csv = [header.map(escape).join(','), ...rows].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `strikeline-alerts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${alerts.length} alerts`);
}

function HistorySkeleton() {
  return (
    <div className="space-y-2.5 md:space-y-0 md:bg-surface-card md:rounded-xcard md:border md:border-surface-hairline md:shadow-card md:overflow-hidden">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="bg-surface-card rounded-xcard border border-surface-hairline shadow-card p-3.5 md:rounded-none md:border-0 md:border-b md:border-surface-hairline md:shadow-none md:last:border-b-0 md:px-5 md:py-4 animate-pulse"
        >
          <div className="md:flex md:items-center md:gap-6">
            <div className="flex items-center justify-between gap-3 md:contents">
              <div className="h-5 w-20 bg-surface-muted rounded-pill md:order-2" />
              <div className="h-3 w-24 bg-surface-muted rounded md:order-1" />
            </div>
            <div className="mt-2.5 md:mt-0 md:flex-1">
              <div className="h-4 w-44 max-w-full bg-surface-muted rounded mb-1.5" />
              <div className="h-3 w-14 bg-surface-muted rounded" />
            </div>
            <div className="hidden md:block h-4 w-24 bg-surface-muted rounded" />
            <div className="hidden md:block h-4 w-24 bg-surface-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AlertHistoryPage() {
  const { data: allAlerts, isLoading, isError, error, refetch } = useAlertHistory();

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    security: 'All',
    types: [],
    status: 'All'
  });

  const events = allAlerts || [];
  const availableSymbols = useMemo(
    () => [...new Set(events.map(e => e.symbol))].sort(),
    [events]
  );

  const filteredAlerts = useMemo(() => {
    return events.filter(alert => {
      if (filters.security !== 'All' && alert.symbol !== filters.security) return false;

      if (filters.types.length > 0) {
        const t = alert.level_type.charAt(0).toUpperCase() + alert.level_type.slice(1);
        if (!filters.types.includes(t)) return false;
      }

      if (filters.status !== 'All') {
        const failed = alert.push_status === 'failed' || alert.push_status === 'error';
        if (filters.status === 'Failed' && !failed) return false;
        if (filters.status === 'Delivered' && failed) return false;
      }

      const alertTime = new Date(alert.triggered_at).getTime();
      if (filters.dateFrom && alertTime < new Date(filters.dateFrom).getTime()) return false;
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setDate(end.getDate() + 1);
        if (alertTime >= end.getTime()) return false;
      }

      return true;
    });
  }, [events, filters]);

  const failedCount = filteredAlerts.filter(
    a => a.push_status === 'failed' || a.push_status === 'error'
  ).length;

  return (
    <div className="max-w-[1200px] mx-auto w-full">
      <PageHeader
        eyebrow="Delivery log"
        title="Alert History"
        subtitle="Every alert triggered across your watchlist, with the level, the price that fired it, and how it was delivered."
        action={
          !isLoading && !isError && events.length > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() => exportToCsv(filteredAlerts)}
            >
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <HistorySkeleton />
      ) : isError ? (
        <ErrorState
          title="Couldn't load alert history"
          message={error?.message || 'Something went wrong.'}
          onRetry={() => refetch()}
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Inbox}
          tone="grey"
          title="No alerts yet"
          description="Once a security on your watchlist reaches one of your armed levels, every notification will be logged here."
        />
      ) : (
        <div className="space-y-3">
          <HistoryFilterBar filters={filters} setFilters={setFilters} symbols={availableSymbols} />

          <div className="flex items-center gap-2 px-1 text-[12.5px] text-text-secondary">
            <span className="sl-num">
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
            </span>
            {failedCount > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-surface-border" />
                <span className="text-signal-red font-semibold sl-num">{failedCount} failed</span>
              </>
            )}
          </div>

          <HistoryTable alerts={filteredAlerts} />
        </div>
      )}
    </div>
  );
}
