'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../components/ui/DropdownMenu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { ChevronDown, Camera, FileImage, Loader2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../../lib/api';
import { refreshProfile } from '../../../../lib/authService';
import { API_URLS } from '../../../../lib/config';

const ID_TYPES = ['NIN_SLIP', 'DRIVERS_LICENSE', 'VOTERS_CARD', 'INTERNATIONAL_PASSPORT'];

const schema = z.object({
  idType: z.string().min(1, "Select an ID type"),
  idNumber: z.string().min(3, "Enter ID Number"),
});

type FormData = z.infer<typeof schema>;

// Added optional onClose prop to support the "X" button behavior
interface Tier2UploadFormProps {
  onClose?: () => void;
}

export function Tier2UploadForm({ onClose }: Tier2UploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<{ id?: string; selfie?: string }>({});

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedType = watch('idType');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('File size must be under 5MB');
      
      const url = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [type]: url }));
      
      if (type === 'id') setIdFile(file);
      else setSelfieFile(file);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!idFile || !selfieFile) {
      return toast.error('Please upload both your ID document and a Selfie.');
    }

    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('idType', data.idType);
    formData.append('idNumber', data.idNumber);
    formData.append('idImage', idFile);
    formData.append('selfie', selfieFile);

    try {
      await api.post(`${API_URLS.MONOLITH}/kyc/submit-tier2`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('Documents Uploaded', { description: 'Your account is under review.' });
      
      await refreshProfile();
      if (onClose) onClose(); // Close form on success if provided
      
    } catch (err: any) {
      toast.error('Upload Failed', { description: err.response?.data?.message || err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2">
      <CardHeader className="pb-4 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
            <CardTitle className="text-base text-foreground">Upgrade to Tier 2</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">Upload a government ID to unlock higher limits.</CardDescription>
        </div>
        {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-2">
                <X className="h-4 w-4" />
            </Button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* ID Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Document Type</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-muted/50 border-input rounded-xl h-11 hover:bg-muted font-normal">
                    {selectedType ? selectedType.replace('_', ' ') : "Select Type"} 
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border rounded-xl">
                  {ID_TYPES.map(t => (
                    <DropdownMenuItem key={t} onSelect={() => setValue('idType', t)} className="cursor-pointer rounded-lg my-0.5">
                        {t.replace(/_/g, ' ')}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.idType && <p className="text-[10px] text-destructive">{errors.idType.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Document Number</label>
              <Input 
                placeholder="A0000000" 
                {...register('idNumber')} 
                className="bg-muted/50 border-input rounded-xl h-11"
              />
              {errors.idNumber && <p className="text-[10px] text-destructive">{errors.idNumber.message}</p>}
            </div>
          </div>

          {/* File Upload Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ID Card Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                 <FileImage className="h-4 w-4 text-muted-foreground" /> Upload ID Card
              </label>
              <div className="border border-dashed border-border bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors relative h-48 flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  onChange={(e) => handleFileChange(e, 'id')}
                />
                {previews.id ? (
                  <img src={previews.id} alt="ID Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="p-3 bg-muted rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-foreground font-medium">Tap to upload image</p>
                    <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selfie Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                 <Camera className="h-4 w-4 text-muted-foreground" /> Take a Selfie
              </label>
              <div className="border border-dashed border-border bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors relative h-48 flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="user"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  onChange={(e) => handleFileChange(e, 'selfie')}
                />
                {previews.selfie ? (
                  <img src={previews.selfie} alt="Selfie Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="p-3 bg-muted rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-foreground font-medium">Tap to take photo</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Ensure face is clearly visible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full rounded-xl shadow-lg shadow-primary/20 h-11 text-base" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : 'Submit Documents'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}