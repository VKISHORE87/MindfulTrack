import React, { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const tooltipVariants = cva(
  "absolute z-50 hidden group-hover:block w-80 p-4 bg-white rounded-lg shadow-xl border border-gray-200",
  {
    variants: {
      position: {
        top: "-translate-y-full -top-2",
        bottom: "top-full mt-2", 
        left: "-translate-x-full -left-2",
        right: "left-full ml-2",
        center: "-translate-x-1/2 left-1/2 mt-2 top-full",
      }
    },
    defaultVariants: {
      position: "center"
    }
  }
);

export interface TooltipProps extends VariantProps<typeof tooltipVariants> {
  children: ReactNode;
  className?: string;
}

export function HoverTooltip({ 
  children, 
  position,
  className
}: TooltipProps) {
  return (
    <div className={cn(tooltipVariants({ position }), className)}>
      {children}
    </div>
  );
}