'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

export function SecuritySettings() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/change-password', { 
        password: newPassword, 
        password_confirmation: confirmPassword 
      });
      return response.data;
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      // Update local storage token if a new one is provided, though usually it's just user data
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      }
      setTimeout(() => setIsSuccess(false), 3000);
    },
    onError: (err: any) => {
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please check requirements.');
    }
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <div className="animate-in fade-in duration-300 w-full">
      {isSuccess && (
        <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">Password updated successfully! Your account is now secure.</p>
        </div>
      )}

      <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
        {passwordError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold border border-red-100">
            {passwordError}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-xs">New Password</label>
          <input 
            type="password" 
            required
            minLength={8}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            placeholder="Min 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-xs">Confirm Password</label>
          <input 
            type="password" 
            required
            minLength={8}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            placeholder="Confirm new password"
          />
        </div>

        <button 
          type="submit" 
          disabled={changePasswordMutation.isPending}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all disabled:opacity-70 w-full"
        >
          {changePasswordMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </>
          ) : 'Save New Password'}
        </button>
      </form>
    </div>
  );
}
