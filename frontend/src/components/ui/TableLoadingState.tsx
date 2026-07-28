import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

export function LoadingAnimation({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full py-12">
      <div className="relative flex items-center justify-center w-20 h-20 mb-8 mt-4">
        {/* Outer glowing rings */}
        <div className="absolute inset-0 bg-[#7a1315]/10 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
        <div className="absolute inset-2 bg-[#7a1315]/10 rounded-full animate-pulse" style={{ animationDuration: '1.5s' }}></div>
        
        {/* Spinning loader track */}
        <div className="absolute inset-4 rounded-full border-[3px] border-slate-100"></div>
        
        {/* Main spinning indicator */}
        <div className="relative w-12 h-12 border-[3px] border-transparent border-t-[#7a1315] border-r-[#7a1315] rounded-full animate-spin"></div>
        
        {/* Center dot */}
        <div className="absolute w-2 h-2 bg-[#7a1315] rounded-full animate-pulse"></div>
      </div>
      <h3 className="text-[18px] font-bold text-slate-800 mb-1">{message}</h3>
      <p className="text-[14px] text-slate-500 font-medium">Please wait a moment while we fetch the records.</p>
    </div>
  );
}

export function TableLoadingState({ 
  colSpan = 4, 
  message = 'Loading data...' 
}: { 
  colSpan?: number; 
  message?: string; 
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-[400px] text-center border-b-0">
        <LoadingAnimation message={message} />
      </TableCell>
    </TableRow>
  );
}
