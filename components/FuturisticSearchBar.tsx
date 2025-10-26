import React, { useState, useEffect, useRef } from 'react';
import { generateSearchPredictions } from '../services/geminiService';
import Icon from './Icon';
import Spinner from './Spinner';

interface FuturisticSearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const FuturisticSearchBar: React.FC<FuturisticSearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<string[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Debounce prediction fetching
    if (query.length < 3 || !isFocused) {
      setPredictions([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsPredicting(true);
      try {
        const results = await generateSearchPredictions(query);
        setPredictions(results);
      } catch (error) {
        console.error('Error fetching search predictions:', error);
        setPredictions([]); // Clear on error
      } finally {
        setIsPredicting(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query, isFocused]);
  
  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      setQuery(searchQuery);
      setPredictions([]);
      setIsFocused(false);
      onSearch(searchQuery.trim());
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  }

  return (
    <div className="relative max-w-2xl mx-auto" ref={searchContainerRef}>
      <form onSubmit={handleFormSubmit} className="relative">
        <div className={`flex gap-2 items-center bg-slate-800/50 p-2 rounded-lg border transition-all duration-300 ${isFocused ? 'animate-pulse-glow' : 'border-slate-600'}`}>
            <Icon name="search" className="w-6 h-6 text-cyan-400/70 ml-2" />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="Scan for new horizons... (e.g., 'beaches in Thailand')"
                className="flex-grow p-2 border-0 focus:ring-0 bg-transparent text-slate-100 placeholder-slate-500 text-lg"
                aria-label="Search for a getaway location"
            />
            <button
                type="submit"
                className="flex items-center justify-center px-5 py-3 bg-cyan-500/20 text-cyan-300 rounded-md border border-cyan-500 hover:bg-cyan-500/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={isLoading || !query.trim()}
            >
                {isLoading ? <Spinner /> : 'Search'}
            </button>
        </div>
      </form>

      {isFocused && (query.length > 2 || isPredicting || predictions.length > 0) && (
        <div className="absolute top-full mt-3 w-full bg-slate-800/80 backdrop-blur-md border border-cyan-400/20 rounded-lg overflow-hidden z-20 animate-fade-in shadow-2xl shadow-cyan-500/10">
            {isPredicting ? (
                <div className="p-4 text-center text-slate-400 flex items-center justify-center">
                    <Spinner />
                    <span className="ml-3">AI is predicting your next move...</span>
                </div>
            ) : (
                predictions.length > 0 && (
                    <ul className="divide-y divide-slate-700/50">
                        {predictions.map((prediction, index) => (
                        <li key={index}>
                            <button
                                onClick={() => handleSearch(prediction)}
                                className="w-full text-left px-5 py-4 text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-200 transition-colors duration-200 flex items-center"
                            >
                                <Icon name="location" className="w-5 h-5 mr-3 text-cyan-500 flex-shrink-0" />
                                {prediction}
                            </button>
                        </li>
                        ))}
                    </ul>
                )
            )}
        </div>
      )}
    </div>
  );
};

export default FuturisticSearchBar;