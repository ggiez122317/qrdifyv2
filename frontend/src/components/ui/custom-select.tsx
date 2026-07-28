import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  icon?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
}

export function CustomSelect({ value, onChange, options, icon, className = '', triggerClassName = 'h-[46px] px-3 border border-slate-200 rounded-xl min-w-[140px]' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className={`relative flex items-center bg-white cursor-pointer hover:bg-slate-50 transition-colors ${triggerClassName}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon && <div className="mr-2">{icon}</div>}
        <div className="flex-1 text-[14px] font-semibold text-[#334155] pr-6 truncate">
          {selectedOption?.label || 'Select...'}
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] right-0 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${value === option.value ? 'bg-slate-50' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span className={`text-[13px] ${value === option.value ? 'font-bold text-[#0f172a]' : 'font-medium text-slate-600'}`}>
                {option.label}
              </span>
              {value === option.value && <Check className="w-4 h-4 text-[#a81616]" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
