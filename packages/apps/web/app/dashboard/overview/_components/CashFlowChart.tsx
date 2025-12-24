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

// Compact formatter for chart axis (e.g., 1.5k, 2M)
const formatCompact = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1
  }).format(value);
};

export function CashFlowChart({ data, compact = false, className }: CashFlowChartProps) {
  const fullData = data && data.length > 0 
    ? data 
    : Array(6).fill(0).map((_, i) => ({ month: `M${i+1}`, inflow: 0, outflow: 0 }));

  // In compact mode, slice to show only the last 3 months
  const chartData = compact ? fullData.slice(-3) : fullData;

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
                {formatCurrency(BigInt(payload[0].value))}
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
    <div className={cn("w-full", compact ? "h-full min-h-[100px]" : "h-[150px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData} 
          // Added small bottom margin in compact mode to allow X-axis labels to render
          margin={compact ? { top: 5, right: 0, left: 0, bottom: 0 } : { top: 5, right: 0, left: -20, bottom: 0 }}
        >
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
          
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={compact ? 9 : 10} 
            tickLine={false} 
            axisLine={false}
            dy={5}
            interval={0} // Force all labels to show
            // Removed 'hide={compact}' so months are always visible
          />
          
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={compact ? 9 : 10} 
            tickLine={false} 
            axisLine={false}
            tickCount={compact ? 3 : 5}
            tickFormatter={(value) => formatCompact(value)}
            mirror={compact}
            width={compact ? 24 : 40}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={!compact} />

          <Area 
            type="monotone" 
            dataKey="inflow" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorInflow)" 
            activeDot={compact ? false : { r: 4, strokeWidth: 0, fill: '#60a5fa' }}
          />
          
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