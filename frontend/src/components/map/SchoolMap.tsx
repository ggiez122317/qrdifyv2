'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '@/lib/axios';
import { Maximize, Minimize, AlertTriangle } from 'lucide-react';

// Base coordinates for Trento National High School
const SCHOOL_CENTER: [number, number] = [8.0450, 126.0617];
const SCHOOL_ZONE_RADIUS_METERS = 100;

// Waypoints that follow the roads around Trento NHS
// These trace along the main road and surrounding streets
const ROAD_PATH: [number, number][] = [
  [8.0455, 126.0610],   // Start: road west of school
  [8.0458, 126.0615],   // Curve north along Apilong St
  [8.0462, 126.0620],   // North along road
  [8.0460, 126.0628],   // Turn east  
  [8.0455, 126.0632],   // East along national highway
  [8.0450, 126.0635],   // Continue east
  [8.0445, 126.0632],   // Turn south
  [8.0440, 126.0628],   // South along road
  [8.0438, 126.0622],   // Southwest curve
  [8.0440, 126.0615],   // West turn
  [8.0443, 126.0610],   // Continue west
  [8.0448, 126.0607],   // Northwest back toward start
  [8.0452, 126.0608],   // Approaching start
];

const createStudentIcon = (initials: string, isOutside: boolean, isMoving: boolean) => {
  let bgColor: string;
  if (isMoving) {
    bgColor = isOutside ? '#ef4444' : '#f59e0b'; // red if outside, amber if moving inside
  } else {
    bgColor = isOutside ? '#ef4444' : '#10b981'; // red if outside, green if inside
  }

  return L.divIcon({
    className: 'custom-student-marker',
    html: `
      <div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; pointer-events: none;">
        ${initials}
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${bgColor}; margin: 0 auto; margin-top: -2px; pointer-events: none;"></div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
};

const iconCache = new Map<string, L.DivIcon>();
const getStudentIcon = (initials: string, isOutside: boolean, isMoving: boolean) => {
  const key = `${initials}-${isOutside}-${isMoving}`;
  if (!iconCache.has(key)) {
    iconCache.set(key, createStudentIcon(initials, isOutside, isMoving));
  }
  return iconCache.get(key)!;
};

const getAvatarUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return url;
  return `/storage/${url}`;
};

function MapUpdater({ center, isFullscreen }: { center: [number, number], isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, map.getZoom());
    }, 350);
    return () => clearTimeout(timeout);
  }, [center, map, isFullscreen]);
  return null;
}

// Haversine formula
function getDistanceInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

// Interpolate between two waypoints
function interpolate(p1: [number, number], p2: [number, number], t: number): [number, number] {
  return [
    p1[0] + (p2[0] - p1[0]) * t,
    p1[1] + (p2[1] - p1[1]) * t,
  ];
}

export default function SchoolMap() {
  const [students, setStudents] = useState<any[]>([]);
  const [movingPos, setMovingPos] = useState<[number, number]>(ROAD_PATH[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fetch students ONCE on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/api/principal/online-students');
        setStudents(res.data);
      } catch (e) {
        console.error('Failed to fetch online students', e);
      }
    };
    fetchStudents();
  }, []);

  // Animate the moving student along the road waypoints
  useEffect(() => {
    const totalSegments = ROAD_PATH.length;
    
    const interval = setInterval(() => {
      // Move forward by a small step each tick
      progressRef.current = (progressRef.current + 0.02) % totalSegments;
      
      const segmentIndex = Math.floor(progressRef.current);
      const t = progressRef.current - segmentIndex; // fraction within segment
      const nextIndex = (segmentIndex + 1) % totalSegments;
      
      const newPos = interpolate(ROAD_PATH[segmentIndex], ROAD_PATH[nextIndex], t);
      setMovingPos(newPos);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Compute whether each student is inside/outside zone
  const isOutsideZone = (lat: number, lng: number) => {
    return getDistanceInM(SCHOOL_CENTER[0], SCHOOL_CENTER[1], lat, lng) > SCHOOL_ZONE_RADIUS_METERS;
  };

  // Build the final student list with the moving student's live position
  const displayStudents = students.map(student => {
    if (student.is_moving) {
      const outside = isOutsideZone(movingPos[0], movingPos[1]);
      return {
        ...student,
        location: { lat: movingPos[0], lng: movingPos[1] },
        zone_status: outside ? 'Outside Zone' : 'Inside Zone',
        is_outside: outside,
      };
    }
    const outside = isOutsideZone(student.location.lat, student.location.lng);
    return {
      ...student,
      zone_status: outside ? 'Outside Zone' : 'Inside Zone',
      is_outside: outside,
    };
  });

  const outsideStudents = displayStudents.filter(s => s.is_outside);

  return (
    <div ref={containerRef} className={`w-full relative z-[40] transition-all duration-300 ${isFullscreen ? 'h-screen bg-slate-900' : 'h-[75vh]'}`}>
      <MapContainer 
        center={SCHOOL_CENTER} 
        zoom={17} 
        style={{ width: '100%', height: '100%', zIndex: 0 }}
      >
        {/* Layer Control for Map/Satellite Toggle */}
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="Street View">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* School safe zone circle */}
        <Circle center={SCHOOL_CENTER} radius={SCHOOL_ZONE_RADIUS_METERS} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, weight: 2, dashArray: '5, 5' }} />

        <MapUpdater center={SCHOOL_CENTER} isFullscreen={isFullscreen} />

        {/* Static students */}
        {displayStudents.filter(s => !s.is_moving).map((student) => {
          const initials = student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
          const position: [number, number] = [student.location.lat, student.location.lng];
          
          return (
            <Marker 
              key={student.id} 
              position={position}
              icon={getStudentIcon(initials, student.is_outside, false)}
              eventHandlers={{
                click: () => setSelectedStudent(student)
              }}
            />
          );
        })}

        {/* Moving student */}
        {displayStudents.filter(s => s.is_moving).map((student) => {
          const initials = student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
          const position: [number, number] = [student.location.lat, student.location.lng];
          
          return (
            <Marker 
              key={`moving-${student.id}`} 
              position={position}
              icon={getStudentIcon(initials, student.is_outside, true)}
              eventHandlers={{
                click: () => setSelectedStudent(student)
              }}
            />
          );
        })}
      </MapContainer>

      {/* Fullscreen Toggle Button */}
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-[1000] bg-white text-slate-700 p-2.5 rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>

      {/* Student Info Card (React-based, not Leaflet popup) */}
      {selectedStudent && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-2xl shadow-xl border border-slate-200 w-[280px] animate-in fade-in slide-in-from-left-2 duration-200 overflow-hidden">
          <div className="p-4">
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-lg font-bold leading-none"
            >
              ×
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-base overflow-hidden shrink-0 border-2 border-white shadow">
                {selectedStudent.photo_url ? (
                  <img src={getAvatarUrl(selectedStudent.photo_url) || undefined} alt={selectedStudent.name} className="w-full h-full object-cover" />
                ) : selectedStudent.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-[15px] leading-tight">{selectedStudent.name}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{selectedStudent.id_number}</p>
              </div>
            </div>
            <div className="space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Grade & Section</span>
                <span className="font-semibold text-slate-700">{selectedStudent.grade_level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Adviser</span>
                <span className="font-semibold text-slate-700">{selectedStudent.teacher_name}</span>
              </div>
              <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Zone Status</span>
                {selectedStudent.is_outside ? (
                  <span className="font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg text-[11px] uppercase tracking-wider">⚠ Outside Zone</span>
                ) : (
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-[11px] uppercase tracking-wider">✓ Inside Zone</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className={`absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 transition-all ${isFullscreen ? 'ml-[320px]' : ''}`}>
        <h4 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-3">Zone Status</h4>
        <div className="space-y-2 text-[13px] font-medium text-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div> Inside Zone
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div> Moving (Inside)
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div> Outside Zone ⚠
          </div>
        </div>
      </div>

      {/* Outside Zone Sidebar (Only in Fullscreen) */}
      {isFullscreen && (
        <div className="absolute top-0 left-0 bottom-0 w-[320px] bg-white z-[1000] shadow-[4px_0_24px_rgba(0,0,0,0.1)] flex flex-col border-r border-slate-200 animate-in slide-in-from-left duration-300">
          <div className="p-6 border-b border-slate-100 bg-red-50/50">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-bold">Outside Zone</h2>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Students currently detected outside the 100m school safe zone during class hours.
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {outsideStudents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
                </div>
                <p className="font-bold text-sm">All students safe</p>
                <p className="text-xs text-slate-400 mt-1">Everyone is within the zone.</p>
              </div>
            ) : (
              outsideStudents.map(student => (
                <div key={student.id} className="p-4 bg-white border border-red-100 shadow-sm rounded-xl relative overflow-hidden group hover:border-red-300 transition-colors cursor-pointer">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-slate-800 text-[15px]">{student.name}</p>
                    <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{student.grade_level}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-500">Zone Status:</span>
                    <span className="text-red-600 font-bold">⚠ Outside Zone</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-red-600 font-semibold text-[11px] uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Live Tracking
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
