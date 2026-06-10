import React from 'react';
import { Smartphone, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { motion } from 'framer-motion';

export function HistoryRow({ alert, isExpanded, onToggle }) {
  const alertDate = new Date(alert.time);
  const timeStr = isToday(alertDate) 
    ? `Today ${format(alertDate, 'HH:mm')}`
    : format(alertDate, 'EEE dd MMM · HH:mm');

  const typeColors = {
    support: 'bg-signal-greenBg text-signal-green',
    resistance: 'bg-signal-redBg text-signal-red',
    breakout: 'bg-signal-amberBg text-signal-amber'
  };

  return (
    <>
      <div 
        onClick={onToggle}
        className={`grid grid-cols-[140px_1fr_120px_140px_140px_120px_120px] gap-4 px-5 py-4 border-b border-surface-border last:border-b-0 cursor-pointer transition-colors ${
          isExpanded ? 'bg-surface-page' : 'hover:bg-surface-page'
        }`}
      >
        <div className="text-[13px] text-text-secondary self-center">{timeStr}</div>
        
        <div className="flex flex-col justify-center">
          <span className="text-[14px] font-bold text-text-primary">{alert.name}</span>
          <span className="text-[10px] font-bold text-brand-navy bg-surface-muted px-1.5 py-0.5 rounded w-max mt-1">{alert.symbol}</span>
        </div>

        <div className="self-center">
          <span className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold uppercase ${typeColors[alert.type]}`}>
            {alert.type}
          </span>
        </div>

        <div className="self-center text-[14px] font-bold tabular-nums text-text-primary">
          PKR {alert.level.toFixed(2)}
        </div>

        <div className="self-center flex flex-col">
          <span className="text-[14px] font-bold tabular-nums text-text-primary">PKR {alert.actualPrice.toFixed(2)}</span>
          <span className="text-[11px] text-text-secondary mt-0.5">
            {alert.actualPrice > alert.level ? '↓ came from above' : '↑ came from below'}
          </span>
        </div>

        <div className="self-center flex gap-2 text-text-secondary">
          {alert.channels.includes('push') && <Smartphone size={16} />}
          {alert.channels.includes('whatsapp') && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-signal-green">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
            </svg>
          )}
          {alert.channels.includes('email') && <Mail size={16} />}
        </div>

        <div className="self-center">
          {alert.status === 'delivered' ? (
            <div className="flex items-center gap-1.5 text-signal-green">
              <CheckCircle2 size={16} />
              <span className="text-[13px] font-medium">Delivered</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-signal-red">
              <XCircle size={16} />
              <span className="text-[13px] font-medium">Failed</span>
              <button className="text-[12px] text-brand-blue hover:underline ml-1" onClick={(e) => e.stopPropagation()}>Retry</button>
            </div>
          )}
        </div>
      </div>

      <HistoryRowExpanded isExpanded={isExpanded} alert={alert} />
    </>
  );
}

function HistoryRowExpanded({ isExpanded, alert }) {
  if (!isExpanded) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden border-b border-surface-border bg-surface-muted"
    >
      <div className="px-5 py-4 grid grid-cols-3 gap-6 text-[12px]">
        <div>
          <h4 className="font-semibold text-text-primary mb-2 uppercase text-[10px] tracking-wider text-text-secondary">Delivery Details</h4>
          <div className="space-y-1.5 text-text-primary">
            <div><span className="text-text-secondary">Push Notification:</span> {alert.channels.includes('push') ? `Delivered at ${format(new Date(alert.time), 'HH:mm:ss')} PKT ✓` : 'Not enabled'}</div>
            <div><span className="text-text-secondary">WhatsApp:</span> {alert.channels.includes('whatsapp') ? `Delivered at ${format(new Date(alert.time), 'HH:mm:ss')} PKT ✓` : 'Not enabled'}</div>
            <div><span className="text-text-secondary">Email:</span> {alert.channels.includes('email') ? 'Delivered ✓' : 'Not enabled'}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-text-primary mb-2 uppercase text-[10px] tracking-wider text-text-secondary">Alert Rule at Trigger</h4>
          <div className="space-y-1.5 text-text-primary">
            <div className="capitalize"><span className="text-text-secondary">{alert.type}:</span> PKR {alert.level.toFixed(2)}</div>
            <div><span className="text-text-secondary">Buffer:</span> ±0.5%</div>
            <div><span className="text-text-secondary">Cooldown:</span> 4h</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-text-primary mb-2 uppercase text-[10px] tracking-wider text-text-secondary">Engine Evaluation</h4>
          <div className="space-y-1.5 text-text-primary">
            <div><span className="text-text-secondary">Tick Time:</span> {format(new Date(alert.time), 'dd MMM HH:mm:ss')} PKT</div>
            <div><span className="text-text-secondary">Price:</span> PKR {alert.actualPrice.toFixed(2)}</div>
            <div><span className="text-text-secondary">Delta:</span> -0.04% (within buffer)</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
