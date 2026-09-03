'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Trash2, Maximize2, X, MapPin, Map, Users, Search, Crosshair, Diamond, Plus, Edit2, Layers, Map as MapIcon, Minus, CheckSquare, Bell, Smartphone, Mail, Clock3, ShieldAlert } from 'lucide-react';
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

// Permanent school perimeter supplied in DMS coordinates, converted to decimal degrees.
const SCHOOL_BOUNDARY = [
  { lat: 8.04355833, lng: 126.05994722 },
  { lat: 8.04406389, lng: 126.06130000 },
  { lat: 8.04565556, lng: 126.06057778 },
  { lat: 8.04552778, lng: 126.06028889 },
  { lat: 8.04519444, lng: 126.06035833 },
  { lat: 8.04492222, lng: 126.05943333 },
] as const;

const SCHOOL_BOUNDARY_POSITIONS: L.LatLngTuple[] = SCHOOL_BOUNDARY.map(
  point => [point.lat, point.lng]
);
const SCHOOL_BOUNDARY_BOUNDS = L.latLngBounds(SCHOOL_BOUNDARY_POSITIONS);
const SCHOOL_BOUNDARY_CENTER: L.LatLngExpression = [8.04482037, 126.06031759];

// Preview-only records for the planned parent notification workflow.
const MOCK_BOUNDARY_ALERTS = [
  {
    id: 1,
    name: 'Angela Reyes',
    className: 'Grade 6 - Rizal',
    detectedAt: '10:42 AM',
    distance: '42 m outside',
    schedule: '8:00 AM - 3:30 PM',
    latitude: 8.0442,
    longitude: 126.0615,
    notificationStatus: 'Parent notified',
    channels: ['App vibration', 'Push', 'Email'],
  },
  {
    id: 2,
    name: 'Mark Dela Cruz',
    className: 'Grade 5 - Mabini',
    detectedAt: '10:37 AM',
    distance: '28 m outside',
    schedule: '8:00 AM - 3:30 PM',
    latitude: 8.0458,
    longitude: 126.06045,
    notificationStatus: 'Alert queued',
    channels: ['App vibration', 'Push'],
  },
  {
    id: 3,
    name: 'Joshua Santos',
    className: 'Grade 4 - Bonifacio',
    detectedAt: '10:31 AM',
    distance: '61 m outside',
    schedule: '7:30 AM - 3:00 PM',
    latitude: 8.04335,
    longitude: 126.0597,
    notificationStatus: 'Parent notified',
    channels: ['App vibration', 'Push', 'Email'],
  },
] as const;

const MOCK_MONITORED_STUDENTS = 428;

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

