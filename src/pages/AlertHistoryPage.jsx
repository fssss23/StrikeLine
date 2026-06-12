import { useState, useMemo } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { HistoryFilterBar } from '../components/history/HistoryFilterBar';
import { HistoryTable } from '../components/history/HistoryTable';
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
    <div className="bg-surface-card border border-surface-border rounded-[12px] overflow-hidden">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-6 px-5 py-4 border-b border-surface-border last:border-b-0 animate-pulse">
          <div className="h-3 w-24 bg-surface-muted rounded" />
          <div className="flex-1">
            <div className="h-4 w-40 bg-surface-muted rounded mb-1.5" />
            <div className="h-3 w-14 bg-surface-muted rounded" />
          </div>
          <div className="h-5 w-20 bg-surface-muted rounded-pill" />
          <div className="h-4 w-24 bg-surface-muted rounded" />
          <div className="h-4 w-24 bg-surface-muted rounded" />
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
    <div className="max-w-[1200px] mx-auto w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Alert History</h1>
          <p className="text-text-secondary text-sm mt-1">
            Complete log of every alert triggered across your watchlist.
          </p>
        </div>
        {!isLoading && !isError && events.length > 0 && (
          <button
            onClick={() => exportToCsv(filteredAlerts)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-surface-border bg-surface-card text-[13px] font-semibold text-text-primary hover:bg-surface-muted transition-colors shrink-0"
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {isLoading ? (
        <HistorySkeleton />
      ) : isError ? (
        <div className="bg-surface-card border border-surface-border rounded-[12px] p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-signal-redBg text-signal-red flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-[15px] font-bold text-text-primary mb-1">Couldn't load alert history</h3>
          <p className="text-[13px] text-text-secondary mb-4">{error?.message || 'Something went wrong.'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-[8px] bg-brand-navy text-white text-[13px] font-semibold hover:bg-[#1A4A7A] transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <HistoryFilterBar filters={filters} setFilters={setFilters} symbols={availableSymbols} />
            <div className="text-[13px] text-text-secondary pl-1">
              Showing {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
              {failedCount > 0 && <span className="text-signal-red"> · {failedCount} failed</span>}
            </div>
          </div>

          <HistoryTable alerts={filteredAlerts} />
        </>
      )}
    </div>
  );
}
