'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { MapPinned } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the map component to prevent SSR window is not defined errors
const MapComponent = dynamic(
  () => import('@/components/map/SchoolMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[75vh] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
        <MapPinned className="w-12 h-12 text-slate-300" />
      </div>
    )
  }
);

export default function SchoolMapPage() {
  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-2">
        <div>
          <h2 className="text-[26px] font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            School Map
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-[15px] mt-1 font-medium">Monitor real-time locations of online students around the campus.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-0">
        <MapComponent />
      </div>
    </div>
  );
}
