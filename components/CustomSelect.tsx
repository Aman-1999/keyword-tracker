'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    subtext?: string;
}

interface Props {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchable?: boolean;
    icon?: React.ReactNode;
    className?: string;
}

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    searchable = false,
    icon,
    className = '',
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Filter options based on search query
    const filteredOptions = searchable && searchQuery
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opt.subtext?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    // Reset highlighted index when filtered options change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchQuery]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchQuery('');
                break;
        }
    };

    // Scroll highlighted option into view
    useEffect(() => {
        if (isOpen && optionsRef.current) {
            const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [highlightedIndex, isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchQuery('');
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Select Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className={`relative w-full rounded-xl border bg-white p-3 text-left transition-all shadow-sm hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'
                    }`}
            >
                <div className="flex items-center gap-2">
                    {icon && (
                        <span className="text-gray-400 flex-shrink-0">
                            {icon}
                        </span>
                    )}
                    <span className={`block truncate text-sm flex-1 ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
                        {selectedOption ? (
                            <span>
                                {selectedOption.label}
                                {selectedOption.subtext && (
                                    <span className="text-gray-500 ml-1">- {selectedOption.subtext}</span>
                                )}
                            </span>
                        ) : (
                            placeholder
                        )}
                    </span>
                    <div className="flex items-center gap-1">
                        {selectedOption && (
                            <button
                                type="button"
                                onClick={clearSelection}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <ChevronDown
                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''
                                }`}
                        />
                    </div>
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Search Input */}
                    {searchable && (
                        <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Options List */}
                    <div ref={optionsRef} className="overflow-auto max-h-64 py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No options found
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${highlightedIndex === index
                                            ? 'bg-indigo-50'
                                            : 'hover:bg-gray-50'
                                        } ${option.value === value
                                            ? 'text-indigo-700 font-medium'
                                            : 'text-gray-900'
                                        }`}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                >
                                    <span className="flex-1">
                                        {option.label}
                                        {option.subtext && (
                                            <span className="text-gray-500 ml-1 text-xs">
                                                {option.subtext}
                                            </span>
                                        )}
                                    </span>
                                    {option.value === value && (
                                        <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
