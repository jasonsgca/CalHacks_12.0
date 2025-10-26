import React, { useState, useEffect, useRef } from 'react';
import { GetawaySuggestion, UserProfile } from '../types';
import Icon from './Icon';

interface SuggestionCardProps {
  suggestion: GetawaySuggestion;
  onClick: () => void;
  planPreference: 'chill' | 'touristy';
  user: UserProfile;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onClick, planPreference, user }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPrimaryImageLoaded, setIsPrimaryImageLoaded] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const startSlideshow = () => {
      // Don't start if there's only one image
      if (suggestion.imageUrls.length <= 1) return;

      intervalRef.current = window.setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % suggestion.imageUrls.length);
      }, 1800); // cycle every 1.8 seconds
    };

    const stopSlideshow = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0);
    };

    if (isHovered) {
      startSlideshow();
    } else {
      stopSlideshow();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, suggestion.imageUrls.length]);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="text-left w-full h-full flex flex-col bg-slate-800/50 rounded-lg border border-cyan-400/20 overflow-hidden transition-all duration-300 ease-in-out card-glow transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
    >
      <div className="relative w-full h-56 bg-slate-700 flex-shrink-0">
        {!isPrimaryImageLoaded && (
          <div className="w-full h-full animate-pulse" />
        )}
        {suggestion.imageUrls.map((url, index) => (
          <img
            key={index}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            src={url}
            alt={`${suggestion.title} ${index + 1}`}
            onLoad={() => { if (index === 0) setIsPrimaryImageLoaded(true); }}
            loading="lazy"
          />
        ))}

        {planPreference === 'chill' && suggestion.pricePerNight > 0 && (
          <div className="absolute top-0 right-0 bg-slate-900/70 text-cyan-300 text-xs font-bold px-3 py-1 m-2 rounded-md border border-cyan-400/30 z-10">
            Avg. ${suggestion.pricePerNight}/night
          </div>
        )}
        
        {/* Image indicator dots */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-2 z-10">
          {suggestion.imageUrls.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white shadow-lg scale-125' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>
      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
            <h3 className="text-lg font-bold text-slate-200 truncate uppercase tracking-wider">{suggestion.title}</h3>
            <div className="flex items-center text-sm text-slate-400 mt-1">
            <Icon name="location" className="w-4 h-4 mr-2 text-cyan-400"/>
            <span>{suggestion.location}</span>
            </div>
            <p className="text-slate-300 mt-3 text-sm h-12 overflow-hidden font-light leading-relaxed">
            {suggestion.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
            {suggestion.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-cyan-900/50 text-cyan-300 text-xs font-semibold rounded-md border border-cyan-700/50">
                {tag}
                </span>
            ))}
            </div>
        </div>
      </div>
    </button>
  );
};

export default SuggestionCard;