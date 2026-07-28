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
  ShieldAlert,
  Trash2,
  User as UserIcon,
  X,
  UserPlus
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { TableLoadingState } from '@/components/ui/TableLoadingState';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  photo_url: string | null;
  id_number: string | null;
  is_blocked: boolean;
  roles: { id: number; name: string }[];
  created_at: string;
}

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'student', id_number: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 10;

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await api.get('/api/system/users?per_page=1000');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setUsers(data);
    } catch (err) {
      console.error('Network error fetching users', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      // eslint-disable-next-line
      fetchUsers();
    }
    return () => { isMounted = false; };
  }, [fetchUsers]);

  const handleBlockUser = async (userId: number, currentName: string, isBlocked: boolean) => {
    if (confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${currentName}?`)) {
      try {
        await api.post(`/api/system/users/${userId}/block`);
        fetchUsers();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        alert(error.response?.data?.message || 'Error updating user block status');
      }
    }
  };

  const handleTerminateUser = async (userId: number, currentName: string) => {
    if (confirm(`CRITICAL WARNING: Are you sure you want to completely delete ${currentName}'s account? This cannot be undone.`)) {
      try {
        await api.delete(`/api/system/users/${userId}`);
        fetchUsers();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        alert(error.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/system/users', newUserData);
      setIsAddModalOpen(false);
      setNewUserData({ name: '', email: '', password: '', role: 'student', id_number: '' });
      fetchUsers();
      alert('User created successfully!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Error creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.roles?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  return (
    <>
      <div className="max-w-[1400px] mx-auto w-full bg-[#f8f9fa] min-h-screen p-6 sm:p-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h2>
            <p className="text-slate-500 text-[15px] mt-1 font-medium">Manage all accounts, assign roles, and control access.</p>
          </div>
          
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7a1315] hover:bg-[#5a0e0f] text-white transition-colors shadow-[0_4px_14px_rgba(122,19,21,0.3)] text-[14px] font-bold rounded-xl mt-4 sm:mt-0 h-auto"
          >
            <UserPlus className="w-4 h-4" strokeWidth={3} />
            Add New User
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 relative z-10">
          <div className="relative w-full sm:w-[350px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 w-full bg-[#f8f9fa] border-none text-[13px] font-medium placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-[#7a1315]/20 transition-all"
            />
          </div>
        </div>

        {/* Main Table Area */}
        <div className="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative z-0">
          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-[#fafafa]">
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-14 px-6">User</TableHead>
                  <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-14">Role</TableHead>
                  <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-14">ID Number</TableHead>
                  <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-14">Status</TableHead>
                  <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-14 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableLoadingState colSpan={5} />
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Search className="w-8 h-8 mb-3 opacity-20" />
                        <p className="text-[14px] font-bold">No users found</p>
                        <p className="text-[13px] font-medium mt-1">Try adjusting your search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                            {user.photo_url ? (
                              <img src={getImageUrl(user.photo_url)} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://i.pravatar.cc/150')} />
                            ) : (
                              <UserIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-[14px] text-slate-900 leading-none mb-1">{user.name}</div>
                            <div className="text-[12px] font-medium text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-bold text-[13px] text-slate-800 capitalize">
                          {user.roles?.[0]?.name?.replace('-', ' ') || 'User'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-[13px] text-slate-600">
                          {user.id_number || 'N/A'}
                        </div>
                      </TableCell>

                      <TableCell>
                        {user.is_blocked ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            BLOCKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            ACTIVE
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right pr-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`h-8 px-3 rounded-lg shadow-sm ${user.is_blocked ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-600' : 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-600'}`}
                            onClick={() => handleBlockUser(user.id, user.name, user.is_blocked)}
                          >
                            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                            <span className="text-[11px] font-bold">{user.is_blocked ? 'Unblock' : 'Block'}</span>
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 rounded-lg border-red-200 bg-red-50 hover:bg-red-100 text-red-600 shadow-sm"
                            onClick={() => handleTerminateUser(user.id, user.name)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            <span className="text-[11px] font-bold">Terminate</span>
                          </Button>
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
              Showing {filteredUsers.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
            </div>
            
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || filteredUsers.length === 0}
                className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900"
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
                      className={`h-8 w-8 p-0 rounded-lg text-[13px] font-bold ${
                        currentPage === pageNum 
                          ? 'bg-[#7a1315] hover:bg-[#5a0e0f] text-white shadow-sm' 
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
                disabled={currentPage === totalPages || filteredUsers.length === 0}
                className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-6">Add New User</h3>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1315]/20 focus:border-[#7a1315]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1315]/20 focus:border-[#7a1315]"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  minLength={8}
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1315]/20 focus:border-[#7a1315]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
                  <select 
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1315]/20 focus:border-[#7a1315]"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="principal">Principal</option>
                    <option value="guard">Guard</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">ID Number (Optional)</label>
                  <input 
                    type="text" 
                    value={newUserData.id_number}
                    onChange={(e) => setNewUserData({...newUserData, id_number: e.target.value})}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7a1315]/20 focus:border-[#7a1315]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="h-11 px-6 rounded-xl font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="h-11 px-8 rounded-xl font-bold bg-[#7a1315] hover:bg-[#5a0e0f] text-white">
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