function isPointInPolygon(point: {lat: number, lng: number}, polygon: readonly {lat: number, lng: number}[]) {
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [layers, setLayers] = useState({ students: true, geofences: true, roads: true, rivers: true, landmarks: true });
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  const zoomRef = useRef<L.Map | null>(null);

  const fetchMapData = useCallback(async () => {
    try {
      const [geoRes, studentRes] = await Promise.all([
        api.get('/api/admin/map/geofence'),
        api.get('/api/admin/map/student-locations'),
      ]);
      if (geoRes.data.geofence) setGeofence(geoRes.data.geofence);
      setStudents(studentRes.data.data || []);
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

  const handleMapReady = useCallback((map: L.Map) => {
    zoomRef.current = map;
    map.fitBounds(SCHOOL_BOUNDARY_BOUNDS, {
      padding: [40, 40],
      maxZoom: 18,
      animate: false,
    });
  }, []);

  if (isLoading) {
    return <div className="h-full w-full flex items-center justify-center">Loading Map...</div>;
  }

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
              {(['students', 'geofences', 'roads', 'rivers', 'landmarks'] as const).map((key) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group" onClick={() => setLayers(prev => ({ ...prev, [key]: !prev[key] }))}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${layers[key] ? 'border-[#0B3A82] bg-[#0B3A82]' : 'border-slate-300 bg-white'}`}>
                    {layers[key] && <CheckSquare className="w-3 h-3 text-white" />}
                  </div>
                  {key === 'students' && <Users className="w-[14px] h-[14px] text-slate-400" />}
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
                <span className="text-[12px] font-medium text-slate-600">Student Outside</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 border-[1.5px] border-dashed border-emerald-500 shrink-0" />
                <span className="text-[12px] font-medium text-slate-600">School Boundary</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-[14px] h-[14px] text-blue-500 shrink-0 fill-blue-500" />
                <span className="text-[12px] font-medium text-slate-600">Student Inside</span>
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
          center={SCHOOL_BOUNDARY_CENTER}
          zoom={17}
          zoomControl={false}
          maxBounds={SCHOOL_BOUNDARY_BOUNDS.pad(0.5)}
          maxBoundsViscosity={1}
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

        {layers.geofences && (
          <Polygon
            positions={SCHOOL_BOUNDARY_POSITIONS}
            pathOptions={{
              color: '#059669',
              fill: true,
              fillColor: '#34d399',
              fillOpacity: 0.16,
              weight: 3,
              dashArray: '8 6',
            }}
          >
            <Popup>
              <p className="m-0 text-sm font-bold text-slate-900">School boundary</p>
            </Popup>
          </Polygon>
        )}

        {layers.students && mode === 'admin' && MOCK_BOUNDARY_ALERTS.map(alert => (
          <Marker
            key={alert.id}
            position={[alert.latitude, alert.longitude]}
            icon={L.divIcon({
              className: '',
              html: '<div style="background:#dc2626;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,0.35);cursor:pointer;color:white;font-size:16px;font-weight:800;">!</div>',
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            })}
          >
            <Popup>
              <div className="flex min-w-[210px] flex-col gap-1 p-1">
                <p className="text-sm font-bold text-slate-900">{alert.name}</p>
                <p className="text-xs text-slate-500">{alert.className}</p>
                <p className="mt-1 text-xs font-semibold text-red-600">{alert.distance} · {alert.detectedAt}</p>
                <p className="text-xs font-medium text-emerald-700">{alert.notificationStatus}</p>
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

        {layers.students && mode === 'principal' && students.map(student => (
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
      ? students.filter(student => !isPointInPolygon({ lat: student.latitude, lng: student.longitude }, SCHOOL_BOUNDARY))
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
            <p className="text-[13px] text-slate-500 mt-0.5">Monitor the campus boundary and preview class-hour guardian alerts.</p>
          </div>
        </div>
        <Button onClick={() => setIsFullscreen(true)} className="bg-[#0B3A82] hover:bg-rose-900 text-white rounded-none h-[42px] px-5 font-bold shadow-sm">
          <Maximize2 className="w-[15px] h-[15px] mr-2" /> Fullscreen Mode
        </Button>
      </div>

      {mode === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-none border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-none bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Users className="w-6 h-6" /></div>
          <div>
            <h3 className="text-[22px] font-black text-slate-900 leading-none mb-1.5">{MOCK_MONITORED_STUDENTS}</h3>
            <p className="text-[12px] font-bold text-slate-700 leading-tight">Monitored Students</p>
            <p className="text-[11px] text-slate-400">Mock class-hour data</p>
          </div>
        </div>
        <div className="bg-white rounded-none border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-none bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><MapPin className="w-6 h-6 fill-emerald-500" /></div>
          <div>
            <h3 className="text-[22px] font-black text-slate-900 leading-none mb-1.5">{MOCK_MONITORED_STUDENTS - MOCK_BOUNDARY_ALERTS.length}</h3>
            <p className="text-[12px] font-bold text-slate-700 leading-tight">Inside Boundary</p>
            <p className="text-[11px] text-slate-400">Within school perimeter</p>
          </div>
        </div>
        <div className="bg-white rounded-none border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-none bg-red-50 text-red-600 flex items-center justify-center shrink-0"><ShieldAlert className="w-6 h-6" /></div>
          <div>
            <h3 className="text-[22px] font-black text-slate-900 leading-none mb-1.5">{MOCK_BOUNDARY_ALERTS.length}</h3>
            <p className="text-[12px] font-bold text-slate-700 leading-tight">Outside Now</p>
            <p className="text-[11px] text-slate-400">During class hours</p>
          </div>
        </div>
        <div className="bg-white rounded-none border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-none bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Bell className="w-6 h-6" /></div>
          <div>
            <h3 className="text-[22px] font-black text-slate-900 leading-none mb-1.5">{MOCK_BOUNDARY_ALERTS.filter(alert => alert.notificationStatus === 'Parent notified').length}</h3>
            <p className="text-[12px] font-bold text-slate-700 leading-tight">Parents Notified</p>
            <p className="text-[11px] text-slate-400">1 alert queued</p>
          </div>
        </div>
        </div>
      )}

      {/* Map Section */}
      <div className={`w-full ${mode === 'admin' ? 'min-h-[500px] h-[55vh]' : 'h-[calc(100vh-200px)] min-h-[600px]'} rounded-none overflow-hidden border border-slate-200 shadow-sm relative z-0`}>
        {mapElement}
      </div>

      {/* Preview-only boundary alerts (hidden for principals) */}
      {mode !== 'principal' && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-none overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" aria-hidden="true" />
              <h2 id="boundary-alerts-title" className="text-[15px] font-bold text-slate-900">Boundary Alerts</h2>
            </div>
            <p className="mt-1 text-[12px] text-slate-500">Preview of alerts created when a student leaves campus during class hours.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">Mock data</span>
            <span className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">Class-hours rule active</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100" aria-labelledby="boundary-alerts-title">
          {MOCK_BOUNDARY_ALERTS.map(alert => (
            <article key={alert.id} className="grid gap-4 p-5 md:grid-cols-[minmax(180px,1.2fr)_minmax(150px,0.8fr)_minmax(180px,1fr)_auto] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-red-50 text-sm font-black text-red-700">
                  {alert.name.split(' ').map(part => part[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-slate-900">{alert.name}</p>
                  <p className="truncate text-[12px] text-slate-500">{alert.className}</p>
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-red-700">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  {alert.distance}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Detected at {alert.detectedAt}</p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                  <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {alert.schedule}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {alert.channels.map(channel => (
                    <span key={channel} className="inline-flex items-center gap-1 border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">
                      {channel === 'Email' ? <Mail className="h-3 w-3" aria-hidden="true" /> : channel === 'App vibration' ? <Smartphone className="h-3 w-3" aria-hidden="true" /> : <Bell className="h-3 w-3" aria-hidden="true" />}
                      {channel}
                    </span>
                  ))}
                </div>
              </div>

              <span className={`w-fit whitespace-nowrap px-2.5 py-1.5 text-[11px] font-bold ${alert.notificationStatus === 'Parent notified' ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-amber-200 bg-amber-50 text-amber-800'}`}>
                {alert.notificationStatus}
              </span>
            </article>
          ))}
        </div>
        <div className="flex items-start gap-3 border-t border-blue-100 bg-blue-50/70 p-5 text-[12px] text-blue-900">
          <Bell className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p><span className="font-bold">Planned workflow:</span> during configured class hours, leaving the school boundary will trigger the dedicated parent app vibration and push alert, with email available as a fallback. This screen is a visual preview only.</p>
        </div>
        </div>
      )}
    </div>
  );
}
