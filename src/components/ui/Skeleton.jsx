import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, width, height, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-sm",
        className
      )}
      style={{
        width,
        height,
        background: "linear-gradient(90deg, #F1F5F9 25%, #E4E7ED 50%, #F1F5F9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite"
      }}
      {...props}
    />
  );
};
