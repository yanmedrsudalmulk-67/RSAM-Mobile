import React, { useState, useRef } from 'react';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface DateMaskInputProps {
  label: string;
  value: string; // Expected format: DD/MM/YYYY
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  className?: string;
}

export function DateMaskInput({ 
  label, 
  value, 
  onChange, 
  required, 
  disabled = false,
  errorMessage = "Tanggal lahir tidak valid",
  className = ''
}: DateMaskInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  const mask = "DD/MM/YYYY";
  
  // Validation logic
  const isValid = (val: string) => {
    if (!val) return !required;
    const parts = val.split('/');
    if (parts.length !== 3) return false;
    
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    
    if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
    
    const currentYear = new Date().getFullYear();
    if (y < 1900 || y > currentYear) return false;
    if (m < 1 || m > 12) return false;
    
    const daysInMonth = new Date(y, m, 0).getDate();
    return d >= 1 && d <= daysInMonth;
  };

  const showError = touched && !isValid(value) && value.length > 0;
  const showSuccess = touched && isValid(value) && value.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    
    if (raw.length > 0) {
      formatted = raw.slice(0, 2);
      if (raw.length > 2) {
        formatted += '/' + raw.slice(2, 4);
        if (raw.length > 4) {
          formatted += '/' + raw.slice(4, 8);
        }
      }
    }
    onChange(formatted);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value; // YYYY-MM-DD
    if (dateVal) {
      const [y, m, d] = dateVal.split('-');
      onChange(`${d}/${m}/${y}`);
      setTouched(true);
    }
  };

  const triggerDatePicker = () => {
    if (!disabled && datePickerRef.current) {
      datePickerRef.current.showPicker();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center transition-all duration-200 border-2 rounded-xl h-[64px]
        ${disabled ? 'bg-slate-50 border-slate-100 cursor-not-allowed' : 'bg-slate-50'}
        ${!disabled && showError 
          ? 'border-red-300 ring-4 ring-red-500/10 bg-red-50/30' 
          : !disabled && showSuccess 
            ? 'border-emerald-300 ring-4 ring-emerald-500/10 bg-emerald-50/30' 
            : !disabled && isFocused 
              ? 'border-emerald-500 ring-4 ring-emerald-500/10' 
              : !disabled ? 'border-slate-200 hover:border-slate-300' : ''
        }
      `}>
        {/* Calendar Icon / Trigger */}
        <button 
          type="button"
          onClick={triggerDatePicker}
          disabled={disabled}
          className={`absolute left-4 z-10 transition-colors hover:scale-110 active:scale-95 ${
            showError ? 'text-red-500' : showSuccess ? 'text-emerald-500' : isFocused ? 'text-emerald-500' : 'text-slate-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Calendar size={18} />
        </button>

        <div className="relative flex-1 h-full">
          {/* Label */}
          <label className={`absolute left-11 transition-all duration-200 pointer-events-none
            ${(isFocused || value) 
              ? 'top-2 text-[10px] font-bold' 
              : 'top-1/2 -translate-y-1/2 text-sm'
            }
            ${showError ? 'text-red-500' : showSuccess ? 'text-emerald-600' : isFocused ? 'text-emerald-600' : 'text-slate-500'}
          `}>
            {label}
          </label>

          {/* Mask Overlay (Ghost Text) */}
          {(isFocused || value) && (
            <div className="absolute left-11 top-8 text-sm font-medium pointer-events-none flex tracking-[0.05em]">
              {mask.split('').map((char, i) => {
                const isTyped = i < value.length;
                return (
                  <span key={i} className={isTyped ? 'text-slate-900' : 'text-slate-300'}>
                    {isTyped ? value[i] : char}
                  </span>
                );
              })}
            </div>
          )}

          {/* Hidden Real Input */}
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setTouched(true);
            }}
            placeholder={!isFocused && !value ? "DD/MM/YYYY" : ""}
            className={`absolute inset-0 w-full h-full opacity-0 cursor-text pl-11 pr-10 pt-6 pb-2 font-mono
              ${!isFocused && !value ? 'placeholder:text-slate-300 placeholder:opacity-100' : ''}
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
            required={required}
          />
          
          {/* Fallback Date Picker (Hidden) */}
          <input
            ref={datePickerRef}
            type="date"
            className="absolute opacity-0 pointer-events-none"
            onChange={handleDatePickerChange}
            tabIndex={-1}
          />
        </div>

        {/* Validation Icons */}
        <div className="absolute right-4 flex items-center gap-2">
          {showSuccess && <CheckCircle2 size={18} className="text-emerald-500 animate-in zoom-in duration-200" />}
          {showError && <XCircle size={18} className="text-red-500 animate-in zoom-in duration-200" />}
        </div>
      </div>

      {/* Error Message */}
      {showError && errorMessage && (
        <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium animate-in slide-in-from-top-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
