import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, GetawaySuggestion } from '../types';
import { generateGetawaySuggestions, generateGeneralSuggestions } from '../services/geminiService';
import Header from './Header';
import SuggestionCard from './SuggestionCard';
import Spinner from './Spinner';
import MapView from './MapView';
import Icon from './Icon';
import RelaxationPlanner from './RelaxationPlanner';
import FuturisticSearchBar from './FuturisticSearchBar';

type Tab = 'personalized' | 'explore';
type ViewMode = 'grid' | 'map';
type PlanPreference = 'chill' | 'touristy';

interface DashboardProps {
  user: UserProfile;
  onSignInClick: () => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSignInClick, onLogout }) => {
  const isGuest = user.name === 'Explorer';

  const [suggestions, setSuggestions] = useState<GetawaySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(isGuest ? 'explore' : 'personalized');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentExploreLocation, setCurrentExploreLocation] = useState(user.location);
  const [selectedSuggestion, setSelectedSuggestion] = useState<GetawaySuggestion | null>(null);
  const [planPreference, setPlanPreference] = useState<PlanPreference>('chill');

  const fetchSuggestions = useCallback(async (locationOverride?: string) => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      let result;
      if (activeTab === 'personalized') {
        setCurrentExploreLocation(user.location);
        result = await generateGetawaySuggestions(user, planPreference);
      } else {
        const locationToFetch = locationOverride || currentExploreLocation;
        setCurrentExploreLocation(locationToFetch);
        result = await generateGeneralSuggestions(locationToFetch);
      }
      setSuggestions(result);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('API_KEY') || err.message.includes('Requested entity was not found')) {
            setError("Your Gemini API Key is missing or invalid. Please ensure it's configured correctly.");
            return;
        }
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentExploreLocation, user, planPreference]);
  
  useEffect(() => {
    if (!selectedSuggestion) {
      fetchSuggestions();
    }
  }, [activeTab, selectedSuggestion, fetchSuggestions, planPreference]);

  // Effect to switch tabs based on login status
  useEffect(() => {
    if (isGuest) {
      setActiveTab('explore');
    } else {
      setActiveTab('personalized');
    }
  }, [isGuest]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setViewMode('grid');
  };
  
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      fetchSuggestions(query.trim());
    }
  }, [fetchSuggestions]);

  const handleSuggestionSelect = (suggestion: GetawaySuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleBackToDashboard = () => {
    setSelectedSuggestion(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-64">
          <Spinner />
          <p className="mt-4 text-lg text-slate-300 uppercase tracking-widest">AI is calibrating getaway protocols...</p>
          <p className="text-sm text-cyan-400/70">Please hold.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-md" role="alert">
          <strong className="font-bold">SYSTEM ALERT! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      );
    }
    
    if (suggestions.length === 0) {
      return (
        <div className="text-center h-64 flex flex-col items-center justify-center">
            <p className="text-lg text-slate-400">No suggestions match current parameters.</p>
            <button onClick={() => fetchSuggestions()} className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500 rounded-md hover:bg-cyan-500/40 transition">
                Re-scan
            </button>
        </div>
      );
    }
    
    if (activeTab === 'explore' && viewMode === 'map') {
        return <MapView suggestions={suggestions} />;
    }

    const planPrefForCard = activeTab === 'personalized' ? planPreference : 'chill';

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {suggestions.map((suggestion) => (
          <SuggestionCard 
            key={suggestion.id} 
            suggestion={suggestion} 
            onClick={() => handleSuggestionSelect(suggestion)} 
            planPreference={planPrefForCard}
            user={user}
          />
        ))}
      </div>
    );
  };
  
  const ViewToggleButton: React.FC<{mode: ViewMode, label: string, icon: 'grid' | 'map'}> = ({mode, label, icon}) => {
    const isActive = viewMode === mode;
    return (
        <button
            onClick={() => setViewMode(mode)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 border ${isActive ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]' : 'bg-slate-800/50 text-slate-400 border-slate-600 hover:bg-slate-700/50 hover:text-slate-200'}`}
        >
            <Icon name={icon} className="w-5 h-5 mr-2" />
            {label}
        </button>
    )
  }

  const PlanPreferenceToggle: React.FC<{preference: PlanPreference, label: string, type: PlanPreference}> = ({preference, label, type}) => {
      const isActive = preference === type;
      return (
          <button
              onClick={() => setPlanPreference(type)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 border ${isActive ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]' : 'bg-slate-800/50 text-slate-400 border-slate-600 hover:bg-slate-700/50 hover:text-slate-200'}`}
          >
              {label}
          </button>
      )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header user={user} isGuest={isGuest} onSignInClick={onSignInClick} onLogout={onLogout} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedSuggestion ? (
          <RelaxationPlanner 
            suggestion={selectedSuggestion} 
            onBack={handleBackToDashboard} 
            user={user} 
            planPreference={activeTab === 'personalized' ? planPreference : 'chill'}
          />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-100 uppercase tracking-wide text-glow">
                      {isGuest ? 'Find Your Getaway' : `Welcome, ${user.name.split(' ')[0]}`}
                    </h2>
                    <p className="text-lg text-slate-400 mt-1">
                    {activeTab === 'personalized' ? 'AI-matched getaways to recalibrate work-life balance.' : `Scanning for destinations near: ${currentExploreLocation}.`}
                    </p>
                </div>
                {activeTab === 'explore' && !isLoading && suggestions.length > 0 && (
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                        <ViewToggleButton mode="grid" label="Grid" icon="grid" />
                        <ViewToggleButton mode="map" label="Map" icon="map" />
                    </div>
                )}
            </div>
            
            {!isGuest && (
              <div className="border-b border-cyan-400/20 mb-6">
                  <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                      <button
                          onClick={() => handleTabChange('personalized')}
                          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 uppercase tracking-wider ${activeTab === 'personalized' ? 'border-cyan-400 text-cyan-300 text-glow' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-400'}`}
                      >
                          Personalized
                      </button>
                      <button
                          onClick={() => handleTabChange('explore')}
                          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 uppercase tracking-wider ${activeTab === 'explore' ? 'border-cyan-400 text-cyan-300 text-glow' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-400'}`}
                      >
                          Explore More
                      </button>
                  </nav>
              </div>
            )}

            {activeTab === 'personalized' && (
              <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 animate-fade-in">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider flex-shrink-0">Trip Style:</p>
                <div className="flex items-center space-x-2">
                    <PlanPreferenceToggle preference={planPreference} label="Chill Getaway" type="chill" />
                    <PlanPreferenceToggle preference={planPreference} label="Touristy Plan" type="touristy" />
                </div>
              </div>
            )}

            {activeTab === 'explore' && (
              <div className="mb-8">
                <FuturisticSearchBar onSearch={handleSearch} isLoading={isLoading} />
              </div>
            )}

            {renderContent()}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;