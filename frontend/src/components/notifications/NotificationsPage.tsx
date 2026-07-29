'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Bell, CheckCircle2, ArrowLeft, Inbox, LogIn, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
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

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'time_in': return <LogIn className="w-[18px] h-[18px] text-emerald-600" />;
      case 'time_out': return <LogOut className="w-[18px] h-[18px] text-amber-600" />;
      case 'system': return <ShieldCheck className="w-[18px] h-[18px] text-purple-600" />;
      default: return <Bell className="w-[18px] h-[18px] text-blue-600" />;
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-[18px] h-[18px] text-slate-500" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Notifications</h1>
              <p className="text-[13px] text-slate-400 font-medium">
                {unread.length > 0 ? `${unread.length} unread` : 'All read'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {someSelected && (
              <button
                onClick={() => deleteMutation.mutate(Array.from(selectedIds))}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-600 text-[12px] font-bold transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedIds.size})
              </button>
            )}
            {unread.length > 0 && (
              <button
                onClick={() => markAsReadMutation.mutate(undefined)}
                disabled={markAsReadMutation.isPending}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl text-blue-600 text-[12px] font-bold transition-colors disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilterType(tab.key); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] transition-all text-[12px] font-bold ${
                filterType === tab.key
                  ? 'bg-[#7a1315] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                filterType === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{tab.count}</span>
            </button>
          ))}
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
          <div className="space-y-8">
            {/* Unread */}
            {unread.length > 0 && (
              <section>
                {/* Select All Bar */}
                <div className="flex items-center gap-3 mb-3 px-1">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      allSelected ? 'bg-[#7a1315] border-[#7a1315]' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {allSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {allSelected ? `${unread.length} selected` : 'New'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {unread.map((n: NotificationItem) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 ${
                        selectedIds.has(n.id) ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => toggleSelect(n.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                          selectedIds.has(n.id) ? 'bg-[#7a1315] border-[#7a1315]' : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {selectedIds.has(n.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <button
                        onClick={() => setDetailNotif(n)}
                        className="flex-1 flex items-start gap-3.5 text-left min-w-0"
                      >
                        <div className={`w-10 h-10 rounded-xl ${getTypeBg(n.data?.type)} flex items-center justify-center shrink-0 mt-0.5`}>
                          {getTypeIcon(n.data?.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <p className="text-[14px] font-semibold text-slate-800 truncate">{n.data?.title || 'Notification'}</p>
                            <span className="text-[11px] font-medium text-slate-400 shrink-0 tabular-nums">{getTimeAgo(n.created_at)}</span>
                          </div>
                          <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2">{n.data?.message || 'You have a new message.'}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Read */}
            {read.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-300 mb-3 px-1">Earlier</h2>
                <div className="space-y-1">
                  {read.map((n: NotificationItem) => (
                    <button
                      key={n.id}
                      onClick={() => setDetailNotif(n)}
                      className="w-full text-left px-4 py-3.5 flex items-start gap-3.5 hover:bg-slate-50 rounded-2xl transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-[16px] h-[16px] text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-0.5">
                          <p className="text-[13px] font-medium text-slate-500 truncate">{n.data?.title || 'Notification'}</p>
                          <span className="text-[11px] font-medium text-slate-300 shrink-0 tabular-nums">{getTimeAgo(n.created_at)}</span>
                        </div>
                        <p className="text-[12px] text-slate-400 leading-relaxed line-clamp-1">{n.data?.message || 'You have a new message.'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
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