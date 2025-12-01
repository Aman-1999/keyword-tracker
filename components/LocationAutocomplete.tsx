'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

interface Location {
    id: number;
    name: string;
    subtext: string;
    value: string;
    type: string;
    location_code: number;
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (location: Location) => void;
}

export default function LocationAutocomplete({ value, onChange, onSelect }: Props) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isSelectingRef = useRef(false); // Track if user is selecting from dropdown

    useEffect(() => {
        if (value !== query) {
            setQuery(value);
        }
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // Skip API call if user just selected a location
        if (isSelectingRef.current) {
            isSelectingRef.current = false;
            return;
        }

        const searchLocations = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/locations?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.results || []);
                setIsOpen(true);
            } catch (error) {
                console.error('Failed to search locations:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchLocations, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (location: Location) => {
        isSelectingRef.current = true; // Set flag before updating query
        setQuery(location.value);
        onChange(location.value);
        setIsOpen(false);
        if (onSelect) {
            onSelect(location);
        }
    };

    const clearInput = () => {
        setQuery('');
        onChange('');
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange(e.target.value);
                    }}
                    placeholder="Search location..."
                    className="pl-10 pr-10 block w-full rounded-xl border-gray-200 bg-gray-50/50 p-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500 sm:text-sm transition-all shadow-sm hover:border-indigo-300"
                />
                {query && (
                    <button
                        type="button"
                        onClick={clearInput}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isOpen && (results.length > 0 || loading) && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-72 overflow-auto">
                    {loading && (
                        <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2 border-b border-gray-50">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            <span className="text-sm">Searching...</span>
                        </div>
                    )}
                    {results.length > 0 && (
                        <ul className="py-1">
                            {results.map((location) => (
                                <li
                                    key={location.id}
                                    onClick={() => handleSelect(location)}
                                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                >
                                    <div className="font-medium text-gray-900 text-sm">
                                        {location.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {location.subtext}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
