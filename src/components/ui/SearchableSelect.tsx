import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Check, Plus } from 'lucide-react';

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCustomInput?: boolean;
  onClear?: () => void;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Bitte wählen...',
  disabled = false,
  className = '',
  allowCustomInput = true,
  onClear
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Alphabetically sort options
  const sortedOptions = useMemo(() => {
    return Array.from(new Set<string>(options)).sort((a: string, b: string) =>
      a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true })
    );
  }, [options]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return sortedOptions;
    const q = searchQuery.toLowerCase().trim();
    return sortedOptions.filter(opt => opt.toLowerCase().includes(q));
  }, [sortedOptions, searchQuery]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    setIsOpen(false);
  };

  const isExactMatch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return sortedOptions.some(opt => opt.toLowerCase().trim() === q);
  }, [sortedOptions, searchQuery]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-left flex items-center justify-between gap-2 outline-none transition-all shadow-2xs ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900'
            : 'hover:border-indigo-500 dark:hover:border-indigo-400 focus:bg-white dark:focus:bg-[#0b0f19] focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/15 cursor-pointer'
        } ${isOpen ? 'border-indigo-600 ring-4 ring-indigo-500/15 bg-white dark:bg-[#0b0f19]' : ''}`}
      >
        <span className={`truncate flex-1 ${value ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 dark:text-slate-400 font-medium'}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {Boolean(value) && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
              title="Auswahl zurücksetzen"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''}`} />
        </div>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-100 min-w-[200px]">
          {/* Search Input Sticky Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0f19]/80 backdrop-blur-xs flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0]);
                  } else if (allowCustomInput && searchQuery.trim()) {
                    handleSelect(searchQuery.trim());
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              placeholder="Suchen..."
              className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white outline-none placeholder-slate-400 dark:placeholder-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {value && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all flex items-center justify-between cursor-pointer"
              >
                <span>-- Auswahl aufheben --</span>
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })
            ) : (
              <div className="py-2.5 px-3 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Kein passender Eintrag gefunden
                </p>
              </div>
            )}

            {/* Custom Input Option if no exact match and user typed something */}
            {allowCustomInput && searchQuery.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim())}
                className="w-full mt-1 text-left px-3 py-2 rounded-lg text-xs font-bold bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-all flex items-center gap-2 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">"{searchQuery.trim()}" als Freitext verwenden</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
