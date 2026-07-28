'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingAnimation } from '@/components/ui/TableLoadingState';
import { CameraCapture } from '@/components/admin/CameraCapture';
import { IdCardPreview } from '@/components/ui/id-card';
import { 
  Search, 
  Camera,
  Upload,
  User,
  Filter,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';
import api from '@/lib/axios';

export default function PhotoBoothPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New state for master-detail view
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMissingPhotos();
  }, []);

  const fetchMissingPhotos = () => {
    setIsLoading(true);
    api.get('/api/photobooth/missing-photos')
      .then(res => {
        setRecords(res.data);
        setIsLoading(false);
        // Deselect if the selected user is no longer in the list (e.g. after save)
        if (selectedUser) {
          const stillExists = res.data.find((r: any) => r.id === selectedUser.id);
          if (!stillExists) {
            setSelectedUser(null);
            setPreviewPhoto(null);
          }
        }
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || record.role.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [records, searchTerm, roleFilter]);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setPreviewPhoto(null); // Reset preview when switching users
  };

  const handleCapture = (base64: string) => {
    setPreviewPhoto(base64);
  };

  const handleSavePhoto = async () => {
    if (!selectedUser || !previewPhoto) return;
    
    setIsSaving(true);
    try {
      await api.post('/api/photobooth/upload-photo', {
        user_id: selectedUser.id,
        photo_base64: previewPhoto
      });
      
      // Trigger toast
      localStorage.setItem('toast_message', 'Photo uploaded and saved successfully');
      // Dispatch a storage event manually in case it doesn't trigger in same window
      window.dispatchEvent(new Event('storage'));
      
      // Refresh list
      fetchMissingPhotos();
      
      setSelectedUser(null);
      setPreviewPhoto(null);
    } catch (err) {
      console.error('Failed to save photo:', err);
      localStorage.setItem('toast_message', 'Failed to save photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-[1400px] mx-auto w-full h-[calc(100vh-120px)] flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 mt-2 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Photo Booth</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Capture or upload ID photos for students and teachers missing them.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by name..." 
                className="pl-10 pr-4 py-2.5 w-full sm:w-[250px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-300 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                className="pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-300 appearance-none cursor-pointer shadow-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          
          {/* Left Column: List */}
          <div className="w-full lg:w-[380px] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden shrink-0">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Missing Photos <span className="text-maroon-600 dark:text-maroon-400 bg-maroon-50 dark:bg-maroon-900/30 px-2 py-0.5 rounded-full text-xs ml-2">{filteredRecords.length}</span></h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoading ? (
                <div className="py-12">
                  <LoadingAnimation message="Loading list..." />
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
                  <p className="text-slate-500 text-sm mt-1">Everyone currently has an ID photo uploaded.</p>
                </div>
              ) : (
                filteredRecords.map((person) => (
                  <button 
                    key={person.id} 
                    onClick={() => handleSelectUser(person)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                      selectedUser?.id === person.id 
                        ? 'border-maroon-500 bg-maroon-50 dark:bg-maroon-900/20 shadow-sm ring-1 ring-maroon-500/20' 
                        : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      selectedUser?.id === person.id ? 'bg-maroon-100 dark:bg-maroon-800 text-maroon-600 dark:text-maroon-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold truncate leading-tight mb-1 ${
                        selectedUser?.id === person.id ? 'text-maroon-900 dark:text-maroon-400' : 'text-slate-900 dark:text-slate-200'
                      }`}>{person.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{person.details}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                      person.role === 'Teacher' 
                        ? (selectedUser?.id === person.id ? 'bg-maroon-200/50 text-maroon-700' : 'bg-blue-50 text-blue-700') 
                        : (selectedUser?.id === person.id ? 'bg-maroon-200/50 text-maroon-700' : 'bg-emerald-50 text-emerald-700')
                    }`}>
                      {person.role}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Capture & Preview */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-slate-800/30">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Camera className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Select a person</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">Choose someone from the list on the left to capture or upload their ID photo.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col md:flex-row h-full overflow-y-auto">
                {/* Camera/Action Area */}
                <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-6 w-full text-center">
                    {previewPhoto ? 'Review Photo' : 'Capture Photo'} for {selectedUser.name.split(' ')[0]}
                  </h3>
                  
                  {!previewPhoto ? (
                    <CameraCapture onCapture={handleCapture} />
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                      <div className="relative w-64 h-64 rounded-3xl overflow-hidden border-4 border-white shadow-xl mb-8 group">
                        <img src={previewPhoto} alt="Captured preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <Button onClick={() => setPreviewPhoto(null)} variant="ghost" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Retake Photo
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 w-full max-w-[320px]">
                        <Button 
                          onClick={() => setPreviewPhoto(null)} 
                          variant="outline" 
                          className="flex-1 h-12 rounded-xl text-slate-600 font-semibold"
                          disabled={isSaving}
                        >
                          Retake
                        </Button>
                        <Button 
                          onClick={handleSavePhoto} 
                          className="flex-[2] h-12 bg-maroon-600 hover:bg-maroon-700 text-white rounded-xl shadow-md font-bold text-[15px]"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Save & Apply
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* ID Preview Area */}
                <div className="w-full md:w-[380px] p-4 md:p-6 flex flex-col items-center justify-center bg-slate-100/30 dark:bg-slate-950/30">
                  <div className="w-full max-w-[280px] flex flex-col items-center">
                    <div className="mb-4 flex items-center justify-between w-full">
                      <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm tracking-wide uppercase">ID Card Preview</h3>
                      {previewPhoto && <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">With New Photo</span>}
                    </div>
                    
                    <div className="relative w-[260px] h-[414px] flex justify-center" style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-60px' }}>
                      <IdCardPreview 
                        user={selectedUser} 
                        type={selectedUser.role.toLowerCase() as 'student'|'teacher'} 
                        photoPreview={previewPhoto}
                        activeSide="front"
                      />
                    </div>
                    
                    {!previewPhoto && (
                      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 bg-slate-100 dark:bg-slate-800 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        Take a photo to see it previewed here.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
}
