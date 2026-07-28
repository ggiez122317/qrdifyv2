import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Record", 
  message = "Are you sure you want to delete this record? This action cannot be undone." 
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-6 shadow-2xl rounded-3xl border-0 overflow-hidden">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 border-[6px] border-red-50">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 mb-1">{title}</DialogTitle>
          </DialogHeader>
          <p className="text-slate-500 mb-8 mt-2 text-[15px] leading-relaxed">{message}</p>
          <div className="flex items-center gap-3 w-full">
            <Button onClick={onClose} variant="outline" className="flex-1 h-12 rounded-xl text-slate-700 font-bold border-slate-200 hover:bg-slate-50">
              Cancel
            </Button>
            <Button onClick={() => { onConfirm(); onClose(); }} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm shadow-red-200">
              Yes, Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
