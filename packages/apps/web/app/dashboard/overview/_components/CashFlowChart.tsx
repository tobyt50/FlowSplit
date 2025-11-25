'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui/Card';
import { CashFlowDataPoint } from '../../../../lib/dashboardService';

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { theme } = useTheme();

  // Define colors based on the current theme for axis, grid, and text
  const strokeColor = theme === 'dark' ? '#4A4A4A' : '#E5E5E5';
  const textColor = theme === 'dark' ? '#A1A1A1' : '#737373';

  // Custom Tooltip for better styling and formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inflow = payload.find((p: any) => p.dataKey === 'inflow').value;
      const outflow = payload.find((p: any) => p.dataKey === 'outflow').value;
      const net = inflow - outflow;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-bold">{label}</p>
          <p className="text-green-500">Inflow: {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(inflow)}</p>
          <p className="text-red-500">Outflow: {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(outflow)}</p>
          <p className={`font-medium ${net >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>
            Net: {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(net)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
        <CardDescription>Your total inflow vs. outflow over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
            <XAxis dataKey="month" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke={textColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₦${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--muted))' }} />
            <Legend iconSize={10} />
            <Bar dataKey="inflow" name="Inflow" fill="#00C49F" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outflow" name="Outflow" fill="#FF8042" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}