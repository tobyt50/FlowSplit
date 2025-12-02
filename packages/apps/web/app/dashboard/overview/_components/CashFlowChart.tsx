'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { CashFlowDataPoint } from '../../../../lib/dashboardService';
import { formatCurrency } from '../../../../lib/walletService';
import { cn } from '../../../../lib/utils';

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
  compact?: boolean;
  className?: string;
}

export function CashFlowChart({ data, compact = false, className }: CashFlowChartProps) {
  // Fallback data
  const chartData = data && data.length > 0 
    ? data 
    : Array(6).fill(0).map((_, i) => ({ month: `M${i+1}`, inflow: 0, outflow: 0 }));

  // Simplified Tooltip for Compact Mode
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={cn(
          "rounded-lg border border-border bg-popover/95 shadow-lg backdrop-blur-sm",
          compact ? "p-1.5 text-[10px]" : "p-2"
        )}>
          {!compact && <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>}
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {!compact && <span className="text-[10px] text-muted-foreground">In:</span>}
              <span className="text-[10px] font-mono font-medium text-foreground">
                {formatCurrency(BigInt(payload[0].value), 'NGN')}
              </span>
            </div>
            {!compact && (
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                <span className="text-[10px] text-muted-foreground">Out:</span>
                <span className="text-[10px] font-mono font-medium text-foreground">
                  {formatCurrency(BigInt(payload[1].value))}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("w-full", compact ? "h-full min-h-[100px]" : "h-[200px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={compact ? { top: 0, right: 0, left: 0, bottom: 0 } : { top: 5, right: 0, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={compact ? 0.5 : 0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={compact ? 0.5 : 0.3} />
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {!compact && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false} 
              opacity={0.4} 
            />
          )}
          
          {!compact && (
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dy={5}
            />
          )}
          
          {!compact && (
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} cursor={false} />

          <Area 
            type="monotone" 
            dataKey="inflow" 
            stroke="#3b82f6" 
            strokeWidth={compact ? 2 : 2}
            fillOpacity={1} 
            fill="url(#colorInflow)" 
            activeDot={compact ? false : { r: 4, strokeWidth: 0, fill: '#60a5fa' }}
          />
          
          {/* Only show Outflow in detailed mode to keep compact mode clean, or simpler line */}
          {!compact && (
            <Area 
              type="monotone" 
              dataKey="outflow" 
              stroke="#ec4899" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorOutflow)" 
              activeDot={{ r: 4, strokeWidth: 0, fill: '#f472b6' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}