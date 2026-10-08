import React from 'react';
import { Trash2 } from 'lucide-react';

export const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-[#0b0f19] focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:focus:ring-indigo-500/30 transition-all placeholder-slate-400 dark:placeholder-slate-400 shadow-sm";
export const labelClass = "block text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 mb-1.5";

// Section Card Component
export const SectionCard: React.FC<{
  title: string;
  icon: React.ComponentType<any>;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon: Icon, headerRight, children }) => (
  <div className="bg-white dark:bg-[#151c2c] rounded-2xl border border-slate-200 dark:border-slate-800 transition-all mb-6 shadow-sm overflow-hidden flex flex-col flex-1 hover:shadow-md hover:border-indigo-500/20 dark:hover:border-indigo-500/40">
    <div className="p-4 sm:p-6 flex flex-col flex-1">
      <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-3.5 flex items-center justify-between gap-2 sm:gap-3 flex-nowrap">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-900/40">
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider sm:tracking-widest text-slate-800 dark:text-slate-100 truncate">{title}</h2>
        </div>
        {headerRight && <div className="flex items-center gap-2 shrink-0">{headerRight}</div>}
      </div>
      {children}
    </div>
  </div>
);

// Input Field Component
export const InputField: React.FC<{
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  colSpan?: number;
  suffix?: string;
  maxLength?: number;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}> = ({ label, name, type = "text", placeholder, colSpan = 1, suffix = "", maxLength, value, onChange, onClear }) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      const event = {
        target: { name, value: '', type }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <div className={`col-span-1 ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
      <label className={labelClass}>{label}</label>
      <div className="relative flex items-center">
        <input 
          type={type} 
          name={name} 
          value={value || ''} 
          onChange={onChange} 
          placeholder={placeholder} 
          maxLength={maxLength} 
          className={`${inputClass} ${suffix && !hasValue ? 'pr-10' : ''} ${hasValue ? 'pr-9' : ''}`} 
        />
        {suffix && !hasValue && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 font-bold text-sm pointer-events-none">
            {suffix}
          </span>
        )}
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer z-10"
            title="Zeile leeren"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Select Field Component
export const SelectField: React.FC<{
  label: string;
  name: string;
  options: string[];
  colSpan?: number;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
}> = ({ label, name, options, colSpan = 1, value, onChange, disabled = false }) => {
  const hasCustomValue = value && !options.includes(value);

  return (
    <div className={`col-span-1 ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
      <label className={labelClass}>{label}</label>
      <select 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        className={inputClass} 
        disabled={disabled}
      >
        <option value="" className="bg-white dark:bg-[#151c2c] text-slate-500 dark:text-slate-400">
          Bitte wählen...
        </option>
        {hasCustomValue && (
          <option value={value} className="bg-white dark:bg-[#151c2c] text-slate-900 dark:text-white font-semibold">
            {value}
          </option>
        )}
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-white dark:bg-[#151c2c] text-slate-900 dark:text-white font-semibold">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

// Custom Checkbox Component
export const CustomCheckbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, checked, onChange }) => (
  <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
    checked 
      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/60 text-indigo-700 dark:text-indigo-300' 
      : 'bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#111827]'
  }`}>
    <span className={`text-sm font-semibold truncate ${checked ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
      {label}
    </span>
    <div className="relative flex items-center">
      <input 
        type="checkbox" 
        checked={!!checked} 
        onChange={onChange} 
        className="peer sr-only" 
      />
      <div className={`w-4 h-4 rounded-full border transition-all duration-150 flex items-center justify-center ${checked ? 'border-indigo-650 bg-indigo-650' : 'border-slate-300 dark:border-slate-400 bg-transparent'}`}>
        {checked && (
          <svg className="w-3.5 h-3.5 text-white scale-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  </label>
);
