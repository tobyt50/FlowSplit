'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/Dialog';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { toast } from 'sonner';
import api from '../../../../lib/api';
import Image from 'next/image';

interface KycReviewModalProps {
  userId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function KycReviewModal({ userId, onClose, onComplete }: KycReviewModalProps) {
  const [data, setData] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    api.get(`/admin/kyc/${userId}/documents`).then(res => setData(res.data));
  }, [userId]);

  const handleDecision = async (approved: boolean) => {
    if (!approved && !reason) return toast.error('Rejection reason required');
    
    setIsProcessing(true);
    try {
      await api.post(`/admin/kyc/${userId}/review`, { approved, rejectionReason: reason });
      toast.success(approved ? 'User Approved' : 'User Rejected');
      onComplete();
      onClose();
    } catch (e) {
      toast.error('Action Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!data) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reviewing: {data.user.firstName} {data.user.lastName}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* User Data */}
          <div className="space-y-4">
            <h4 className="font-semibold border-b pb-2">Profile Data</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">First Name</p><p>{data.user.firstName}</p></div>
              <div><p className="text-muted-foreground">Last Name</p><p>{data.user.lastName}</p></div>
              <div><p className="text-muted-foreground">Email</p><p>{data.user.email}</p></div>
              <div><p className="text-muted-foreground">DOB</p><p>{new Date(data.user.dob).toLocaleDateString()}</p></div>
              <div><p className="text-muted-foreground">ID Type</p><p>{data.documents.idType}</p></div>
            </div>
            
            <h4 className="font-semibold border-b pb-2 pt-4">Liveness (Selfie)</h4>
            <div className="relative aspect-square w-48 bg-muted rounded-lg overflow-hidden border">
              {data.documents.selfieUrl ? (
                 <img src={data.documents.selfieUrl} alt="Selfie" className="object-cover w-full h-full" />
              ) : <p className="p-4 text-xs">No Selfie</p>}
            </div>
          </div>

          {/* Document Data */}
          <div className="space-y-4">
             <h4 className="font-semibold border-b pb-2">ID Document</h4>
             <div className="relative w-full h-64 bg-muted rounded-lg border flex items-center justify-center overflow-hidden">
                {data.documents.idUrl ? (
                    <img src={data.documents.idUrl} alt="ID Doc" className="object-contain w-full h-full" />
                ) : <p>No Document Uploaded</p>}
             </div>
             
             {!isProcessing && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 mt-8">
                    <p className="text-xs font-bold text-red-600 mb-2">Rejection Area</p>
                    <Input 
                        placeholder="Reason for rejection..." 
                        value={reason} 
                        onChange={e => setReason(e.target.value)} 
                        className="bg-white"
                    />
                    <Button 
                        variant="destructive" 
                        className="w-full mt-2" 
                        onClick={() => handleDecision(false)}
                        disabled={!reason}
                    >
                        Reject KYC
                    </Button>
                </div>
             )}
          </div>
        </div>

        <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" 
                onClick={() => handleDecision(true)}
                disabled={isProcessing}
            >
                Approve & Upgrade
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}