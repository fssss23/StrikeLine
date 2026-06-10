import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { HistoryRow } from './HistoryRow';

export function HistoryTable({ alerts }) {
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (alerts.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-[12px] p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-surface-muted rounded-full flex items-center justify-center text-surface-border mb-4">
          <Search size={32} />
        </div>
        <h3 className="text-[16px] font-bold text-text-primary mb-1">No alerts match your filters</h3>
        <p className="text-[13px] text-text-secondary">Try adjusting your date range or changing selected types.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(alerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAlerts = alerts.slice(startIndex, startIndex + itemsPerPage);

  const handleToggle = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-[12px] overflow-hidden flex flex-col">
      <div className="bg-surface-muted px-5 py-3 grid grid-cols-[140px_1fr_120px_140px_140px_120px_120px] gap-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary border-b border-surface-border">
        <div>Time</div>
        <div>Security</div>
        <div>Alert Type</div>
        <div>Configured Level</div>
        <div>Actual Price</div>
        <div>Channel</div>
        <div>Status</div>
      </div>

      <div className="flex flex-col">
        {currentAlerts.map(alert => (
          <HistoryRow 
            key={alert.id} 
            alert={alert} 
            isExpanded={expandedId === alert.id}
            onToggle={() => handleToggle(alert.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-surface-border bg-white">
          <div className="text-[13px] text-text-secondary">
            Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, alerts.length)} of {alerts.length} alerts
          </div>
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-[8px] text-[13px] font-medium flex items-center justify-center transition-colors ${
                  currentPage === i + 1 
                    ? 'bg-brand-navy text-white' 
                    : 'bg-white border border-surface-border text-text-primary hover:bg-surface-muted'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
