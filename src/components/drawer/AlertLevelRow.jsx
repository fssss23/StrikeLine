import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';

export function AlertLevelRow({ 
  type, label, icon, color, register, watch, setValue, lastTriggered 
}) {
  const isEnabled = watch(`${type}Enabled`);

  const handleToggle = (checked) => {
    setValue(`${type}Enabled`, checked, { shouldValidate: true, shouldDirty: true });
  };

  const triggeredText = lastTriggered 
    ? `Last triggered: ${formatDistanceToNow(new Date(lastTriggered))} ago`
    : 'Never triggered';

  return (
    <div className="flex flex-col gap-1 py-4 border-b border-surface-border last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          color === 'green' && "bg-signal-greenBg text-signal-green",
          color === 'red' && "bg-signal-redBg text-signal-red",
          color === 'amber' && "bg-signal-amberBg text-signal-amber",
        )}>
          {icon}
        </div>
        
        <span className="text-[14px] font-semibold text-text-primary flex-1">{label}</span>
        
        <div className="w-[110px] shrink-0">
          <Input 
            {...register(`${type}Level`)}
            type="number"
            step="0.01"
            placeholder="0.00"
            className="text-right tabular-nums text-[14px] h-9 pr-3"
            disabled={!isEnabled}
          />
        </div>
        
        <Toggle checked={isEnabled} onChange={handleToggle} />
      </div>

      <div className="ml-11">
        <span className={cn(
          "text-[11px]",
          lastTriggered ? "text-text-secondary" : "text-surface-border"
        )}>
          {triggeredText}
        </span>
      </div>
    </div>
  );
}
