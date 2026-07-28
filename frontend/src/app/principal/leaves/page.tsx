'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, CheckCircle2, UserMinus, Clock, ChevronLeft, ChevronRight, Check, X, ShieldAlert, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/ui/custom-select';

const mockLeaves = [
  { id: 1, name: 'Emma Johnson', role: 'Software Engineer', type: 'Annual Leave', start: 1, end: 6, color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 2, name: 'Liam Smith', role: 'Sales Manager', type: 'Sick Leave', start: 7, end: 9, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 3, name: 'Olivia Brown', role: 'HR Specialist', type: 'Maternity Leave', start: 3, end: 15, color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 4, name: 'Noah Williams', role: 'Financial Analyst', type: 'Remote Leave', start: 10, end: 14, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 5, name: 'Ava Davis', role: 'Marketing Specialist', type: 'Personal Leave', start: 12, end: 14, color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

const mockApprovals = [
  { id: 1, name: 'Sophia Garcia', type: 'Annual Leave', dates: 'Jul 27 - Jul 31, 2026 · 5 days', reason: 'Trip with family to Hawaii.', color: 'text-[#a81616]' },
  { id: 2, name: 'Daniel Kim', type: 'Sick Leave', dates: 'Jul 22 - Jul 23, 2026 · 2 days', reason: 'Not feeling well, doctor visit.', color: 'text-emerald-600' },
  { id: 3, name: 'Isabella Martinez', type: 'Personal Leave', dates: 'Jul 24, 2026 · 1 day', reason: 'Personal errands and appointments.', color: 'text-purple-600' },
  { id: 4, name: 'Arjun Mehta', type: 'Annual Leave', dates: 'Aug 3 - Aug 7, 2026 · 5 days', reason: 'Vacation with friends.', color: 'text-[#a81616]' },
];

const mockUpcoming = [
  { dates: 'Jul 22 - Jul 23', name: 'Daniel Kim', type: 'Sick Leave', color: 'text-emerald-600 bg-emerald-50' },
  { dates: 'Jul 24', name: 'Isabella Martinez', type: 'Personal Leave', color: 'text-purple-600 bg-purple-50' },
  { dates: 'Jul 27 - Jul 31', name: 'Sophia Garcia', type: 'Annual Leave', color: 'text-[#a81616] bg-red-50' },
  { dates: 'Aug 3 - Aug 7', name: 'Arjun Mehta', type: 'Annual Leave', color: 'text-[#a81616] bg-red-50' },
  { dates: 'Aug 10 - Aug 14', name: 'William Davis', type: 'Remote Leave', color: 'text-orange-600 bg-orange-50' },
];

export default function LeaveManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const calendarDays = Array.from({ length: 15 }, (_, i) => {
    const dayNames = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];
    return { date: i + 1, day: dayNames[i] };
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-[#F8FAFC] min-h-screen">
      
      {/* Header Section (Uniform with Employees Page) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">Leave Management</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-1">Manage employee leave requests, balances, and approvals.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
            <Input 
              placeholder="Search employees, leave requests..." 
              className="pl-10 h-[46px] bg-white border-slate-200 rounded-xl text-[15px] focus:ring-1 focus:ring-slate-300 w-full shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Pending Requests</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">28</span>
              <div className="flex items-center text-[12px] font-bold mt-1">
                <span className="text-amber-500">↗ 12.0%</span>
                <span className="text-slate-400 ml-1">from last month</span>
              </div>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Approved This Month</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">64</span>
              <div className="flex items-center text-[12px] font-bold mt-1">
                <span className="text-emerald-500">↗ 15.4%</span>
                <span className="text-slate-400 ml-1">from last month</span>
              </div>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Employees On Leave</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">20</span>
              <div className="flex items-center text-[12px] font-bold mt-1">
                <span className="text-blue-500">↗ 5.2%</span>
                <span className="text-slate-400 ml-1">from last month</span>
              </div>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-blue-50 flex items-center justify-center">
              <UserMinus className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white p-6 flex flex-col justify-center min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[#64748b] text-[13px] font-bold">Avg Approval Time</span>
              <span className="text-[28px] font-extrabold text-[#0f172a] mt-1">1.8d</span>
              <div className="flex items-center text-[12px] font-bold mt-1">
                <span className="text-emerald-500">↓ 8.5%</span>
                <span className="text-slate-400 ml-1">from last month</span>
              </div>
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column (Col span 8) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* Leave Planner */}
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden h-[450px] flex flex-col">
            <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <CardTitle className="text-[17px] font-extrabold text-slate-800">Leave Planner</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" className="h-8 w-8 p-0 rounded-lg border-slate-200"><ChevronLeft className="w-4 h-4 text-slate-500" /></Button>
                  <Button variant="outline" className="h-8 px-3 rounded-lg border-slate-200 text-xs font-bold text-slate-600">Today</Button>
                  <Button variant="outline" className="h-8 w-8 p-0 rounded-lg border-slate-200"><ChevronRight className="w-4 h-4 text-slate-500" /></Button>
                </div>
                <div className="text-[15px] font-bold text-slate-800 ml-4">Jul 2026 <ChevronRight className="w-4 h-4 inline rotate-90" /></div>
              </div>
              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                <CustomSelect 
                  value="month"
                  onChange={() => {}}
                  options={[
                    { value: 'month', label: 'Month' },
                    { value: 'week', label: 'Week' }
                  ]}
                  triggerClassName="h-8 px-3 rounded-md min-w-[90px]"
                />
              </div>
            </CardHeader>

            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-6 shrink-0">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-red-400"></span> Annual</div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Sick</div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-purple-400"></span> Personal</div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-pink-400"></span> Maternity</div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Remote</div>
            </div>

            <CardContent className="p-0 flex-1 overflow-auto flex [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Employee List column */}
              <div className="w-[200px] border-r border-slate-100 shrink-0">
                <div className="h-[40px] flex items-center px-4 border-b border-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee</div>
                {mockLeaves.map((emp) => (
                  <div key={emp.id} className="h-[60px] px-4 flex items-center gap-3 border-b border-slate-50">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden shrink-0">
                      {emp.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-[13px] font-bold text-slate-800 truncate">{emp.name}</span>
                      <span className="text-[11px] font-medium text-slate-400 truncate">{emp.role}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid column */}
              <div className="flex-1 min-w-[800px] flex flex-col relative overflow-hidden">
                {/* Header Days */}
                <div className="h-[40px] flex border-b border-slate-50 text-center shrink-0">
                  <div className="flex-1 flex flex-col justify-center items-center font-bold text-[11px] text-slate-800 border-r border-slate-50 uppercase">Jul</div>
                  {calendarDays.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col justify-center items-center border-r border-slate-50">
                      <span className="text-[12px] font-bold text-slate-800">{d.date}</span>
                      <span className="text-[9px] font-medium text-slate-400 uppercase">{d.day}</span>
                    </div>
                  ))}
                </div>

                {/* Grid Rows */}
                <div className="flex-1 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    <div className="flex-1 border-r border-slate-50 h-full"></div>
                    {calendarDays.map((d) => (
                      <div key={d.date} className={`flex-1 border-r border-slate-50 h-full ${(d.day === 'Sat' || d.day === 'Sun') ? 'bg-slate-50/50' : ''}`}></div>
                    ))}
                  </div>

                  {/* Leave Bars */}
                  <div className="absolute inset-0 flex flex-col pointer-events-auto">
                    {mockLeaves.map((emp, i) => {
                      const totalCols = 16;
                      const colWidth = 100 / totalCols;
                      const left = (emp.start) * colWidth;
                      const width = (emp.end - emp.start + 1) * colWidth;

                      return (
                        <div key={emp.id} className="h-[60px] border-b border-slate-50 relative flex items-center hover:bg-slate-50/30">
                           <div 
                             className={`absolute h-[40px] rounded-lg border flex flex-col justify-center px-3 ${emp.color} shadow-sm overflow-hidden whitespace-nowrap cursor-pointer hover:brightness-95 transition-all`}
                             style={{ left: `${left}%`, width: `${width}%` }}
                           >
                             <span className="text-[11px] font-bold leading-tight truncate">{emp.type}</span>
                             <span className="text-[10px] opacity-80 leading-tight truncate font-medium">Jul {emp.start} - Jul {emp.end}, 2026</span>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Split (Balance & Policy) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-2xl bg-white h-[320px] flex flex-col">
              <CardHeader className="p-6 border-b border-slate-100 shrink-0">
                <CardTitle className="text-[15px] font-bold text-slate-800">Leave Balance Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left">
                  <thead className="text-[11px] text-slate-400 font-bold tracking-wider sticky top-0 bg-white border-b border-slate-50 uppercase">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-4 py-4 text-center">Annual Leave</th>
                      <th className="px-4 py-4 text-center">Sick Leave</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {mockLeaves.map(emp => (
                       <tr key={emp.id} className="hover:bg-slate-50/50">
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden shrink-0">
                               {emp.name.substring(0, 2).toUpperCase()}
                             </div>
                             <span className="font-bold text-slate-800 text-[13px]">{emp.name}</span>
                           </div>
                         </td>
                         <td className="px-4 py-4 text-center">
                           <div className="flex flex-col items-center">
                             <span className="text-[13px] font-bold text-[#0f172a] mb-1.5">12<span className="text-slate-400 text-[11px] font-medium ml-1">/20</span></span>
                             <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-[#a81616]" style={{width: '60%'}}></div>
                             </div>
                           </div>
                         </td>
                         <td className="px-4 py-4 text-center">
                           <div className="flex flex-col items-center">
                             <span className="text-[13px] font-bold text-[#0f172a] mb-1.5">8<span className="text-slate-400 text-[11px] font-medium ml-1">/10</span></span>
                             <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500" style={{width: '80%'}}></div>
                             </div>
                           </div>
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white h-[320px] flex flex-col">
              <CardHeader className="p-6 border-b border-slate-100 shrink-0">
                <CardTitle className="text-[15px] font-bold text-slate-800">Policy Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col justify-center gap-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-500">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Annual Leave</p>
                      <p className="text-[18px] font-extrabold text-[#0f172a] leading-tight">18 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-500">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sick Leave</p>
                      <p className="text-[18px] font-extrabold text-[#0f172a] leading-tight">10 days</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-500">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Carryover Max</p>
                      <p className="text-[18px] font-extrabold text-[#0f172a] leading-tight">5 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-500">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approval Level</p>
                      <p className="text-[18px] font-extrabold text-[#0f172a] leading-tight">2</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto text-center">
                  <Button variant="link" className="text-[#a81616] font-bold text-[13px] hover:text-[#8b1111]">View all policies &gt;</Button>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>

        {/* Right Column (Col span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Approval Queue */}
          <Card className="border-none shadow-sm rounded-2xl bg-white h-[450px] flex flex-col">
            <CardHeader className="p-6 border-b border-slate-100 flex flex-row justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-[15px] font-bold text-slate-800">Approval Queue</CardTitle>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">4</span>
              </div>
              <Button variant="link" className="text-[#a81616] font-bold text-[13px] p-0 h-auto hover:text-[#8b1111]">View all</Button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="divide-y divide-slate-100">
                {mockApprovals.map(req => (
                  <div key={req.id} className="p-5 hover:bg-slate-50/50 transition-colors flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-500 overflow-hidden shrink-0">
                      {req.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[14px] font-bold text-slate-800">{req.name}</p>
                          <span className={`inline-block mt-1 text-[10px] font-bold ${req.color} bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider`}>{req.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <Button size="icon" variant="outline" className="w-8 h-8 rounded-lg text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100" title="Approve">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="w-8 h-8 rounded-lg text-red-600 border-red-200 bg-red-50 hover:bg-red-100" title="Reject">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-[12.5px] font-bold text-slate-600 mt-2.5">{req.dates}</p>
                      <p className="text-[12.5px] text-slate-500 mt-0.5 font-medium">{req.reason}</p>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center justify-between">
                         Requested 2h ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 text-center bg-white mt-auto">
                <Button variant="link" className="text-[#a81616] font-bold text-[13px] p-0 h-auto hover:text-[#8b1111]">View all requests &gt;</Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Absences */}
          <Card className="border-none shadow-sm rounded-2xl bg-white h-[320px] flex flex-col">
            <CardHeader className="p-6 border-b border-slate-100 shrink-0">
              <CardTitle className="text-[15px] font-bold text-slate-800">Upcoming Absences</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="p-5 space-y-5">
                {mockUpcoming.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl border border-slate-100 bg-slate-50 flex flex-col items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-slate-500">{item.dates}, 2026</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                            {item.name.substring(0, 2).toUpperCase()}
                          </div>
                          <p className="text-[13.5px] font-bold text-slate-800 truncate">{item.name}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-slate-100 ${item.color} uppercase tracking-wider whitespace-nowrap`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 text-center bg-white mt-auto">
                <Button variant="link" className="text-[#a81616] font-bold text-[13px] p-0 h-auto hover:text-[#8b1111]">View full calendar &gt;</Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
