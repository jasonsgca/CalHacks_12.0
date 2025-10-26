import React, { useEffect, useRef } from 'react';
import { GetawaySuggestion } from '../types';

// Declare Leaflet 'L' to satisfy TypeScript, as it's loaded from a CDN
declare const L: any;

interface MapViewProps {
  suggestions: GetawaySuggestion[];
}

const MapView: React.FC<MapViewProps> = ({ suggestions }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Initialize map only once
    if (mapContainer.current && !mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current, {
        scrollWheelZoom: false, // More user-friendly default
      }).setView([37.7749, -122.4194], 9); // Default to San Francisco area

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    // Update markers when suggestions change
    if (mapInstance.current && suggestions.length > 0) {
      // Clear existing markers from the map and the ref array
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Create a marker for each suggestion
      const newMarkers = suggestions.map(suggestion => {
        const marker = L.marker([suggestion.latitude, suggestion.longitude])
          .bindPopup(
            `
            <div class="font-sans">
              <h3 class="font-bold text-md mb-1 text-cyan-300 uppercase tracking-wide">${suggestion.title}</h3>
              <p class="text-sm text-slate-400">${suggestion.location}</p>
            </div>
            `, { closeButton: false }
          );
        
        // Add hover effect to open popup
        marker.on('mouseover', function (this: any) {
            this.openPopup();
        });
        marker.on('mouseout', function (this: any) {
            this.closePopup();
        });
        
        return marker;
      });

      // Add new markers to a feature group to easily manage them and set map bounds
      const featureGroup = L.featureGroup(newMarkers).addTo(mapInstance.current);
      
      if (suggestions.length === 1) {
        mapInstance.current.setView([suggestions[0].latitude, suggestions[0].longitude], 9);
      } else if (featureGroup.getBounds().isValid()) {
        mapInstance.current.fitBounds(featureGroup.getBounds().pad(0.1));
      }
      
      // Store new markers in ref
      markersRef.current = newMarkers;
    }

  }, [suggestions]);

  return <div ref={mapContainer} className="h-[600px] w-full rounded-lg border border-cyan-400/20 shadow-lg z-0" />;
};

export default MapView;