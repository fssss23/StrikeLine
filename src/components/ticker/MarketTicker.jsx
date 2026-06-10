import React from 'react';
import { cn } from '../../lib/utils';

export const MarketTicker = ({ className }) => {
  const items = [
    { symbol: 'OGDC', price: '189.50', change: '+1.24%' },
    { symbol: 'LUCK', price: '1,042.00', change: '-0.82%' },
    { symbol: 'ENGRO', price: '334.75', change: '+2.14%' },
    { symbol: 'HBL', price: '175.20', change: '-0.31%' },
    { symbol: 'MARI', price: '3,210.00', change: '+0.51%' },
    { symbol: 'HUBC', price: '142.30', change: '+0.07%' },
    { symbol: 'PSO', price: '288.40', change: '+1.10%' },
    { symbol: 'PPL', price: '104.80', change: '-0.55%' },
  ];

  const TickerContent = () => (
    <div className="flex items-center whitespace-nowrap min-w-full justify-around h-full">
      {items.map((item, idx) => {
        const isUp = item.change.startsWith('+');
        return (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-1.5 px-4 font-mono text-[13px]">
              <span className="font-bold text-text-inverse">{item.symbol}</span>
              <span className="tabular-nums text-text-inverse">{item.price}</span>
              <span className={cn(
                "tabular-nums",
                isUp ? "text-[#7FB3D3]" : "text-red-400"
              )}>
                {isUp ? '▲' : '▼'} {item.change.replace(/[+-]/, '')}
              </span>
            </div>
            {idx < items.length - 1 && <span className="text-[#7FB3D3]/50">·</span>}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className={cn("overflow-hidden bg-brand-navy h-10 border-t border-white/10 flex items-center relative", className)}>
      <div className="absolute flex whitespace-nowrap animate-[marquee_40s_linear_infinite]">
        <TickerContent />
        <TickerContent />
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
