import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, width, height, ...props }) => {
  return (
    <div
      className={cn('rounded-md', className)}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E7EBF1 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s ease-in-out infinite',
      }}
      {...props}
    />
  );
};
