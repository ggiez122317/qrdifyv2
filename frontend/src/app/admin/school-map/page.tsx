'use client';
import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('@/components/map/SchoolMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center p-12">Loading Map Components...</div>
});

export default function SchoolMapPage() {
  return (
    <div className="w-full p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <MapWithNoSSR />
    </div>
  );
}
