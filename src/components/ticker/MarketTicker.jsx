import React from 'react';
import { cn } from '../../lib/utils';

// Brand strip for the signed-out hero. It lists PSX board names only — no
// prices — because live ticks are gated behind auth (RLS) and this product
// must never show a number a trader could mistake for a real quote.
const SYMBOLS = [
  'OGDC', 'LUCK', 'ENGROH', 'HBL', 'MARI', 'HUBC', 'PSO', 'PPL',
  'MCB', 'UBL', 'FFC', 'TRG', 'SYS', 'MEBL', 'BAHL', 'POL',
];

export const MarketTicker = ({ className }) => {
  const TickerContent = () => (
    <div className="flex items-center whitespace-nowrap h-full">
      {SYMBOLS.map((symbol, idx) => (
        <React.Fragment key={idx}>
          <span className="px-4 text-[12px] font-semibold tracking-[0.08em] text-white/70">
            {symbol}
          </span>
          <span className="w-1 h-1 rounded-full bg-brand-blueLight/40 shrink-0" />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        'overflow-hidden h-10 border-t border-white/[0.08] flex items-center relative',
        className
      )}
    >
      <div className="flex whitespace-nowrap animate-marquee">
        <TickerContent />
        <TickerContent />
      </div>
      {/* Edge fades so the loop reads as continuous motion, not a hard cut */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-brand-navyDeep to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-brand-navyDeep to-transparent" />
    </div>
  );
};
