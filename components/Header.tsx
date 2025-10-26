import React from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  isGuest?: boolean;
  onSignInClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, isGuest, onSignInClick, onLogout }) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-cyan-400/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
             <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="ml-3 text-xl font-bold text-slate-200 uppercase tracking-wider">Eden AI</span>
          </div>
          <div className="flex items-center">
            {isGuest ? (
              <button
                onClick={onSignInClick}
                className="px-4 py-2 text-sm font-medium text-slate-200 bg-slate-700/50 border border-cyan-400/50 rounded-md hover:bg-cyan-400/20 transition-colors"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center">
                <span className="hidden sm:block text-sm font-medium text-slate-300 mr-3">{user.name}</span>
                <img 
                  className="h-9 w-9 rounded-full object-cover border-2 border-slate-600 group-hover:border-cyan-400 transition" 
                  src={user.avatarUrl} 
                  alt="User avatar" 
                />
                <button
                  onClick={onLogout}
                  className="ml-4 px-3 py-2 text-xs font-medium text-slate-300 bg-transparent border border-slate-600 rounded-md hover:bg-slate-700/50 hover:border-slate-500 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;