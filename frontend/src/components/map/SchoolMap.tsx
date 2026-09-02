'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, RefreshCw, Trash2, Maximize2, X, MapPin, Map, Users, Building2, Search, Crosshair, Diamond, Plus, Eye, Edit2, Layers, Map as MapIcon, Minus, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import api from '@/lib/axios';

interface StudentLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  last_update: string;
  grade: string;
  section: string;
  photo_url: string;
}

interface School {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  student_count: number;
  status: string;
  geofence_area: number;
  boundary: { lat: number; lng: number }[] | null;
  created_at?: string;
  updated_at?: string;
}

interface MapStats {
  total_schools: number;
  active_geofences: number;
  total_students: number;
  total_area: number;
}

function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng); },
  });
  return null;
}

function MapReadyHandler({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { onMapReady(map); }, [map, onMapReady]);
  return null;
}

function isPointInPolygon(point: {lat: number, lng: number}, polygon: {lat: number, lng: number}[]) {
  if (!polygon || polygon.length === 0) return true; // Default inside if no geofence
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = ((yi > point.lng) !== (yj > point.lng))
        && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
}

export default function SchoolMap({ mode = 'admin' }: { mode?: 'admin' | 'principal' }) {
  const [geofence, setGeofence] = useState<{lat: number, lng: number}[]>([]);
  const [students, setStudents] = useState<StudentLocation[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<MapStats | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
  const [layers, setLayers] = useState({ schools: true, geofences: true, roads: true, rivers: true, landmarks: true });
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Elementary', latitude: '', longitude: '', student_count: '0', status: 'Active', geofence_area: '' });
  const [editingSchoolId, setEditingSchoolId] = useState<number | null>(null);

  const zoomRef = useRef<L.Map | null>(null);

  const fetchMapData = useCallback(async () => {
    try {
      const [geoRes, studentRes, schoolsRes, statsRes] = await Promise.all([
        api.get('/api/admin/map/geofence'),
        api.get('/api/admin/map/student-locations'),
        api.get('/api/admin/map/schools'),
        api.get('/api/admin/map/stats'),
      ]);
      if (geoRes.data.geofence) setGeofence(geoRes.data.geofence);
      setStudents(studentRes.data.data || []);
      setSchools(schoolsRes.data.data || []);
      setStats(statsRes.data.data || null);
      if (schoolsRes.data.data?.length > 0) setSelectedSchoolId(schoolsRes.data.data[0].id);
    } catch {
      // Silently handle — backend may be offline. Data will show empty state.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchMapData();
    const interval = setInterval(() => {
      api.get('/api/admin/map/student-locations')
        .then(res => setStudents(res.data.data || []))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchMapData]);

  const handleMapClick = (latlng: L.LatLng) => {
    if (isDrawing) {
      setGeofence(prev => [...prev, { lat: latlng.lat, lng: latlng.lng }]);
    }
  };

  const saveGeofence = async () => {
    try {
      await api.post('/api/admin/map/geofence', { coordinates: geofence });
      localStorage.setItem('toast_message', 'Campus geofence saved successfully');
      window.dispatchEvent(new Event('toast-trigger'));
      setIsDrawing(false);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      const msg = err?.response?.data?.message || err?.message || 'Failed to save geofence';
      console.error('Geofence save error:', err?.response?.data || err);
      localStorage.setItem('toast_message', msg);
      window.dispatchEvent(new Event('toast-trigger'));
    }
  };

  const clearGeofence = async () => {
    if (confirm('Are you sure you want to clear the campus boundary?')) {
      try {
        await api.delete('/api/admin/map/geofence');
        setGeofence([]);
        localStorage.setItem('toast_message', 'Campus boundary cleared successfully');
        window.dispatchEvent(new Event('toast-trigger'));
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;
        console.error('Failed to clear geofence:', err?.response?.data || err);
        localStorage.setItem('toast_message', 'Failed to clear geofence');
        window.dispatchEvent(new Event('toast-trigger'));
      }
    }
  };

  const flyToSchool = (school: School) => {
    setSelectedSchoolId(school.id);
    if (zoomRef.current) {
      zoomRef.current.flyTo([school.latitude, school.longitude], 17);
    }
  };

  const locateUser = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (zoomRef.current) {
            zoomRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 17);
          }
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const addSchool = async () => {
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        student_count: parseInt(formData.student_count) || 0,
        status: formData.status,
        geofence_area: formData.geofence_area ? parseFloat(formData.geofence_area) : null,
      };
      if (editingSchoolId) {
        await api.put(`/api/admin/map/schools/${editingSchoolId}`, payload);
        localStorage.setItem('toast_message', 'School updated successfully');
      } else {
        await api.post('/api/admin/map/schools', payload);
        localStorage.setItem('toast_message', 'School added successfully');
      }
      window.dispatchEvent(new Event('toast-trigger'));
      setAddDialogOpen(false);
      setEditingSchoolId(null);
      setFormData({ name: '', type: 'Elementary', latitude: '', longitude: '', student_count: '0', status: 'Active', geofence_area: '' });
      fetchMapData();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      const msg = err?.response?.data?.message || 'Failed to save school';
      localStorage.setItem('toast_message', msg);
      window.dispatchEvent(new Event('toast-trigger'));
    }
  };

  const deleteSchool = async (id: number) => {
    if (confirm('Delete this school?')) {
      try {
        await api.delete(`/api/admin/map/schools/${id}`);
        localStorage.setItem('toast_message', 'School deleted');
        window.dispatchEvent(new Event('toast-trigger'));
        fetchMapData();
      } catch {
        localStorage.setItem('toast_message', 'Failed to delete school');
        window.dispatchEvent(new Event('toast-trigger'));
      }
    }
  };

  const openEditSchool = (school: School) => {
    setEditingSchoolId(school.id);
    setFormData({
      name: school.name,
      type: school.type,
      latitude: school.latitude?.toString() || '',
      longitude: school.longitude?.toString() || '',
      student_count: school.student_count?.toString() || '0',
      status: school.status,
      geofence_area: school.geofence_area?.toString() || '',
    });
    setAddDialogOpen(true);
  };

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);
  const filteredSchools = schools.filter(s =>
    s.name.toLowerCase().includes(schoolSearchTerm.toLowerCase())
  );

  const handleMapReady = useCallback((map: L.Map) => { zoomRef.current = map; }, []);

  if (isLoading) {
    return <div className="h-full w-full flex items-center justify-center">Loading Map...</div>;
  }

  const defaultCenter: L.LatLngExpression = [8.0468, 126.0617];
  const center = selectedSchool
    ? [selectedSchool.latitude, selectedSchool.longitude]
    : geofence.length > 0
      ? [geofence[0].lat, geofence[0].lng]
      : defaultCenter;

  const mapElement = (
    <>
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] bg-blue-600 text-white px-4 py-2 rounded-none text-sm font-bold shadow-lg animate-pulse">
          Click on the map to add boundary points
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] w-64 bg-white rounded-none shadow-sm border border-slate-200 flex items-center px-3.5 py-2.5">
        <Search className="w-[18px] h-[18px] text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Search location..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-[13px] w-full text-slate-700 placeholder:text-slate-400 font-medium"
        />
      </div>

      <div className="absolute top-20 left-4 z-[1000] flex flex-col bg-white rounded-none shadow-sm border border-slate-200 overflow-hidden">
        <button onClick={() => zoomRef.current?.zoomIn()} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 border-b border-slate-100 text-slate-600"><Plus className="w-[18px] h-[18px]" /></button>
        <button onClick={() => zoomRef.current?.zoomOut()} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 border-b border-slate-100 text-slate-600"><Minus className="w-[18px] h-[18px]" /></button>
        <button onClick={locateUser} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 border-b border-slate-100 text-slate-600"><Crosshair className="w-[18px] h-[18px]" /></button>
        <button onClick={clearGeofence} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-600"><Trash2 className="w-[18px] h-[18px]" /></button>
      </div>

      {!isFullscreen && (
        <div className="absolute top-4 right-4 z-[1000] w-56 flex flex-col gap-3">
          <div className="bg-white rounded-none shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-800 text-[12px] mb-3">Map Style</h3>
            <div className="flex gap-1.5">
              <button
                onClick={() => setMapType('street')}
                className={`flex-1 py-2 rounded-none text-[11px] font-bold transition-all ${mapType === 'street' ? 'bg-[#0B3A82] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >Street</button>
              <button
                onClick={() => setMapType('satellite')}
                className={`flex-1 py-2 rounded-none text-[11px] font-bold transition-all ${mapType === 'satellite' ? 'bg-[#0B3A82] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >Satellite</button>
            </div>
          </div>

          <div className="bg-white rounded-none shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-800 text-[12px] mb-3">Map Layers</h3>
            <div className="flex flex-col gap-2.5">
              {(['schools', 'geofences', 'roads', 'rivers', 'landmarks'] as const).map((key) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group" onClick={() => setLayers(prev => ({ ...prev, [key]: !prev[key] }))}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${layers[key] ? 'border-[#0B3A82] bg-[#0B3A82]' : 'border-slate-300 bg-white'}`}>
                    {layers[key] && <CheckSquare className="w-3 h-3 text-white" />}
                  </div>
                  {key === 'schools' && <Building2 className="w-[14px] h-[14px] text-slate-400" />}
                  {key === 'geofences' && <Diamond className="w-[14px] h-[14px] text-slate-400" />}
                  {key === 'roads' && <MapIcon className="w-[14px] h-[14px] text-slate-400" />}
                  {key === 'rivers' && <Layers className="w-[14px] h-[14px] text-slate-400" />}
                  {key === 'landmarks' && <MapPin className="w-[14px] h-[14px] text-slate-400" />}
                  <span className="text-[12px] font-medium text-slate-600 group-hover:text-slate-900 capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-none shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-800 text-[12px] mb-3">Legend</h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <MapPin className="w-[14px] h-[14px] text-red-500 shrink-0 fill-red-500" />
                <span className="text-[12px] font-medium text-slate-600">Selected School</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 border-[1.5px] border-dashed border-emerald-500 shrink-0" />
                <span className="text-[12px] font-medium text-slate-600">Active Geofence</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-[14px] h-[14px] text-blue-500 shrink-0 fill-blue-500" />
                <span className="text-[12px] font-medium text-slate-600">Other School</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-[14px] h-[14px] text-slate-400 shrink-0 fill-slate-400" />
                <span className="text-[12px] font-medium text-slate-600">Landmarks</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-none border border-slate-200 shadow-sm flex items-end gap-1 border-b-2 border-l-2 border-b-slate-800 border-l-slate-800 h-6">
          <span className="text-[10px] font-bold text-slate-800 leading-none mb-0.5 ml-1">100 m</span>
        </div>
      </div>

      <div 
        className="h-full w-full relative" 
        style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
      >
        <MapContainer
          key={isFullscreen ? 'fullscreen' : 'normal'}
          center={center as L.LatLngExpression}
          zoom={17}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
        {mapType === 'street' ? (
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution="Google Maps"
          />
        ) : (
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            attribution="Google Maps"
          />
        )}

        <MapEvents onMapClick={handleMapClick} />
        <MapReadyHandler onMapReady={handleMapReady} />

        {layers.schools && schools.map(school => (
          <Marker
            key={school.id}
            position={[school.latitude, school.longitude]}
            icon={L.divIcon({
              className: '',
              html: `<div style="background:${school.id === selectedSchoolId ? '#ef4444' : '#3b82f6'};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 28],
            })}
          >
            <Popup>
              <div className="flex flex-col gap-1 min-w-[180px] p-1">
                <p className="font-bold text-sm text-slate-900">{school.name}</p>
                <p className="text-xs text-slate-500">{school.type} · {school.student_count} students</p>
                <button onClick={() => flyToSchool(school)} className="text-xs text-blue-600 font-medium mt-1 hover:underline">Focus on map</button>
              </div>
            </Popup>
          </Marker>
        ))}

        {layers.geofences && geofence.length > 0 && (
          <Polygon
            positions={geofence.map(p => [p.lat, p.lng])}
            pathOptions={{ color: 'red', fill: false, weight: 3 }}
          />
        )}

        {layers.geofences && selectedSchool?.boundary && selectedSchool.boundary.length > 0 && (
          <Polygon
            positions={selectedSchool.boundary.map(p => [p.lat, p.lng])}
            pathOptions={{ color: '#ef4444', fill: true, fillColor: '#fca5a5', fillOpacity: 0.2, weight: 2 }}
          />
        )}

        {mode === 'principal' && students.map(student => (
          <Marker key={student.id} position={[student.latitude, student.longitude]}>
            <Popup>
              <div className="flex flex-col gap-2 p-1 min-w-[150px]">
                {student.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={student.photo_url} alt={student.name} className="w-12 h-12 rounded-none mx-auto" />
                )}
                <div className="text-center">
                  <p className="font-bold text-sm m-0">{student.name}</p>
                  <p className="text-xs text-slate-500 m-0">{student.grade} - {student.section}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        </MapContainer>
      </div>
    </>
  );

  if (isFullscreen) {
    const studentsOutside = mode === 'principal' 
      ? students.filter(student => !isPointInPolygon({ lat: student.latitude, lng: student.longitude }, geofence))
      : [];

    const content = (
      <div className="fixed inset-0 z-[99999] bg-slate-50 flex flex-row">
        <div className="flex-1 relative z-0">{mapElement}</div>
        <div className="w-80 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-[101]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-rose-50 text-[#0B3A82] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Map Toolkit</h2>
            </div>
            <button onClick={() => { setIsFullscreen(false); setIsDrawing(false); }} className="w-8 h-8 rounded-none hover:bg-slate-100 flex items-center justify-center transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto">
            {mode === 'principal' ? (
              <div className="flex flex-col gap-4">
                <div className="bg-red-50 border border-red-100 rounded-none p-4 mb-2">
                  <p className="text-[13px] font-bold text-red-700">Outside Perimeter Alert</p>
                  <p className="text-[11px] text-red-600 mt-1">Students listed below are currently detected outside the active geofence boundary.</p>
                </div>
                {studentsOutside.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <CheckSquare className="w-8 h-8 mb-3 text-emerald-400" />
                    <p className="text-[13px] font-medium">All students are on campus</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {studentsOutside.map(student => (
                      <div key={student.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-none shadow-sm">
                        {student.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={student.photo_url} alt={student.name} className="w-10 h-10 rounded-none shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-slate-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-800 truncate">{student.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{student.grade} - {student.section}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="text-[13px] text-slate-500 mb-2">Use the tools below to monitor students or edit the campus geofence boundary.</p>
                {isDrawing ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-none mb-2">
                      <p className="text-sm text-blue-700 font-medium">Drawing Mode Active</p>
                      <p className="text-xs text-blue-600/80 mt-1">Click the map to place boundary points.</p>
                    </div>
                    <Button onClick={saveGeofence} className="w-full bg-green-600 hover:bg-green-700 text-white h-11 rounded-none"><Save className="w-4 h-4 mr-2" /> Save Boundary</Button>
                    <Button variant="outline" onClick={clearGeofence} className="w-full text-red-600 h-11 rounded-none border-red-200 hover:bg-red-50"><Trash2 className="w-4 h-4 mr-2" /> Clear Points</Button>
                    <Button variant="secondary" onClick={() => setIsDrawing(false)} className="w-full h-11 rounded-none">Cancel</Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button onClick={() => setIsDrawing(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-none shadow-sm"><Edit2 className="w-4 h-4 mr-2" /> Add Border Line</Button>
                    <Button variant="outline" onClick={() => fetchMapData()} className="w-full h-11 rounded-none text-slate-600"><RefreshCw className="w-4 h-4 mr-2" /> Refresh Data</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
    
    return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
  }

  return (
    <div className="relative h-full w-full flex flex-col gap-6">

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-none shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-none bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
            <Map className="w-6 h-6 text-[#0B3A82]" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">School Map</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Monitor student locations and set the geofence perimeter.</p>
          </div>
        </div>
        <Button onClick={() => setIsFullscreen(true)} className="bg-[#0B3A82] hover:bg-rose-900 text-white rounded-none h-[42px] px-5 font-bold shadow-sm">
          <Maximize2 className="w-[15px] h-[15px] mr-2" /> Fullscreen Mode
        </Button>
      </div>

      {mode === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-none border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-none bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><Building2 className="w-6 h-6" /></div>
          <div>
            <h3 className="text-[22px] font-black text-slate-900 leading-none mb-1.5">{stats?.total_schools ?? 0}</h3>
            <p className="text-[12px] font-bold text-slate-700 leading-tight">Total Schools</p>
            <p className="text-[11px] text-slate-400">Active campuses</p>
          </div>
        </div>
        <div className="bg-white rounded-none border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-none bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><MapPin className="w-6 h-6 fill-emerald-500" /></div>
          <div>
            <h3 className="text-[22px] font-black text-slate-900 leading-none mb-1.5">{stats?.active_geofences ?? 0}</h3>
            <p className="text-[12px] font-bold text-slate-700 leading-tight">Active Geofences</p>
            <p className="text-[11px] text-slate-400">Currently monitoring</p>
          </div>
        </div>
        <div className="bg-white rounded-none border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-none bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><Users className="w-6 h-6" /></div>
          <div>
            <h3 className="text-[22px] font-black text-slate-900 leading-none mb-1.5">{(stats?.total_students ?? 0).toLocaleString()}</h3>
            <p className="text-[12px] font-bold text-slate-700 leading-tight">Students Located</p>
            <p className="text-[11px] text-slate-400">Within campus</p>
          </div>
        </div>
        <div className="bg-white rounded-none border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-none bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><Map className="w-6 h-6" /></div>
          <div>
            <h3 className="text-[22px] font-black text-slate-900 leading-none mb-1.5">{stats?.total_area ?? 0} km²</h3>
            <p className="text-[12px] font-bold text-slate-700 leading-tight">Campus Area</p>
            <p className="text-[11px] text-slate-400">Total coverage</p>
          </div>
        </div>
        </div>
      )}

      {/* Map Section */}
      <div className={`w-full ${mode === 'admin' ? 'min-h-[500px] h-[55vh]' : 'h-[calc(100vh-200px)] min-h-[600px]'} rounded-none overflow-hidden border border-slate-200 shadow-sm relative z-0`}>
        {mapElement}
      </div>

      {/* Schools Table Section (Hidden for Principals) */}
      {mode !== 'principal' && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-none overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-[15px] font-bold text-slate-900">Schools ({schools.length})</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search schools..."
                value={schoolSearchTerm}
                onChange={e => setSchoolSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-none text-[13px] text-slate-700 w-full sm:w-64 outline-none focus:border-slate-300 transition-colors placeholder:text-slate-400"
              />
            </div>
            <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) { setEditingSchoolId(null); setFormData({ name: '', type: 'Elementary', latitude: '', longitude: '', student_count: '0', status: 'Active', geofence_area: '' }); } }}>
              <DialogTrigger className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0B3A82] hover:bg-rose-900 text-white rounded-none text-[13px] font-bold transition-colors shadow-sm shrink-0">
                <Plus className="w-4 h-4" /> {editingSchoolId ? 'Edit School' : 'Add School'}
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] rounded-none p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{editingSchoolId ? 'Edit School' : 'Add School'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm font-semibold">School Name</Label>
                    <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Trento Central School" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Type</Label>
                      <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))} className="flex h-10 w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-sm mt-1">
                        <option>Elementary</option>
                        <option>Secondary</option>
                        <option>Tertiary</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Status</Label>
                      <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-sm mt-1">
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Latitude</Label>
                      <Input value={formData.latitude} onChange={e => setFormData(p => ({ ...p, latitude: e.target.value }))} placeholder="8.0461" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Longitude</Label>
                      <Input value={formData.longitude} onChange={e => setFormData(p => ({ ...p, longitude: e.target.value }))} placeholder="126.0617" className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Student Count</Label>
                      <Input value={formData.student_count} onChange={e => setFormData(p => ({ ...p, student_count: e.target.value }))} placeholder="0" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Area (km²)</Label>
                      <Input value={formData.geofence_area} onChange={e => setFormData(p => ({ ...p, geofence_area: e.target.value }))} placeholder="0.00" className="mt-1" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={addSchool} className="bg-[#0B3A82] hover:bg-rose-900 text-white">
                      {editingSchoolId ? 'Save Changes' : 'Add School'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">School Name</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Students</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Geofence Area</th>
                <th className="px-6 py-4 font-bold">Last Updated</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchools.map(school => (
                <tr key={school.id} className={`hover:bg-slate-50 transition-colors group cursor-pointer ${selectedSchoolId === school.id ? 'bg-rose-50/50' : ''}`} onClick={() => flyToSchool(school)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <MapPin className={`w-4 h-4 shrink-0 ${selectedSchoolId === school.id ? 'text-red-500 fill-red-500' : 'text-blue-500 fill-blue-500'}`} />
                      <span className="text-[13px] font-bold text-slate-800">{school.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-600 font-medium">{school.type}</td>
                  <td className="px-6 py-4 text-[13px] text-slate-600 font-medium">{school.student_count}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-none text-[11px] font-bold ${school.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{school.status}</span>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-600 font-medium">{school.geofence_area ? `${school.geofence_area} km²` : '—'}</td>
                  <td className="px-6 py-4 text-[13px] text-slate-600 font-medium">{new Date(school.updated_at || school.created_at || new Date().toISOString()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => flyToSchool(school)} className="w-7 h-7 flex items-center justify-center rounded-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEditSchool(school)} className="w-7 h-7 flex items-center justify-center rounded-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteSchool(school.id)} className="w-7 h-7 flex items-center justify-center rounded-none text-red-400 hover:text-red-600 hover:bg-red-50 border border-slate-200"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSchools.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">No schools found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}