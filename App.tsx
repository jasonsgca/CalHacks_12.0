import React, { useState, useCallback } from 'react';
import LoginModal from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { UserProfile } from './types';
import { GUEST_PROFILE } from './constants';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>(GUEST_PROFILE);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogin = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setIsLoginModalOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    setUserProfile(GUEST_PROFILE);
  }, []);
  
  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  return (
    <div className="min-h-screen antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Dashboard user={userProfile} onSignInClick={openLoginModal} onLogout={handleLogout} />
      {isLoginModalOpen && (
        <LoginModal onLogin={handleLogin} onClose={closeLoginModal} />
      )}
    </div>
  );
};

export default App;