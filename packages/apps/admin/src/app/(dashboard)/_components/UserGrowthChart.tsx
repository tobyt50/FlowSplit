'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../components/ui/Card';
import { getUserGrowth } from '../../../lib/adminService';
import { UserGrowthDataPoint } from '../../../types/admin-api';
import { toast } from 'sonner';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="font-bold">{new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        <p className="text-primary">New Users: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function UserGrowthChart() {
  const [data, setData] = useState<UserGrowthDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseData = await getUserGrowth();
        setData(responseData);
      } catch (error) {
        toast.error('Could not load user growth chart.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const strokeColor = theme === 'dark' ? '#4A4A4A' : '#E5E5E5';
  const textColor = theme === 'dark' ? '#A1A1A1' : '#737373';
  const fillColor = 'hsl(var(--primary))';

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>New user sign-ups over the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[350px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading Chart Data...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis
                dataKey="date"
                stroke={textColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric' })}
              />
              <YAxis
                stroke={textColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--muted))' }} />
              <Bar dataKey="count" name="New Users" fill={fillColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}