'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Badge, BadgeProps } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { AuditLogResponse, AuditLogFilters, AuditLog } from '../../../types/admin-api';
import { getAuditLogs } from '../../../lib/adminService'
import { AuditLogFiltersComponent } from './_components/AuditLogFilters';
import { toast } from 'sonner';
import { AuditLogLevel } from '@flowsplit/prisma';

export default function AuditLogsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filters, setFilters] = useState<Partial<AuditLogFilters>>({
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    targetUserId: searchParams.get('targetUserId') || undefined,
    level: searchParams.get('level') as AuditLogLevel || undefined,
    action: searchParams.get('action') as any || undefined,
  });

  const fetchData = useCallback(async (currentFilters: Partial<AuditLogFilters>) => {
    setIsLoading(true);
    try {
      const responseData = await getAuditLogs(currentFilters);
      setData(responseData);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
      toast.error('Failed to fetch audit logs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentParams: { [key: string]: any } = {};
    searchParams.forEach((value, key) => {
      currentParams[key] = value;
    });

    setFilters(currentParams);
    fetchData(currentParams);
  }, [searchParams, fetchData]);

  const handleFilterChange = (key: keyof AuditLogFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const applyFilters = () => {
    const newParams = new URLSearchParams();
    // Build the query string from the local filter state
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, String(value));
      }
    });
    router.push(`${pathname}?${newParams.toString()}`);
  };
  
  const getLevelVariant = (level: AuditLogLevel): BadgeProps['variant'] => {
    switch (level) {
      case AuditLogLevel.CRITICAL:
        return 'destructive';
      case AuditLogLevel.WARN:
        return 'secondary';
      case AuditLogLevel.INFO:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const currentPage = data?.meta.page || 1;
  const lastPage = data?.meta.lastPage || 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Audit Log</CardTitle>
          <CardDescription>A detailed, immutable log of all administrative actions performed in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogFiltersComponent 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onApply={applyFilters} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center p-8 text-muted-foreground">Loading logs...</p>
          ) : !data || data.data.length === 0 ? (
            <p className="text-center p-8 text-muted-foreground">No logs found for the selected filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((log: AuditLog) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                        <div className="font-medium">{log.adminUserEmail}</div>
                        <div className="text-xs text-muted-foreground font-mono">{log.adminUserId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLevelVariant(log.level)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.targetUserId && (
                        <div className="text-xs">
                          <span className="font-semibold text-muted-foreground">User: </span>
                          <Link href={`/users/${log.targetUserId}`} className="font-mono hover:underline text-primary">
                            {log.targetUserId}
                          </Link>
                        </div>
                      )}
                       {log.targetEntityId && (
                        <div className="text-xs mt-1">
                          <span className="font-semibold text-muted-foreground">Entity: </span>
                          <span className="font-mono">{log.targetEntityId}</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {data && data.meta.total > data.meta.limit && (
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Page {data.meta.page} of {data.meta.lastPage}
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button 
                        size="sm" 
                        variant="outline" 
                        disabled={currentPage <= 1}
                        onClick={() => setFilters(prev => ({ ...prev, page: currentPage - 1 }))}
                    >
                        Previous
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        disabled={currentPage >= lastPage}
                        onClick={() => setFilters(prev => ({ ...prev, page: currentPage + 1 }))}
                    >
                        Next
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}