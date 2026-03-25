import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  validationFn?: (value: string) => boolean;
  errorMessage?: string;
}

export function FloatingInput({ 
  label, 
  icon, 
  validationFn, 
  errorMessage, 
  className = '', 
  ...props 
}: FloatingInputProps) {
  const [touched, setTouched] = useState(false);
  
  const isValid = validationFn ? validationFn(props.value as string) : true;
  const showError = touched && !isValid && (props.value as string)?.length > 0;
  const showSuccess = touched && isValid && (props.value as string)?.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        {icon && (
          <div className={`absolute left-4 z-10 transition-colors ${
            showError ? 'text-red-500' : showSuccess ? 'text-emerald-500' : 'text-slate-400 peer-focus:text-emerald-500'
          }`}>
            {icon}
          </div>
        )}
        <input
          {...props}
          placeholder=" "
          onBlur={(e) => {
            setTouched(true);
            if (props.onBlur) props.onBlur(e);
          }}
          className={`peer w-full ${icon ? 'pl-11' : 'pl-4'} pr-10 pt-6 pb-2 bg-slate-50 border-2 rounded-xl outline-none transition-all text-sm font-medium text-slate-900
            ${showError 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30' 
              : showSuccess 
                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-emerald-50/30' 
                : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300'
            }
          `}
        />
        <label
          className={`absolute ${icon ? 'left-11' : 'left-4'} text-slate-500 transition-all duration-200 pointer-events-none
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm
            peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-bold
            top-2 translate-y-0 text-[10px] font-bold
            ${showError ? 'peer-focus:text-red-500 text-red-500' : showSuccess ? 'peer-focus:text-emerald-600 text-emerald-600' : 'peer-focus:text-emerald-600'}
          `}
        >
          {label}
        </label>
        
        {/* Validation Icons */}
        {showSuccess && (
          <div className="absolute right-4 text-emerald-500 animate-in zoom-in duration-200">
            <CheckCircle2 size={18} />
          </div>
        )}
        {showError && (
          <div className="absolute right-4 text-red-500 animate-in zoom-in duration-200">
            <XCircle size={18} />
          </div>
        )}
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
