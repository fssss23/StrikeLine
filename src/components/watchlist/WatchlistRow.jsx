import React from 'react';
import { Badge } from '../ui/Badge';
import { PriceChange } from '../ui/PriceChange';
import { Button } from '../ui/Button';
import { AlertLevelBadge } from './AlertLevelBadge';
import { usePriceFlash } from '../../hooks/usePriceFlash';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { mockSecurities } from '../../data/mockData';

export const WatchlistRow = ({ item }) => {
  const openDrawer = useWatchlistStore(state => state.openDrawer);
  
  // Find security details from mock data
  const security = mockSecurities.find(s => s.symbol === item.symbol) || {
    name: 'Unknown', sector: 'Unknown', price: 0, change: 0, changeAbs: 0
  };

  const { flashClass } = usePriceFlash(item.price || security.price);

  return (
    <div 
      className="group flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 border-b border-surface-border last:border-b-0 hover:border-brand-navy hover:shadow-card cursor-pointer transition-all duration-150 bg-surface-card"
      onClick={() => openDrawer(item.symbol)}
    >
      
      <div className="text-surface-border group-hover:text-text-secondary transition-colors cursor-grab hidden sm:block opacity-0 group-hover:opacity-100">
        ⠿
      </div>
      
      <div className="flex-1 min-w-[150px]">
        <p className="font-semibold text-[15px] text-text-primary truncate">{security.name}</p>
        <p className="text-xs text-text-secondary font-mono">{security.symbol}</p>
      </div>
      
      <div className="hidden md:block w-[120px]">
        <Badge variant="grey">{security.sector}</Badge>
      </div>
      
      <div className="flex-1 flex justify-between sm:justify-end items-center sm:gap-6">
        <div className="text-right">
          <p className={`text-price-sm font-bold tabular-nums text-text-primary rounded-sm px-1 -mx-1 transition-colors ${flashClass}`}>
            {(item.price || security.price).toFixed(2)}
          </p>
        </div>
        
        <div className="w-[80px] text-right">
          <PriceChange value={item.change ?? security.change} absolute={item.changeAbs ?? security.changeAbs} />
        </div>
      </div>
      
      <div className="w-full sm:w-[240px] flex gap-1.5 flex-wrap shrink-0">
        <AlertLevelBadge 
          type="support" 
          level={item.support.level} 
          enabled={item.support.enabled} 
          triggered={!!item.support.lastTriggered} 
        />
        <AlertLevelBadge 
          type="resistance" 
          level={item.resistance.level} 
          enabled={item.resistance.enabled} 
          triggered={!!item.resistance.lastTriggered} 
        />
        <AlertLevelBadge 
          type="breakout" 
          level={item.breakout.level} 
          enabled={item.breakout.enabled} 
          triggered={!!item.breakout.lastTriggered} 
        />
      </div>
      
      <div className="hidden lg:block w-[120px] text-right opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-brand-blue hover:text-brand-navy"
          onClick={(e) => {
            e.stopPropagation();
            openDrawer(item.symbol);
          }}
        >
          View Details →
        </Button>
      </div>
    </div>
  );
};
