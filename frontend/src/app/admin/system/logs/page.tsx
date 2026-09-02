'use client';
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  ShieldAlert,
  User as UserIcon,
  X
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { TableLoadingState } from '@/components/ui/TableLoadingState';

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details: string | null;
  ip_address: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    photo_url: string | null;
    is_blocked?: boolean;
  };
}

export default function UserLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const itemsPerPage = 15;

  const fetchLogs = React.useCallback(async () => {
    try {
      const res = await api.get('/api/system/logs?per_page=1000');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setLogs(data);
    } catch (err) {
      console.error('Network error fetching logs', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      // eslint-disable-next-line
      fetchLogs();
    }
    return () => { isMounted = false; };
  }, [fetchLogs]);

  const handleBlockUser = async (userId: number, currentName: string) => {
    if (confirm(`Are you sure you want to toggle the block status for ${currentName}? They will be immediately kicked out if blocked.`)) {
      try {
        await api.post(`/api/system/users/${userId}/block`);
        fetchLogs();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        alert(error.response?.data?.message || 'Error updating user block status');
      }
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = 
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.includes(searchTerm);
      return matchesSearch;
    });
  }, [logs, searchTerm]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  return (
    <>
      <div className="max-w-[1400px] mx-auto w-full bg-[#f8f9fa] min-h-screen p-6 sm:p-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Logs</h2>
            <p className="text-slate-500 text-[15px] mt-1 font-medium">Monitor all user activities and block suspicious users.</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 relative z-10">
          <div className="relative w-full sm:w-[350px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search user, action, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 w-full bg-[#f8f9fa] border-none text-[13px] font-medium placeholder:text-slate-400 rounded-none focus:ring-2 focus:ring-[#0B3A82]/20 transition-all"
            />
          </div>
        </div>

        {/* Main Table Area */}
        <div className="bg-white rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative z-0">
          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-[#fafafa]">
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-14 px-6">User</TableHead>
                  <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-14">Action</TableHead>
                  <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-14">IP Address</TableHead>
                  <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-14">Time</TableHead>
                  <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-14 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingState colSpan={5} />
                ) : paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Search className="w-8 h-8 mb-3 opacity-20" />
                        <p className="text-[14px] font-bold">No logs found</p>
                        <p className="text-[13px] font-medium mt-1">Try adjusting your search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {log.user ? (
                            <>
                              <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                                {log.user?.photo_url ? (
                                  <img src={getImageUrl(log.user.photo_url)} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://i.pravatar.cc/150')} />
                                ) : (
                                  <UserIcon className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-extrabold text-[14px] text-slate-900 leading-none mb-1">{log.user.name}</div>
                                <div className="text-[12px] font-medium text-slate-500">{log.user.email}</div>
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">System / Deleted User</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-bold text-[13px] text-slate-800 max-w-[300px] truncate">{log.action}</div>
                      </TableCell>

                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-bold">
                          {log.ip_address || 'Unknown'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-[13px] text-slate-700">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right pr-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 rounded-none border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            <span className="text-[11px] font-bold">View</span>
                          </Button>
                          
                          {log.user && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-3 rounded-none border-red-200 bg-red-50 hover:bg-red-100 text-red-600 shadow-sm"
                              onClick={() => handleBlockUser(log.user.id, log.user.name)}
                            >
                              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                              <span className="text-[11px] font-bold">Block / Unblock</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-[#fafafa]/50">
            <div className="text-[13px] font-bold text-slate-500">
              Showing {filteredLogs.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
            </div>
            
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-none p-1 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || filteredLogs.length === 0}
                className="h-8 w-8 p-0 rounded-none text-slate-500 hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center px-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 p-0 rounded-none text-[13px] font-bold ${
                        currentPage === pageNum 
                          ? 'bg-[#0B3A82] hover:bg-[#092558] text-white shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || filteredLogs.length === 0}
                className="h-8 w-8 p-0 rounded-none text-slate-500 hover:text-slate-900"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="bg-white rounded-none p-6 md:p-8 w-full max-w-lg relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedLog(null)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-6">Log Details</h3>

            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-none border border-slate-100">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                  {selectedLog.user?.photo_url ? (
                    <img src={getImageUrl(selectedLog.user.photo_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="font-black text-[15px] text-slate-900 leading-none mb-1">{selectedLog.user?.name || 'Unknown User'}</div>
                  <div className="text-[13px] font-bold text-slate-500">{selectedLog.user?.email || 'N/A'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-none border border-slate-100 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">IP Address</div>
                  <div className="font-bold text-[14px] text-slate-900">{selectedLog.ip_address || 'N/A'}</div>
                </div>
                <div className="p-4 bg-white rounded-none border border-slate-100 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timestamp</div>
                  <div className="font-bold text-[14px] text-slate-900">{new Date(selectedLog.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div className="p-5 bg-[#fafafa] rounded-none border border-slate-100 shadow-inner">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Action Description</div>
                <div className="font-bold text-[14px] text-slate-800 leading-relaxed">
                  {selectedLog.action}
                </div>
                {selectedLog.details && (
                  <div className="mt-3 pt-3 border-t border-slate-200/50 text-[13px] text-slate-600 font-medium font-mono whitespace-pre-wrap break-words">
                    {selectedLog.details}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={() => setSelectedLog(null)} className="h-11 px-8 rounded-none font-bold bg-slate-900 text-white hover:bg-slate-800">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
