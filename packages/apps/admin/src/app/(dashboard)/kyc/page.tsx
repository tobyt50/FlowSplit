'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { KycReviewModal } from './_components/KycReviewModal';
import api from '../../../lib/api';
import { toast } from 'sonner';

interface PendingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export default function KycQueuePage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/admin/kyc/pending');
      setUsers(res.data);
    } catch (error) {
      toast.error('Failed to load queue');
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">KYC Review Queue</h1>
      
      <Card>
        <CardHeader><CardTitle>Pending Tier 2 Requests</CardTitle></CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending reviews.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setSelectedUserId(user.id)}>Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedUserId && (
        <KycReviewModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
          onComplete={fetchQueue} 
        />
      )}
    </div>
  );
}