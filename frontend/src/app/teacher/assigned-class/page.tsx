'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CheckCircle2, XCircle, Search, Filter, MoreVertical, Calendar, Clock, MapPin, ClipboardList, Check, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { getImageUrl } from '@/lib/utils';
import { CustomSelect } from '@/components/ui/custom-select';

export default function AssignedClassPage() {
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['teacher-assigned-classes'],
    queryFn: async () => {
      const res = await api.get('/api/teacher/assigned-classes');
      return res.data; // Now returns { overview, classes }
    }
  });

  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: classAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['teacher-class-attendance', selectedClass?.grade, selectedClass?.section],
    queryFn: async () => {
      if (!selectedClass) return null;
      const res = await api.get(`/api/teacher/class-attendance?grade=${selectedClass.grade}&section=${selectedClass.section}`);
      return res.data;
    },
    enabled: !!selectedClass
  });

  const overview = responseData?.overview || { assigned_classes: 0, total_students: 0, present_today: 0, absent_today: 0 };
  const classes = responseData?.classes || [];

  const filteredClasses = classes.filter((c: any) => {
    // Search match
    const searchString = `${c.grade} ${c.section} ${c.subject}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());

    // Filter match
    let matchesFilter = true;
    if (filterStatus === 'perfect') {
      matchesFilter = (c.attendance?.absent === 0 && c.attendance?.late === 0);
    } else if (filterStatus === 'with-absents') {
      matchesFilter = (c.attendance?.absent > 0);
    }

    return matchesSearch && matchesFilter;
  });

  // Trend percentages calculation for visual matching
  const presentRate = overview.total_students > 0 ? ((overview.present_today / overview.total_students) * 100).toFixed(1) : '0.0';
  const absentRate = overview.total_students > 0 ? ((overview.absent_today / overview.total_students) * 100).toFixed(1) : '0.0';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 py-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assigned Classes</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and view real-time attendance for your assigned classes.</p>
          </div>
          <div className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 text-xs font-semibold text-emerald-600 flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Live Monitoring Active
          </div>
        </div>

        {/* 4 Stat Cards Top Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Assigned Classes */}
          <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl">
            <CardContent className="p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Classes</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-3xl font-black text-slate-800">{overview.assigned_classes}</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium">Class</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Students */}
          <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl">
            <CardContent className="p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Students</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-3xl font-black text-slate-800">{overview.total_students}</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium">Students</p>
              </div>
            </CardContent>
          </Card>

          {/* Present Today */}
          <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl">
            <CardContent className="p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Present Today</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-3xl font-black text-slate-800">{overview.present_today}</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium">Students</p>
                <p className="text-xs font-bold text-emerald-500 mt-0.5">{presentRate}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Absent Today */}
          <Card className="border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl">
            <CardContent className="p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Absent Today</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-3xl font-black text-slate-800">{overview.absent_today}</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium">Students</p>
                <p className="text-xs font-bold text-red-500 mt-0.5">{absentRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search class..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[250px] bg-white border-slate-200 rounded-lg text-sm shadow-sm h-10"
            />
          </div>
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'perfect', label: 'Perfect Attendance' },
              { value: 'with-absents', label: 'With Absents' }
            ]}
            icon={<Filter className="w-4 h-4 text-slate-400" />}
            className="w-[180px]"
            triggerClassName="h-10 px-3 bg-white border border-slate-200 rounded-lg shadow-sm"
          />
        </div>

        {/* Classes List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="animate-pulse bg-white h-64 rounded-2xl w-full border border-slate-100 shadow-sm"></div>
          ) : filteredClasses.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-500 font-medium">No classes found.</p>
            </div>
          ) : (
            filteredClasses.map((c: any, index: number) => {
              const presentCount = c.attendance?.present || 0;
              const lateCount = c.attendance?.late || 0;
              const absentCount = c.attendance?.absent || 0;
              const total = presentCount + lateCount + absentCount;
              
              const pRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : '0.0';
              const lRate = total > 0 ? ((lateCount / total) * 100).toFixed(1) : '0.0';
              const aRate = total > 0 ? ((absentCount / total) * 100).toFixed(1) : '0.0';

              return (
                <Dialog key={index} onOpenChange={(open) => !open && setSelectedClass(null)}>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col lg:flex-row relative">
                    {/* Maroon left border */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#8C1D2A]"></div>
                    
                    {/* Left content area */}
                    <div className="flex-1 p-6 pl-8">
                      <div className="flex justify-between items-start mb-2">
                        <div className="bg-[#8C1D2A] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md inline-block">
                          {c.subject || 'GENERAL ADVISORY'}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 text-[10px] font-bold text-emerald-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            LIVE
                          </div>
                          <button className="text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Fix typo here from Grade Grade 10 to just Grade 10 */}
                      <h2 className="text-2xl font-black text-slate-800 mb-4">{c.grade} - {c.section}</h2>

                      <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium mb-8">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          {c.total_students || total} Students
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {c.schedule || 'Mon - Fri'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {c.time || '8:00 AM - 9:00 AM'}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {c.room || 'Room 201'}
                        </div>
                      </div>

                      {/* Attendance Today Inner Box */}
                      <div className="mb-6">
                        <h4 className="text-[13px] font-bold text-slate-800 mb-3">Attendance Today</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Present Box */}
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center relative overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-white border border-emerald-100 flex items-center justify-center shrink-0 mr-4 shadow-sm z-10">
                              <Check className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="z-10 flex-1">
                              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Present</p>
                              <h3 className="text-2xl font-black text-slate-800">{presentCount}</h3>
                            </div>
                            <div className="absolute bottom-3 right-4 z-10">
                              <span className="text-[11px] font-bold text-emerald-600">{pRate}%</span>
                            </div>
                          </div>

                          {/* Late Box */}
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center relative overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-white border border-amber-100 flex items-center justify-center shrink-0 mr-4 shadow-sm z-10">
                              <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="z-10 flex-1">
                              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Late</p>
                              <h3 className="text-2xl font-black text-slate-800">{lateCount}</h3>
                            </div>
                            <div className="absolute bottom-3 right-4 z-10">
                              <span className="text-[11px] font-bold text-amber-600">{lRate}%</span>
                            </div>
                          </div>

                          {/* Absent Box */}
                          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center relative overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-white border border-red-100 flex items-center justify-center shrink-0 mr-4 shadow-sm z-10">
                              <XCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="z-10 flex-1">
                              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Absent</p>
                              <h3 className="text-2xl font-black text-slate-800">{absentCount}</h3>
                            </div>
                            <div className="absolute bottom-3 right-4 z-10">
                              <span className="text-[11px] font-bold text-red-600">{aRate}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <DialogTrigger 
                        onClick={() => setSelectedClass(c)}
                        className="w-full bg-[#8C1D2A] hover:bg-[#6c1620] text-white rounded-xl py-3.5 px-4 font-bold text-sm flex items-center justify-center relative transition-colors shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5">
                            <div className="w-1.5 h-1.5 bg-white rounded-full relative">
                              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
                            </div>
                          </span>
                          Live Attendance
                        </div>
                        <ArrowRight className="w-4 h-4 absolute right-5" />
                      </DialogTrigger>
                    </div>

                    {/* Right decorative area */}
                    <div className="hidden lg:flex w-72 bg-slate-50/50 items-center justify-center p-8 border-l border-slate-100">
                      <div className="relative w-48 h-48 opacity-80">
                        {/* Stylized clipboard illustration */}
                        <div className="absolute inset-0 bg-red-50 rounded-3xl transform rotate-3"></div>
                        <div className="absolute inset-0 bg-white rounded-3xl border-2 border-red-200 shadow-md transform -rotate-2 flex flex-col items-center pt-8 p-4">
                          <div className="absolute -top-4 w-16 h-8 bg-[#8C1D2A] rounded-lg"></div>
                          <div className="absolute -top-6 w-6 h-4 bg-red-800 rounded-t-lg"></div>
                          
                          <div className="w-full space-y-4 mt-2">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="flex items-center gap-3 w-full">
                                <div className="w-4 h-4 rounded-sm border-2 border-emerald-400 bg-emerald-50 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-emerald-500" />
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full flex-1"></div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Floating clock */}
                          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white rounded-full border-4 border-red-100 shadow-lg flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full border-2 border-[#8C1D2A] flex items-center justify-center relative">
                              <div className="w-1 h-1 bg-[#8C1D2A] rounded-full"></div>
                              <div className="absolute w-0.5 h-4 bg-[#8C1D2A] bottom-1/2 left-1/2 origin-bottom"></div>
                              <div className="absolute w-0.5 h-3 bg-[#8C1D2A] bottom-1/2 left-1/2 origin-bottom rotate-90"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white rounded-3xl" showCloseButton={false}>
                      {/* Header */}
                      <div className="p-6 border-b border-slate-100 flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                          <Users className="w-6 h-6 text-[#8C1D2A]" />
                        </div>
                        <div className="flex-1 mt-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-black text-slate-800">
                              {c.grade} - {c.section}
                            </h2>
                            <span className="text-[10px] font-bold bg-red-50 text-[#8C1D2A] px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {c.subject || 'GENERAL ADVISORY'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 font-medium">Live attendance status for this class.</p>
                        </div>
                        <DialogClose className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer">
                          <X className="w-5 h-5" />
                        </DialogClose>
                      </div>

                      <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto">
                        {loadingAttendance ? (
                          <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl"></div>)}
                          </div>
                        ) : (
                          <>
                            {/* Present */}
                            <div className="flex items-start gap-5">
                              <div className="flex items-center gap-4 shrink-0 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                  <Check className="w-5 h-5 text-emerald-600" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-[15px] font-black text-slate-800 mb-1">Present ({classAttendance?.present?.length || 0})</h3>
                                
                                {classAttendance?.present?.length > 0 ? (
                                  <div className="grid grid-cols-1 gap-2 mt-3">
                                    {classAttendance?.present?.map((student: any) => (
                                      <div key={student.id} className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-50">
                                        <img src={getImageUrl(student.photo_url)} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                                        <div>
                                          <p className="font-bold text-slate-700 text-sm">{student.name}</p>
                                          <p className="text-xs text-emerald-600 font-medium">Time In: {student.time_in}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-500 text-sm font-medium mt-1">No students marked present yet.</p>
                                )}
                              </div>
                            </div>

                            {/* Late */}
                            <div className="flex items-start gap-5">
                              <div className="flex items-center gap-4 shrink-0 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                                  <Clock className="w-5 h-5 text-amber-500" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-[15px] font-black text-slate-800 mb-1">Late ({classAttendance?.late?.length || 0})</h3>
                                
                                {classAttendance?.late?.length > 0 ? (
                                  <div className="grid grid-cols-1 gap-2 mt-3">
                                    {classAttendance?.late?.map((student: any) => (
                                      <div key={student.id} className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-50">
                                        <img src={getImageUrl(student.photo_url)} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                                        <div>
                                          <p className="font-bold text-slate-700 text-sm">{student.name}</p>
                                          <p className="text-xs text-amber-600 font-medium">Time In: {student.time_in}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-500 text-sm font-medium mt-1">No students marked late.</p>
                                )}
                              </div>
                            </div>

                            {/* Absent */}
                            <div className="flex items-start gap-5">
                              <div className="flex items-center gap-4 shrink-0 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                                  <X className="w-5 h-5 text-red-500" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-[15px] font-black text-slate-800 mb-1">Absent ({classAttendance?.absent?.length || 0})</h3>
                                
                                {classAttendance?.absent?.length > 0 ? (
                                  <div className="grid grid-cols-1 gap-2 mt-3">
                                    {classAttendance?.absent?.map((student: any) => (
                                      <div key={student.id} className="flex items-center gap-4 p-3 bg-red-50 rounded-xl border border-red-100 shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200 overflow-hidden">
                                          <img src={getImageUrl(student.photo_url)} alt="" className="w-10 h-10 object-cover" />
                                        </div>
                                        <div>
                                          <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                                          <p className="text-xs text-red-500 font-medium">Not Scanned In</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-500 text-sm font-medium mt-1">No students marked absent.</p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-4 border-t border-slate-100 flex justify-end">
                        <DialogClose className="px-6 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                          Close
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </div>
                </Dialog>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredClasses.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500">
              Showing 1 to {filteredClasses.length} of {filteredClasses.length} class{filteredClasses.length > 1 ? 'es' : ''}
            </p>
            <div className="flex items-center gap-1 mt-4 sm:mt-0">
              <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:bg-slate-50">
                &lt;
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-[#8C1D2A] text-white font-bold text-xs">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:bg-slate-50">
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
