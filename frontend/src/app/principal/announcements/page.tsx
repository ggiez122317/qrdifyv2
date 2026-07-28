'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Plus, Search, Filter, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Send, Clock, Wrench, Star, FileText, CalendarDays, Users, ChevronDown, MessageSquare, X, Briefcase, GraduationCap, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomSelect } from '@/components/ui/custom-select';

export default function AnnouncementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAudienceDropdownOpen, setIsAudienceDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewAnnouncement, setViewAnnouncement] = useState<any>(null);
  
  const [editAnnouncement, setEditAnnouncement] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ title: '', content: '', audience: 'all', event_date: '', event_time: '' });
  const [isEditAudienceDropdownOpen, setIsEditAudienceDropdownOpen] = useState(false);
  
  const [deleteAnnouncement, setDeleteAnnouncement] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    audience: 'all',
    event_date: '',
    event_time: '',
    save_template: false,
  });

  const { data: announcementsData, isLoading, refetch } = useQuery({
    queryKey: ['principal-announcements'],
    queryFn: async () => {
      const res = await api.get('/api/principal/announcements');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: templates } = useQuery({
    queryKey: ['principal-announcement-templates'],
    queryFn: async () => {
      const res = await api.get('/api/principal/announcement-templates');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const announcements = announcementsData?.data || [];
  const announcementsTotal = announcementsData?.total || 0;

  const filteredAnnouncements = announcements.filter((ann: any) => {
    return ann.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleBroadcast = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      localStorage.setItem('toast_message', 'Title and content are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/api/principal/announcements', formData);
      localStorage.setItem('toast_message', 'Announcement broadcasted successfully!');
      setIsModalOpen(false);
      setFormData({ title: '', content: '', audience: 'all', event_date: '', event_time: '', save_template: false });
      refetch();
    } catch (error) {
      localStorage.setItem('toast_message', 'Failed to broadcast announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editFormData.title.trim() || !editFormData.content.trim()) {
      localStorage.setItem('toast_message', 'Title and content are required');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.put(`/api/principal/announcements/${editAnnouncement.id}`, editFormData);
      localStorage.setItem('toast_message', 'Announcement updated successfully!');
      setEditAnnouncement(null);
      refetch();
    } catch (error) {
      localStorage.setItem('toast_message', 'Failed to update announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await api.delete(`/api/principal/announcements/${deleteAnnouncement.id}`);
      localStorage.setItem('toast_message', 'Announcement deleted successfully!');
      setDeleteAnnouncement(null);
      refetch();
    } catch (error) {
      localStorage.setItem('toast_message', 'Failed to delete announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIconForTitle = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('schedule') || t.includes('exam')) return { icon: <CalendarDays className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' };
    if (t.includes('maintenance')) return { icon: <Wrench className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50' };
    if (t.includes('policy')) return { icon: <Star className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' };
    if (t.includes('reminder')) return { icon: <FileText className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50' };
    return { icon: <Megaphone className="w-5 h-5 text-red-500" />, bg: 'bg-red-50' };
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-[#F8FAFC] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">Announcements</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-1">Broadcast important information to staff or parents/students.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#a81616] hover:bg-[#8b1111] text-white font-bold h-11 px-6 rounded-lg shadow-sm">
          <Plus className="w-5 h-5 mr-2" />
          New Broadcast
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Total Announcements</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{announcementsTotal}</span>
              <span className="text-[#94a3b8] text-[13px] mt-1">All broadcasts</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-red-50 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Published</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">{announcementsTotal}</span>
              <span className="text-[#3b82f6] text-[13px] mt-1 font-medium">Active broadcasts</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-blue-50 flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Scheduled</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">0</span>
              <span className="text-[#f97316] text-[13px] mt-1 font-medium">Upcoming broadcasts</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-orange-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Read Rate</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">100%</span>
              <span className="text-[#22c55e] text-[13px] mt-1 font-medium">Average read rate</span>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
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
                placeholder="Search announcements..." 
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
                  { value: 'published', label: 'Published' },
                  { value: 'scheduled', label: 'Scheduled' }
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
                  <th className="px-8 py-5">TITLE</th>
                  <th className="px-8 py-5">TARGET AUDIENCE</th>
                  <th className="px-8 py-5">STATUS</th>
                  <th className="px-8 py-5">PUBLISHED ON</th>
                  <th className="px-8 py-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-50">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                          <div className="flex flex-col gap-2">
                            <div className="h-4 w-40 bg-slate-200 rounded"></div>
                            <div className="h-3 w-64 bg-slate-100 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
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
                ) : (!filteredAnnouncements || filteredAnnouncements.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Megaphone className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No announcements found</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto">There are currently no announcements matching your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAnnouncements?.map((ann: any) => {
                    const { icon, bg } = getIconForTitle(ann.title);
                    
                    return (
                      <tr key={ann.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                              {icon}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[#0f172a] text-[15px]">{ann.title}</span>
                              <span className="text-[#64748b] text-[13px] line-clamp-1 max-w-[300px]">{ann.content}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-[#475569] text-[14.5px]">
                            {ann.audience === 'all' ? 'All Students, Staff' : (ann.audience === 'staff' ? 'All Staff' : 'Students')}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold text-emerald-700 bg-emerald-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                            Published
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="text-[#0f172a] font-semibold text-[14.5px]">{new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="text-[#64748b] text-[13px]">{new Date(ann.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setViewAnnouncement(ann)}
                              className="w-9 h-9 rounded-lg p-0 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="w-[18px] h-[18px]" strokeWidth={2} />
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setEditAnnouncement(ann);
                                setEditFormData({
                                  title: ann.title,
                                  content: ann.content,
                                  audience: ann.audience,
                                  event_date: ann.event_date || '',
                                  event_time: ann.event_time ? ann.event_time.substring(0, 5) : ''
                                });
                              }}
                              className="w-9 h-9 rounded-lg p-0 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil className="w-[18px] h-[18px]" strokeWidth={2} />
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setDeleteAnnouncement(ann)}
                              className="w-9 h-9 rounded-lg p-0 border-red-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
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
              Showing 1 to {filteredAnnouncements?.length || 0} of {announcementsTotal} results
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[600px] p-0 border-none rounded-2xl overflow-hidden shadow-2xl">
          <div className="relative">
            {/* Abstract red background shape in the top right */}
            <div className="absolute top-0 right-0 w-64 h-32 bg-red-50/50 rounded-bl-[100px] -z-10"></div>
            <div className="absolute top-4 right-4 opacity-10 -z-10">
                <Users className="w-24 h-24 text-red-500" />
            </div>

            <div className="p-8 pb-4 flex gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex flex-col pt-1">
                <h2 className="text-[18px] font-bold text-[#0f172a]">Broadcast Announcement</h2>
                <p className="text-[13px] text-slate-500 mt-1">Create a new announcement and select the target audience.</p>
              </div>
            </div>

            <div className="px-8 py-4 space-y-6 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {templates && templates.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#0f172a]">Use Template (Optional)</Label>
                  <div className="relative">
                    <select 
                      className="w-full h-11 pl-3 pr-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-[13px] font-medium outline-none appearance-none focus:ring-4 focus:ring-slate-100 transition-all cursor-pointer relative z-0"
                      onChange={(e) => {
                        const template = templates.find((t: any) => t.id.toString() === e.target.value);
                        if (template) {
                          setFormData({
                            ...formData,
                            title: template.title,
                            content: template.content,
                            audience: template.audience,
                          });
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select a saved template...</option>
                      {templates.map((template: any) => (
                        <option key={template.id} value={template.id}>
                          {template.title}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#0f172a]">Title</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <FileText className="w-[18px] h-[18px]" />
                  </div>
                  <Input 
                    placeholder="e.g. General Assembly Tomorrow"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="h-11 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-400 font-medium text-[#0f172a]"
                    maxLength={100}
                  />
                </div>
                <div className="flex justify-end">
                  <span className="text-[12px] text-slate-400 font-medium">{formData.title.length}/100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#0f172a]">Date (Optional)</Label>
                  <Input 
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                    className="h-11 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all text-[#0f172a] font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#0f172a]">Time (Optional)</Label>
                  <Input 
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                    className="h-11 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all text-[#0f172a] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label className="text-[13px] font-bold text-[#0f172a]">Target Audience</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 z-10 pointer-events-none">
                    {formData.audience === 'all' && <Users className="w-[18px] h-[18px]" />}
                    {formData.audience === 'staff' && <Briefcase className="w-[18px] h-[18px]" />}
                    {formData.audience === 'students_parents' && <GraduationCap className="w-[18px] h-[18px]" />}
                  </div>
                  <div 
                    onClick={() => setIsAudienceDropdownOpen(!isAudienceDropdownOpen)}
                    className="w-full h-11 pl-10 pr-10 rounded-lg border-2 border-red-500 bg-white text-[#0f172a] text-[13px] font-medium flex items-center cursor-pointer relative z-0"
                  >
                    {formData.audience === 'all' && 'Everyone (Staff, Parents, Students)'}
                    {formData.audience === 'staff' && 'Teachers and Staff Only'}
                    {formData.audience === 'students_parents' && 'Parents and Students Only'}
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none z-10">
                    <ChevronDown className={`w-4 h-4 transition-transform ${isAudienceDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isAudienceDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsAudienceDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-[68px] z-50 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden py-1">
                      <div 
                        className="px-3 py-2.5 flex items-center gap-3 hover:bg-red-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setFormData({...formData, audience: 'all'});
                          setIsAudienceDropdownOpen(false);
                        }}
                      >
                        <Users className={`w-[18px] h-[18px] ${formData.audience === 'all' ? 'text-red-500' : 'text-slate-400'}`} />
                        <span className={`text-[13px] flex-1 ${formData.audience === 'all' ? 'font-bold text-red-600' : 'font-medium text-slate-700'}`}>
                          Everyone (Staff, Parents, Students)
                        </span>
                        {formData.audience === 'all' && <Check className="w-4 h-4 text-red-500" />}
                      </div>
                      <div 
                        className="px-3 py-2.5 flex items-center gap-3 hover:bg-red-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setFormData({...formData, audience: 'staff'});
                          setIsAudienceDropdownOpen(false);
                        }}
                      >
                        <Briefcase className={`w-[18px] h-[18px] ${formData.audience === 'staff' ? 'text-red-500' : 'text-slate-400'}`} />
                        <span className={`text-[13px] flex-1 ${formData.audience === 'staff' ? 'font-bold text-red-600' : 'font-medium text-slate-700'}`}>
                          Teachers and Staff Only
                        </span>
                        {formData.audience === 'staff' && <Check className="w-4 h-4 text-red-500" />}
                      </div>
                      <div 
                        className="px-3 py-2.5 flex items-center gap-3 hover:bg-red-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setFormData({...formData, audience: 'students_parents'});
                          setIsAudienceDropdownOpen(false);
                        }}
                      >
                        <GraduationCap className={`w-[18px] h-[18px] ${formData.audience === 'students_parents' ? 'text-red-500' : 'text-slate-400'}`} />
                        <span className={`text-[13px] flex-1 ${formData.audience === 'students_parents' ? 'font-bold text-red-600' : 'font-medium text-slate-700'}`}>
                          Parents and Students Only
                        </span>
                        {formData.audience === 'students_parents' && <Check className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#0f172a]">Message Content</Label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400">
                    <MessageSquare className="w-[18px] h-[18px]" />
                  </div>
                  <Textarea 
                    placeholder="Type your announcement here..."
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={6}
                    maxLength={1000}
                    className="pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all resize-none placeholder:text-slate-400 font-medium leading-relaxed text-[#0f172a]"
                  />
                </div>
                <div className="flex justify-end">
                  <span className="text-[12px] text-slate-400 font-medium">{formData.content.length}/1000</span>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 flex items-center justify-between bg-white mt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.save_template}
                  onChange={(e) => setFormData({...formData, save_template: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-[13px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Save as Template</span>
              </label>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-lg font-bold text-[#0f172a] hover:bg-slate-50 border-slate-200 text-[13px]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleBroadcast} 
                  disabled={isSubmitting} 
                  className="h-10 px-6 rounded-lg bg-[#a81616] hover:bg-[#8b1111] text-white font-bold text-[13px]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Saving...' : (formData.save_template ? 'Save & Broadcast' : 'Broadcast')}
                </Button>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0f172a] transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {/* View Modal */}
      <Dialog open={!!viewAnnouncement} onOpenChange={() => setViewAnnouncement(null)}>
        <DialogContent className="max-w-[500px] p-0 overflow-hidden bg-white rounded-2xl">
          {viewAnnouncement && (
            <div className="flex flex-col h-full">
              <div className="px-8 pt-8 pb-6 bg-[#f8fafc] border-b border-slate-100 relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${getIconForTitle(viewAnnouncement.title).bg}`}>
                    {React.cloneElement(getIconForTitle(viewAnnouncement.title).icon, { className: "w-7 h-7 text-[#0f172a]" })}
                  </div>
                  <div>
                    <h2 className="text-[20px] font-extrabold text-[#0f172a] leading-tight">{viewAnnouncement.title}</h2>
                    <p className="text-slate-500 text-[14px] font-medium mt-1">
                      {new Date(viewAnnouncement.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(viewAnnouncement.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Message Content</Label>
                  <p className="text-[#0f172a] text-[15px] leading-relaxed whitespace-pre-wrap">{viewAnnouncement.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <Label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Target Audience</Label>
                    <p className="text-[#0f172a] font-semibold text-[14px]">
                      {viewAnnouncement.audience === 'all' ? 'Everyone (Staff, Parents, Students)' : (viewAnnouncement.audience === 'staff' ? 'Teachers and Staff Only' : 'Parents and Students Only')}
                    </p>
                  </div>
                  {(viewAnnouncement.event_date || viewAnnouncement.event_time) && (
                    <div className="space-y-1">
                      <Label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Event Schedule</Label>
                      <p className="text-[#0f172a] font-semibold text-[14px]">
                        {viewAnnouncement.event_date && new Date(viewAnnouncement.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {viewAnnouncement.event_date && viewAnnouncement.event_time && ' at '}
                        {viewAnnouncement.event_time && new Date(`2000-01-01T${viewAnnouncement.event_time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-8 py-4 bg-slate-50 flex justify-end">
                <Button onClick={() => setViewAnnouncement(null)} className="h-10 px-6 rounded-lg font-bold text-[#0f172a] hover:bg-slate-200 bg-white border border-slate-200 text-[13px]">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editAnnouncement} onOpenChange={() => setEditAnnouncement(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-[600px] p-0 border-none rounded-2xl overflow-hidden shadow-2xl">
          <div className="relative">
            {/* Abstract red background shape in the top right */}
            <div className="absolute top-0 right-0 w-64 h-32 bg-red-50/50 rounded-bl-[100px] -z-10"></div>
            <div className="absolute top-4 right-4 opacity-10 -z-10">
                <Pencil className="w-24 h-24 text-red-500" />
            </div>

            <div className="p-8 pb-4 flex gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Pencil className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex flex-col pt-1">
                <h2 className="text-[18px] font-bold text-[#0f172a]">Edit Announcement</h2>
                <p className="text-[13px] text-slate-500 mt-1">Make changes to the existing announcement.</p>
              </div>
            </div>

            <div className="px-8 py-4 space-y-6 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#0f172a]">Title</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <FileText className="w-[18px] h-[18px]" />
                  </div>
                  <Input 
                    placeholder="e.g. General Assembly Tomorrow"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="h-11 pl-10 pr-3 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-400 font-medium text-[#0f172a]"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#0f172a]">Date (Optional)</Label>
                  <Input 
                    type="date"
                    value={editFormData.event_date}
                    onChange={(e) => setEditFormData({...editFormData, event_date: e.target.value})}
                    className="h-11 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all text-[#0f172a] font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#0f172a]">Time (Optional)</Label>
                  <Input 
                    type="time"
                    value={editFormData.event_time}
                    onChange={(e) => setEditFormData({...editFormData, event_time: e.target.value})}
                    className="h-11 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all text-[#0f172a] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label className="text-[13px] font-bold text-[#0f172a]">Target Audience</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 z-10 pointer-events-none">
                    {editFormData.audience === 'all' && <Users className="w-[18px] h-[18px]" />}
                    {editFormData.audience === 'staff' && <Briefcase className="w-[18px] h-[18px]" />}
                    {editFormData.audience === 'students_parents' && <GraduationCap className="w-[18px] h-[18px]" />}
                  </div>
                  <div 
                    onClick={() => setIsEditAudienceDropdownOpen(!isEditAudienceDropdownOpen)}
                    className="w-full h-11 pl-10 pr-10 rounded-lg border-2 border-red-500 bg-white text-[#0f172a] text-[13px] font-medium flex items-center cursor-pointer relative z-0"
                  >
                    {editFormData.audience === 'all' && 'Everyone (Staff, Parents, Students)'}
                    {editFormData.audience === 'staff' && 'Teachers and Staff Only'}
                    {editFormData.audience === 'students_parents' && 'Parents and Students Only'}
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none z-10">
                    <ChevronDown className={`w-4 h-4 transition-transform ${isEditAudienceDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isEditAudienceDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsEditAudienceDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-[68px] z-50 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden py-1">
                      <div 
                        className="px-3 py-2.5 flex items-center gap-3 hover:bg-red-50 cursor-pointer transition-colors"
                        onClick={() => { setEditFormData({...editFormData, audience: 'all'}); setIsEditAudienceDropdownOpen(false); }}
                      >
                        <Users className={`w-[18px] h-[18px] ${editFormData.audience === 'all' ? 'text-red-500' : 'text-slate-400'}`} />
                        <span className={`text-[13px] flex-1 ${editFormData.audience === 'all' ? 'font-bold text-red-600' : 'font-medium text-slate-700'}`}>Everyone (Staff, Parents, Students)</span>
                        {editFormData.audience === 'all' && <Check className="w-4 h-4 text-red-500" />}
                      </div>
                      <div 
                        className="px-3 py-2.5 flex items-center gap-3 hover:bg-red-50 cursor-pointer transition-colors"
                        onClick={() => { setEditFormData({...editFormData, audience: 'staff'}); setIsEditAudienceDropdownOpen(false); }}
                      >
                        <Briefcase className={`w-[18px] h-[18px] ${editFormData.audience === 'staff' ? 'text-red-500' : 'text-slate-400'}`} />
                        <span className={`text-[13px] flex-1 ${editFormData.audience === 'staff' ? 'font-bold text-red-600' : 'font-medium text-slate-700'}`}>Teachers and Staff Only</span>
                        {editFormData.audience === 'staff' && <Check className="w-4 h-4 text-red-500" />}
                      </div>
                      <div 
                        className="px-3 py-2.5 flex items-center gap-3 hover:bg-red-50 cursor-pointer transition-colors"
                        onClick={() => { setEditFormData({...editFormData, audience: 'students_parents'}); setIsEditAudienceDropdownOpen(false); }}
                      >
                        <GraduationCap className={`w-[18px] h-[18px] ${editFormData.audience === 'students_parents' ? 'text-red-500' : 'text-slate-400'}`} />
                        <span className={`text-[13px] flex-1 ${editFormData.audience === 'students_parents' ? 'font-bold text-red-600' : 'font-medium text-slate-700'}`}>Parents and Students Only</span>
                        {editFormData.audience === 'students_parents' && <Check className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#0f172a]">Message Content</Label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400">
                    <MessageSquare className="w-[18px] h-[18px]" />
                  </div>
                  <Textarea 
                    placeholder="Type your announcement here..."
                    value={editFormData.content}
                    onChange={(e) => setEditFormData({...editFormData, content: e.target.value})}
                    rows={6}
                    maxLength={1000}
                    className="pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all resize-none placeholder:text-slate-400 font-medium leading-relaxed text-[#0f172a]"
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-5 flex items-center justify-end bg-white mt-2 border-t border-slate-100">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setEditAnnouncement(null)} 
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-lg font-bold text-[#0f172a] hover:bg-slate-50 border-slate-200 text-[13px]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate} 
                  disabled={isSubmitting} 
                  className="h-10 px-6 rounded-lg bg-[#a81616] hover:bg-[#8b1111] text-white font-bold text-[13px]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

            <button 
              onClick={() => setEditAnnouncement(null)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0f172a] transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deleteAnnouncement} onOpenChange={() => setDeleteAnnouncement(null)}>
        <DialogContent className="max-w-[400px] p-6 bg-white rounded-2xl border-none shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
            <Trash2 className="w-8 h-8" />
          </div>
          <h2 className="text-[20px] font-extrabold text-[#0f172a] mb-2">Delete Announcement?</h2>
          <p className="text-slate-500 text-[14px] font-medium mb-8">
            Are you sure you want to delete this announcement? This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => setDeleteAnnouncement(null)} 
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-lg font-bold text-[#0f172a] hover:bg-slate-50 border-slate-200 text-[14px]"
            >
              No, Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              disabled={isSubmitting} 
              className="flex-1 h-11 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-[14px]"
            >
              {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
