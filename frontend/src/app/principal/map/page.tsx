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
    <div className="w-full animate-in fade-in zoom-in-95 duration-500 h-full relative z-0">
      <MapComponent mode="principal" />
    </div>
  );
}
