import React from 'react';
import Icon from './Icon';

interface ApiKeyScreenProps {
  onKeySelect: () => void;
}

declare const window: {
  aistudio?: {
    openSelectKey: () => Promise<void>;
  }
} & Window;

const ApiKeyScreen: React.FC<ApiKeyScreenProps> = ({ onKeySelect }) => {
  const handleSelectKey = async () => {
    // Assuming window.aistudio is available based on App.tsx logic
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      onKeySelect(); // Assume success to handle race condition
    } else {
      alert("API key selection feature is not available in this environment.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800/50 backdrop-blur-sm border border-cyan-400/30 rounded-lg text-center">
        <Icon name="key" className="w-16 h-16 text-cyan-400 mx-auto" />
        <h1 className="mt-4 text-3xl font-bold text-slate-100 text-glow">Gemini API Key Required</h1>
        <p className="mt-2 text-slate-300">
          To use Eden AI, you need to select your Gemini API key. Your key is stored securely and only used to communicate with the Gemini API.
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full mt-6 flex items-center justify-center py-3 px-4 bg-cyan-500/20 border border-cyan-500/80 rounded-md text-base font-medium text-cyan-200 hover:bg-cyan-400/30 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          Select Gemini API Key
        </button>
      </div>
    </div>
  );
};

export default ApiKeyScreen;