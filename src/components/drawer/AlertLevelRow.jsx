import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { Toggle } from '../ui/Toggle';

const PLATES = {
  green: 'bg-signal-greenBg text-signal-green',
  red: 'bg-signal-redBg text-signal-red',
  amber: 'bg-signal-amberBg text-signal-amber',
};

export function AlertLevelRow({
  type, label, icon, color, register, watch, setValue, lastTriggered
}) {
  const isEnabled = watch(`${type}Enabled`);

  const handleToggle = (checked) => {
    setValue(`${type}Enabled`, checked, { shouldValidate: true, shouldDirty: true });
  };

  const triggeredText = lastTriggered
    ? `Last triggered ${formatDistanceToNow(new Date(lastTriggered))} ago`
    : 'Never triggered';

  return (
    <div
      className={cn(
        'rounded-[12px] border p-3 transition-all duration-200',
        isEnabled
          ? 'border-surface-border bg-surface-card shadow-card'
          : 'border-surface-hairline bg-surface-sunken/60'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-opacity',
            PLATES[color],
            !isEnabled && 'opacity-45 saturate-50'
          )}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-[13.5px] font-bold tracking-tightish truncate transition-colors',
            isEnabled ? 'text-text-primary' : 'text-text-secondary'
          )}>
            {label}
          </p>
          <p className={cn(
            'text-[10.5px] mt-0.5 truncate',
            lastTriggered ? 'text-text-tertiary' : 'text-text-tertiary/60'
          )}>
            {triggeredText}
          </p>
        </div>

        <div className="relative w-[104px] shrink-0">
          <span
            className={cn(
              'absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold pointer-events-none transition-opacity',
              isEnabled ? 'text-text-tertiary' : 'text-text-tertiary/50'
            )}
          >
            PKR
          </span>
          <input
            {...register(`${type}Level`)}
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            disabled={!isEnabled}
            className={cn(
              'h-10 w-full rounded-[9px] border pl-9 pr-2.5 text-right sl-num font-semibold',
              'text-[16px] md:text-[14px] shadow-inset outline-none transition-all',
              'placeholder:text-text-tertiary placeholder:font-normal',
              'focus-visible:border-brand-blue focus-visible:shadow-focus',
              isEnabled
                ? 'border-surface-border bg-surface-card text-text-primary'
                : 'border-surface-hairline bg-surface-muted text-text-tertiary cursor-not-allowed'
            )}
          />
        </div>

        <Toggle checked={isEnabled} onChange={handleToggle} />
      </div>
    </div>
  );
}
