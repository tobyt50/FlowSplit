'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { UserListResponse } from '../../../types/admin-api';
import { getUsers } from '../../../lib/adminService';
import { toast } from 'sonner';
import router from 'next/router';

export default function UsersListPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<UserListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentPage = useMemo(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page, 10) : 1;
  }, [searchParams]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const responseData = await getUsers(currentPage);
        setData(responseData);
      } catch (error) {
        console.error('Failed to fetch users', error);
        toast.error('Failed to fetch users.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          A complete, paginated list of all users in the system. Total: {data?.meta.total || 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center p-8 text-muted-foreground">Loading users...</div>
        ) : !data || data.data.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">No users found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Wallets</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link href={`/users/${user.id}`} className="font-medium hover:underline text-primary">
                      {user.fullName}
                    </Link>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user._count.wallets}</TableCell>
                  <TableCell>{user._count.transactions}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {data && data.meta.lastPage > 1 && (
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Page {data.meta.page} of {data.meta.lastPage}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              disabled={currentPage <= 1}
              onClick={() => router.push(`/users?page=${currentPage - 1}`)}
            >
              Previous
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              disabled={currentPage >= data.meta.lastPage}
              onClick={() => router.push(`/users?page=${currentPage + 1}`)}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}