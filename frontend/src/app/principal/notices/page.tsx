'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Plus, Search, Filter, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Send, Clock, FileTerminal, MailCheck, MailWarning } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomSelect } from '@/components/ui/custom-select';

export default function NoticesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: noticesData, isLoading } = useQuery({
    queryKey: ['principal-notices'],
    queryFn: async () => {
      const res = await api.get('/api/principal/notices');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const notices = noticesData?.data || [];
  const noticesTotal = noticesData?.total || 0;

  const filteredNotices = notices.filter((notice: any) => {
    const matchesSearch = notice.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          notice.student?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || notice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const acknowledgedCount = notices.filter((n:any) => n.status === 'acknowledged').length || 0;
  const pendingCount = notices.filter((n:any) => n.status === 'pending').length || 0;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-[#F8FAFC] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">Notices</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-1">Track notices sent to teachers regarding student attendance.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Total Notices</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{noticesTotal}</span>
              <span className="text-[#94a3b8] text-[13px] mt-1">All sent notices</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-blue-50 flex items-center justify-center">
              <FileTerminal className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Acknowledged</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{acknowledgedCount}</span>
              <span className="text-[#22c55e] text-[13px] mt-1 font-medium">Seen by teachers</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-emerald-50 flex items-center justify-center">
              <MailCheck className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Pending</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{pendingCount}</span>
              <span className="text-[#f97316] text-[13px] mt-1 font-medium">Awaiting response</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-orange-50 flex items-center justify-center">
              <MailWarning className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Response Rate</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">
                {notices.length > 0 ? Math.round((acknowledgedCount / notices.length) * 100) : 0}%
              </span>
              <span className="text-[#64748b] text-[13px] mt-1 font-medium">Overall engagement</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-purple-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-[600px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
              <Input 
                placeholder="Search by teacher or student name..." 
                className="pl-11 h-[46px] bg-white border-slate-200 rounded-xl text-[15px] focus:ring-1 focus:ring-slate-300 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <CustomSelect 
                value={statusFilter}
                onChange={setStatusFilter}
                icon={<Filter className="w-4 h-4 text-slate-400" />}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'acknowledged', label: 'Acknowledged' }
                ]}
              />
              
              <CustomSelect 
                value="newest"
                onChange={() => {}}
                icon={<Clock className="w-4 h-4 text-slate-400" />}
                options={[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' }
                ]}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[11px] text-[#94a3b8] uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">NOTICE TO</th>
                  <th className="px-8 py-5">REGARDING STUDENT</th>
                  <th className="px-8 py-5">STATUS</th>
                  <th className="px-8 py-5">SENT ON</th>
                  <th className="px-8 py-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-50">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-slate-200"></div>
                          <div className="flex flex-col gap-2">
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                            <div className="h-3 w-48 bg-slate-100 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                          <div className="h-3 w-24 bg-slate-100 rounded"></div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="h-4 w-24 bg-slate-200 rounded"></div>
                          <div className="h-3 w-16 bg-slate-100 rounded"></div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
                          <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
                          <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (!filteredNotices || filteredNotices.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <FileTerminal className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No notices found</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto">There are currently no notices matching your search criteria or status filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNotices?.map((notice: any) => {
                    const initials = notice.teacher?.name?.split(' ').map((n:any)=>n[0]).join('').toUpperCase().substring(0,2) || 'NA';
                    
                    return (
                      <tr key={notice.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px] bg-[#eff6ff] text-[#3b82f6] shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[#0f172a] text-[15px]">{notice.teacher?.name}</span>
                              <span className="text-[#64748b] text-[13px] max-w-[200px] line-clamp-1">{notice.message}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="text-[#0f172a] font-bold text-[14.5px]">{notice.student?.name}</span>
                            <span className="text-[#64748b] text-[13px]">ID: {notice.student?.id_number || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          {notice.status === 'acknowledged' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold text-emerald-700 bg-emerald-50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                              Acknowledged
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold text-orange-700 bg-orange-50">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"></span>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="text-[#0f172a] font-semibold text-[14.5px]">{new Date(notice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="text-[#64748b] text-[13px]">{new Date(notice.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" className="w-9 h-9 rounded-lg p-0 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50">
                              <Eye className="w-[18px] h-[18px]" strokeWidth={2} />
                            </Button>
                            <Button variant="outline" className="w-9 h-9 rounded-lg p-0 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50">
                              <Pencil className="w-[18px] h-[18px]" strokeWidth={2} />
                            </Button>
                            <Button variant="outline" className="w-9 h-9 rounded-lg p-0 border-red-100 text-red-500 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-[18px] h-[18px]" strokeWidth={2} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white">
            <span className="text-[14px] text-slate-500 font-medium">
              Showing 1 to {filteredNotices?.length || 0} of {noticesTotal} results
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-400">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button className="w-9 h-9 p-0 rounded-lg bg-[#a81616] hover:bg-[#8b1111] text-white font-bold">1</Button>
              <Button variant="outline" className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-600 font-bold hover:bg-slate-50">2</Button>
              <Button variant="outline" className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-600 font-bold hover:bg-slate-50">3</Button>
              <Button variant="outline" className="w-9 h-9 p-0 rounded-lg border-slate-200 text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
