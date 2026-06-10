import React, { useState, useMemo } from 'react';
import { HistoryFilterBar } from '../components/history/HistoryFilterBar';
import { HistoryTable } from '../components/history/HistoryTable';
import { useAlertStore } from '../store/useAlertStore';

export default function AlertHistoryPage() {
  const allAlerts = useAlertStore(state => state.alertHistory);
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    security: 'All',
    types: [],
    status: 'All'
  });

  const filteredAlerts = useMemo(() => {
    return allAlerts.filter(alert => {
      // Security Filter
      if (filters.security !== 'All' && alert.symbol !== filters.security) return false;
      
      // Type Filter
      if (filters.types.length > 0) {
        const t = alert.type.charAt(0).toUpperCase() + alert.type.slice(1);
        if (!filters.types.includes(t)) return false;
      }
      
      // Status Filter
      if (filters.status !== 'All' && alert.status.toLowerCase() !== filters.status.toLowerCase()) return false;
      
      // Date Filter
      const alertTime = new Date(alert.time).getTime();
      if (filters.dateFrom) {
        if (alertTime < new Date(filters.dateFrom).getTime()) return false;
      }
      if (filters.dateTo) {
        // add one day to include the end date fully
        const end = new Date(filters.dateTo);
        end.setDate(end.getDate() + 1);
        if (alertTime >= end.getTime()) return false;
      }
      
      return true;
    });
  }, [allAlerts, filters]);

  const failedCount = filteredAlerts.filter(a => a.status === 'failed').length;

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Alert History</h1>
        <p className="text-text-secondary text-sm mt-1">
          Complete log of every alert triggered across your watchlist.
        </p>
      </div>

      <div className="space-y-3">
        <HistoryFilterBar filters={filters} setFilters={setFilters} />
        
        <div className="text-[13px] text-text-secondary pl-1">
          Showing {filteredAlerts.length} alerts
          {failedCount > 0 && <span className="text-signal-red"> · {failedCount} failed</span>}
        </div>
      </div>

      <HistoryTable alerts={filteredAlerts} />
    </div>
  );
}
