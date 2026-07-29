'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Bell, CheckCircle2, Inbox, LogIn, LogOut, Settings, ChevronRight, Layers, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type NotificationItem = {
  id: string;
  read_at: string | null;
  created_at: string;
  data?: { type?: string; title?: string; message?: string };
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [filterType, setFilterType] = useState<'all' | 'time_in' | 'time_out' | 'system'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailNotif, setDetailNotif] = useState<NotificationItem | null>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: async () => {
      const res = await api.get('/api/notifications?per_page=100');
      return res.data.data ?? [];
    },
    refetchInterval: 15000,
  });

  const filtered = filterType === 'all'
    ? notifications
    : notifications.filter((n: NotificationItem) => n.data?.type === filterType);

  const unread = filtered.filter((n: NotificationItem) => n.read_at === null);
  const read = filtered.filter((n: NotificationItem) => n.read_at !== null);

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

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 1) {
        await api.delete(`/api/notifications/${ids[0]}`);
      } else {
        await api.post('/api/notifications/delete-selected', { ids });
      }
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const allSelected = unread.length > 0 && selectedIds.size === unread.length;
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unread.map((n: NotificationItem) => n.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (dateStr: string) => {
    if (!now) return '';
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const getTypeIcon = (type?: string, isActive?: boolean) => {
    switch (type) {
      case 'time_in': return <LogIn className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-emerald-600'}`} />;
      case 'time_out': return <LogOut className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-amber-500'}`} />;
      case 'system': return <Settings className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-purple-600'}`} />;
      default: return <Layers className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-slate-500'}`} />;
    }
  };

  const getTypeBg = (type?: string) => {
    switch (type) {
      case 'time_in': return 'bg-emerald-50';
      case 'time_out': return 'bg-amber-50';
      case 'system': return 'bg-purple-50';
      default: return 'bg-blue-50';
    }
  };

  const filterTabs = [
    { key: 'all' as const, label: 'All', count: notifications.length },
    { key: 'time_in' as const, label: 'Time In', count: notifications.filter((n: NotificationItem) => n.data?.type === 'time_in').length },
    { key: 'time_out' as const, label: 'Time Out', count: notifications.filter((n: NotificationItem) => n.data?.type === 'time_out').length },
    { key: 'system' as const, label: 'System', count: notifications.filter((n: NotificationItem) => n.data?.type === 'system').length },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight mb-0.5">Notifications</h1>
            <p className="text-[14px] text-slate-500">
              {unread.length > 0 ? `${unread.length} unread` : 'All read'}
            </p>
          </div>
        </div>

        {/* Filter Tabs & Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setFilterType(tab.key); setSelectedIds(new Set()); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-[13px] font-bold whitespace-nowrap border ${
                  filterType === tab.key
                    ? 'bg-[#7f1d1d] border-[#7f1d1d] text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {getTypeIcon(tab.key, filterType === tab.key)}
                <span>{tab.label}</span>
                <span className="text-[12px] opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => markAsReadMutation.mutate(undefined)}
            disabled={markAsReadMutation.isPending || unread.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-[13px] font-bold transition-colors hover:bg-slate-50 disabled:opacity-50 shrink-0"
          >
            <CheckCircle2 className="w-[18px] h-[18px] text-slate-400" />
            Mark all as read
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin mb-4" />
            <p className="text-sm text-slate-400 font-medium">Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
              <Inbox className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-[15px] font-semibold text-slate-700 mb-1">All clear</p>
            <p className="text-[13px] text-slate-400">No notifications to show right now.</p>
          </div>
        ) : (
            <section>
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-4 ml-2">Earlier</h2>
              <div className="space-y-3">
                {filtered.map((n: NotificationItem) => (
                  <button
                    key={n.id}
                    onClick={() => setDetailNotif(n)}
                    className="w-full bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all text-left"
                  >
                    {/* Unread Dot indicator */}
                    <div className="w-3 shrink-0 flex justify-center">
                      {n.read_at === null && (
                        <div className="w-2 h-2 rounded-full bg-[#7f1d1d]" />
                      )}
                    </div>
                    
                    <div className={`w-12 h-12 rounded-full ${getTypeBg(n.data?.type)} flex items-center justify-center shrink-0`}>
                      {getTypeIcon(n.data?.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-[15px] font-bold text-slate-900 truncate mb-1">
                        {n.data?.title || 'Notification'}
                      </p>
                      <p className="text-[13px] text-slate-500 truncate">
                        {n.data?.message || 'You have a new message.'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 pl-2">
                      <span className="text-[12px] font-medium text-slate-400">
                        {getTimeAgo(n.created_at)}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
        )}

        {/* Detail Modal */}
        <Dialog open={!!detailNotif} onOpenChange={(open) => { if (!open) setDetailNotif(null); }}>
          <DialogContent
            closeClassName="top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center border-none transition-colors"
            className="sm:max-w-[480px] rounded-[28px] overflow-hidden p-0 border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]"
          >
            {detailNotif && (
              <div className="p-7">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    detailNotif.data?.type === 'time_in' ? 'bg-emerald-50 text-emerald-600' :
                    detailNotif.data?.type === 'time_out' ? 'bg-amber-50 text-amber-600' :
                    detailNotif.data?.type === 'system' ? 'bg-purple-50 text-purple-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {detailNotif.data?.type === 'time_in' ? <LogIn className="w-6 h-6" /> :
                     detailNotif.data?.type === 'time_out' ? <LogOut className="w-6 h-6" /> :
                     detailNotif.data?.type === 'system' ? <ShieldCheck className="w-6 h-6" /> :
                     <Bell className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight truncate">{detailNotif.data?.title || 'Notification'}</h3>
                    <p className="text-[13px] font-medium text-slate-400 mt-0.5">{new Date(detailNotif.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full shrink-0 ${detailNotif.read_at ? 'bg-slate-300' : 'bg-red-500'}`} />
                </div>
                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">{detailNotif.data?.message || 'No additional details.'}</p>
                </div>
                <div className="flex items-center justify-between mt-6">
                  {!detailNotif.read_at && (
                    <button
                      onClick={() => { markAsReadMutation.mutate(detailNotif.id); setDetailNotif(null); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl text-blue-600 text-[12px] font-bold transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => { deleteMutation.mutate([detailNotif.id]); setDetailNotif(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-600 text-[12px] font-bold transition-colors ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}