'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Bell, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: async () => {
      const res = await api.get('/api/notifications?per_page=100');
      return res.data.data ?? [];
    },
    refetchInterval: 15000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id?: string) => {
      if (id) {
        await api.post(`/api/notifications/${id}/mark-as-read`);
      } else {
        await api.post('/api/notifications/mark-as-read');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unread = notifications.filter((n: { read_at: string | null }) => n.read_at === null);
  const read = notifications.filter((n: { read_at: string | null }) => n.read_at !== null);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {unread.length > 0 ? `You have ${unread.length} unread notification${unread.length > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => markAsReadMutation.mutate()}
            disabled={markAsReadMutation.isPending}
            className="ml-auto px-4 py-2 bg-[#7a1315] hover:bg-[#5a0e10] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 font-medium">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-[100px] h-[100px] rounded-full bg-[#fff5f5] flex items-center justify-center mb-6">
            <Bell className="w-[48px] h-[48px] text-[#7a1315]" strokeWidth={1.5} />
          </div>
          <p className="font-extrabold text-xl text-slate-900 mb-2">No notifications yet</p>
          <p className="text-sm font-medium text-slate-500">Notifications will appear here when you receive them.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Unread</h2>
              <div className="space-y-2">
                {unread.map((n: { id: string; read_at: string | null; data?: { type?: string; title?: string; message?: string }; created_at: string }) => (
                  <div
                    key={n.id}
                    onClick={() => markAsReadMutation.mutate(n.id)}
                    className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-4 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                    <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      {n.data?.type === 'alert' ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <Bell className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-sm text-red-900 truncate">{n.data?.title || 'Notification'}</p>
                        <span className="text-[10px] font-medium text-red-500 bg-red-100 px-2 py-0.5 rounded shrink-0">{getTimeAgo(n.created_at)}</span>
                      </div>
                      <p className="text-xs font-medium text-red-700/80 mt-1.5 leading-relaxed">{n.data?.message || 'You have a new message.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {read.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Earlier</h2>
              <div className="space-y-2">
                {read.map((n: { id: string; read_at: string | null; data?: { type?: string; title?: string; message?: string }; created_at: string }) => (
                  <div key={n.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex gap-4 relative overflow-hidden">
                    <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-sm text-slate-600 truncate">{n.data?.title || 'Notification'}</p>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">{getTimeAgo(n.created_at)}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">{n.data?.message || 'You have a new message.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
