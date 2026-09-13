import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'primary' | 'amber' | 'emerald' | 'slate' | 'rose' | 'indigo';
  searchTerms?: string;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allOptionLabel?: string; // If provided, shows an "-- All --" item with value=""
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  autoSortAlphabetical?: boolean; // defaults to true
  align?: 'left' | 'right';
  noResultsText?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  allOptionLabel,
  icon,
  className = '',
  disabled = false,
  autoSortAlphabetical = true,
  align = 'left',
  noResultsText = 'No matching options found',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 1. Sort options in alphabetical order (natural sort)
  const sortedOptions = useMemo(() => {
    if (!autoSortAlphabetical) return options;
    return [...options].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [options, autoSortAlphabetical]);

  // 2. Filter options as user types (shrink list)
  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedOptions;

    return sortedOptions.filter((opt) => {
      const matchTitle = opt.title.toLowerCase().includes(query);
      const matchSubtitle = opt.subtitle?.toLowerCase().includes(query) ?? false;
      const matchBadge = opt.badge?.toLowerCase().includes(query) ?? false;
      const matchTerms = opt.searchTerms?.toLowerCase().includes(query) ?? false;
      return matchTitle || matchSubtitle || matchBadge || matchTerms;
    });
  }, [sortedOptions, searchQuery]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return sortedOptions.find((opt) => opt.id === value);
  }, [sortedOptions, value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalItems = (allOptionLabel ? 1 : 0) + filteredOptions.length;

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allOptionLabel && highlightedIndex === 0) {
        handleSelect('');
      } else {
        const optionIndex = allOptionLabel ? highlightedIndex - 1 : highlightedIndex;
        if (optionIndex >= 0 && optionIndex < filteredOptions.length) {
          handleSelect(filteredOptions[optionIndex].id);
        }
      }
    }
  };

  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rose':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'primary':
      default:
        return 'bg-shu-100 text-shu-800 border-shu-200';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 border rounded-xl font-semibold text-left transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'bg-white border-shu-700 ring-2 ring-shu-700/20 text-slate-900'
            : 'border-slate-200 text-slate-800 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
          {icon && <span className="shrink-0 text-slate-500">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-slate-900 truncate">{selectedOption.title}</span>
              {selectedOption.subtitle && (
                <span className="text-[11px] font-normal text-slate-500 truncate hidden sm:inline">
                  • {selectedOption.subtitle}
                </span>
              )}
              {selectedOption.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getBadgeStyle(
                    selectedOption.badgeColor
                  )}`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-600 font-medium truncate">
              {allOptionLabel ? allOptionLabel : placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && allOptionLabel && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              title="Clear selection"
              className="p-0.5 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-shu-700' : 'text-slate-500'
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-full min-w-[280px] sm:min-w-[340px] max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Search Input Box */}
          <div className="p-2.5 bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Type to filter & shrink list..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-shu-700/20 focus:border-shu-700 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Counter info */}
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] font-medium text-slate-500">
              <span>Alphabetical (A-Z)</span>
              <span>
                {filteredOptions.length} of {sortedOptions.length} available
              </span>
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-64 overflow-y-auto p-1.5 space-y-0.5" role="listbox">
            {/* "All Options" item if enabled and search query is empty or matches */}
            {allOptionLabel && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                  value === ''
                    ? 'bg-shu-50 text-shu-900 font-bold border border-shu-200/60'
                    : highlightedIndex === 0
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
                role="option"
                aria-selected={value === ''}
              >
                <div className="flex items-center gap-2">
                  <span className="italic text-slate-600">{allOptionLabel}</span>
                </div>
                {value === '' && <Check className="w-3.5 h-3.5 text-shu-700 shrink-0" />}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs font-semibold text-slate-600">{noResultsText}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different term</p>
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = value === option.id;
                const itemIndex = allOptionLabel ? idx + 1 : idx;
                const isHighlighted = highlightedIndex === itemIndex;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-shu-700 text-white font-bold shadow-2xs'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-800 hover:bg-slate-50 font-medium'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold truncate ${
                            isSelected ? 'text-white' : 'text-slate-900 group-hover:text-shu-700'
                          }`}
                        >
                          {option.title}
                        </span>
                        {option.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white border-white/30'
                                : getBadgeStyle(option.badgeColor)
                            }`}
                          >
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.subtitle && (
                        <span
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected ? 'text-shu-100' : 'text-slate-500'
                          }`}
                        >
                          {option.subtitle}
                        </span>
                      )}
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-1" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
