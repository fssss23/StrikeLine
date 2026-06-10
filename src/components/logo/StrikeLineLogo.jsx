import React from 'react';
import { cn } from '../../lib/utils';

export const StrikeLineLogo = ({ variant = 'full', className }) => {
  const isInverse = variant === 'inverse';
  
  const horizontalStroke = isInverse ? '#FFFFFF' : '#0D2F55';
  const diagonalStroke = isInverse ? '#7FB3D3' : '#2563EB';
  const textColor = isInverse ? 'text-text-inverse' : 'text-brand-navy';

  const mark = (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="2" y1="16" x2="30" y2="16" stroke={horizontalStroke} strokeWidth="2.5" strokeLinecap="square"/>
      <line x1="8" y1="24" x2="24" y2="8" stroke={diagonalStroke} strokeWidth="1.5" strokeLinecap="square"/>
    </svg>
  );

  if (variant === 'mark') {
    return <div className={className}>{mark}</div>;
  }

  return (
    <div className={cn("flex items-center gap-[10px]", className)}>
      {mark}
      <span className={cn("font-bold text-xl leading-none", textColor)} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
        StrikeLine
      </span>
    </div>
  );
};
