import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  isValid?: boolean;
  inputClassName?: string;
  labelClassName?: string;
  options: { value: string; label: string }[];
}

export default function FloatingSelect({
  label,
  icon,
  error,
  isValid,
  className = '',
  inputClassName = '',
  labelClassName = '',
  options,
  ...props
}: FloatingSelectProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = props.value !== undefined && props.value !== null && String(props.value).length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {icon && (
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isFocused ? 'text-emerald-500' : 'text-slate-400'}`}>
            {icon}
          </div>
        )}
        
        <select
          {...props}
          className={`
            w-full bg-slate-50 border rounded-2xl outline-none transition-all duration-200 appearance-none
            ${icon ? 'pl-11' : 'pl-4'} 
            pr-11
            pt-5 pb-2 text-sm font-medium text-slate-900
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30' 
              : isValid 
                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-emerald-50/30' 
                : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300 hover:bg-white focus:bg-white'
            }
            ${inputClassName}
          `}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        >
          <option value="" disabled className="text-slate-400">Pilih {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <label
          className={`
            absolute left-0 transition-all duration-200 pointer-events-none
            ${icon ? 'ml-11' : 'ml-4'}
            ${isFloating 
              ? 'top-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500' 
              : 'top-3.5 text-sm font-medium text-slate-400'
            }
            ${isFocused && !error ? 'text-emerald-600' : ''}
            ${error ? 'text-red-500' : ''}
            ${inputClassName.includes('bg-slate-800') ? 'text-slate-400' : ''}
            ${isFloating && inputClassName.includes('bg-slate-800') ? 'text-slate-300' : ''}
            ${labelClassName}
          `}
        >
          {label}
        </label>

        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <ChevronDown size={18} className="text-slate-400" />
        </div>
      </div>
      
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center">
          {error}
        </p>
      )}
    </div>
  );
}
