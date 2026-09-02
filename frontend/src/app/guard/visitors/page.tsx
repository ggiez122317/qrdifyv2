'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Plus, Search, Calendar as CalendarIcon, LogOut, Edit, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Visitor {
  id: number;
  name: string;
  purpose: string;
  person_to_visit: string;
  time_in: string;
  time_out: string | null;
  date: string;
  status: 'In' | 'Out';
}

export default function VisitorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [page] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    person_to_visit: '',
  });

  const { data: visitorsData, isLoading } = useQuery({
    queryKey: ['visitors', { page, search, date }],
    queryFn: async () => {
      const res = await api.get('/api/visitors', { params: { page, search, date } });
      return res.data;
    }
  });

  const storeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingVisitor) {
        return api.put(`/api/visitors/${editingVisitor.id}`, data);
      }
      return api.post('/api/visitors', { ...data, date, time_in: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      setIsModalOpen(false);
      setEditingVisitor(null);
      setFormData({ name: '', purpose: '', person_to_visit: '' });
      localStorage.setItem('toast_message', editingVisitor ? 'Visitor record updated successfully' : 'Visitor record saved successfully');
    }
  });

  const markOutMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/api/visitors/${id}/mark-out`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      localStorage.setItem('toast_message', 'Visitor marked out successfully');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/visitors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      localStorage.setItem('toast_message', 'Visitor record deleted successfully');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storeMutation.mutate(formData);
  };

  const handleEdit = (visitor: Visitor) => {
    setEditingVisitor(visitor);
    setFormData({
      name: visitor.name,
      purpose: visitor.purpose,
      person_to_visit: visitor.person_to_visit,
    });
    setIsModalOpen(true);
  };

  const openNewVisitor = () => {
    setEditingVisitor(null);
    setFormData({ name: '', purpose: '', person_to_visit: '' });
    setIsModalOpen(true);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            Visitor Logbook
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage and track campus visitors in real-time.</p>
        </div>
        <button 
          onClick={openNewVisitor}
          className="flex items-center gap-2 bg-[#0B3A82] hover:bg-[#092558] text-white px-5 py-2.5 rounded-none font-bold shadow-md transition-all"
        >
          <Plus className="w-5 h-5" />
          New Visitor
        </button>
      </div>

      <div className="bg-white rounded-none shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Search visitors..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-400 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
          
          <div className="relative w-full md:w-auto flex items-center">
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-none font-bold text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-300 cursor-pointer w-full"
            />
            <CalendarIcon className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Visitor Name</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Person to Visit</th>
                <th className="px-6 py-4">Time In</th>
                <th className="px-6 py-4">Time Out</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">Loading visitors...</td>
                </tr>
              ) : visitorsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">No visitors found for this date.</td>
                </tr>
              ) : (
                visitorsData?.data?.map((visitor: Visitor) => (
                  <tr key={visitor.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-800">{visitor.name}</td>
                    <td className="px-6 py-4">{visitor.purpose}</td>
                    <td className="px-6 py-4 font-medium">{visitor.person_to_visit}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{formatTime(visitor.time_in)}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{formatTime(visitor.time_out)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wide uppercase ${visitor.status === 'In' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {visitor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {visitor.status === 'In' && (
                        <button 
                          onClick={() => markOutMutation.mutate(visitor.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center"
                          title="Mark Time Out"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(visitor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { if(window.confirm('Delete this record?')) deleteMutation.mutate(visitor.id); }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[24px]">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-extrabold text-slate-900">
              {editingVisitor ? 'Edit Visitor' : 'New Visitor'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Visitor Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-400"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Purpose of Visit</label>
              <input 
                type="text" 
                required
                value={formData.purpose}
                onChange={e => setFormData({...formData, purpose: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-400"
                placeholder="e.g. Delivery, Meeting"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Person to Visit</label>
              <input 
                type="text" 
                required
                value={formData.person_to_visit}
                onChange={e => setFormData({...formData, person_to_visit: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-400"
                placeholder="e.g. Mr. Smith"
              />
            </div>
            <DialogFooter className="mt-6 pt-4 border-t border-slate-100 sm:justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={storeMutation.isPending}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-[#7a1315] hover:bg-[#5a0d0f] transition-colors disabled:opacity-70 min-w-[140px]"
              >
                {storeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Record'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
