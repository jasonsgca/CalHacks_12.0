import React, { useState, useEffect } from 'react';
import { FRANCESCA_PROFILE, GUEST_PROFILE } from '../constants';
import { UserProfile } from '../types';

interface LoginModalProps {
  onLogin: (profile: UserProfile) => void;
  onClose: () => void;
}

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.92C34.343 4.943 28.361 2 22 2C9.855 2 0 11.855 0 24s9.855 22 22 22s22-9.855 22-22c0-1.341-.138-2.65-.389-3.917z"></path>
    <path fill="#FF3D00" d="M6.306 14.691c-1.229 2.22-1.991 4.773-1.991 7.439c0 2.666.762 5.218 1.991 7.439l-5.021 3.868C.043 30.69 0 27.424 0 24s.043-6.69 1.285-9.619l5.021 3.31z"></path>
    <path fill="#4CAF50" d="M24 48c5.166 0 9.86-1.977 13.409-5.192l-6.19-4.82c-1.746 1.16-3.956 1.851-6.219 1.851c-4.864 0-8.996-3.08-10.463-7.252l-6.338 4.954C7.03 44.438 14.862 48 24 48z"></path>
    <path fill="#1976D2" d="M43.611 20.083H24v8h19.611c-.345 2.734-1.457 5.176-3.333 7.024l6.19 4.821C47.125 35.72 48 30.138 48 24c0-3.882-.587-7.618-1.636-11.026l-6.521 5.031c.959 1.944 1.521 4.113 1.521 6.482z"></path>
  </svg>
);

const Spinner: React.FC<{ size?: string }> = ({ size = 'w-5 h-5' }) => (
    <svg className={`animate-spin text-white ${size}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [view, setView] = useState<'login' | 'create' | 'google-signin' | 'google-permission'>('login');
  const [formData, setFormData] = useState({
    name: '',
    jobTitle: '',
    location: '',
    workHours: '40-50',
    preferences: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (view === 'google-signin' && !isProcessing) {
      setIsProcessing(true);
      setTimeout(() => {
        setView('google-permission');
        setIsProcessing(false);
      }, 1500);
    }
    if (view === 'google-permission' && !isProcessing) {
      setIsProcessing(true);
      setTimeout(() => {
        onLogin(FRANCESCA_PROFILE);
      }, 2000);
    }
  }, [view, isProcessing, onLogin]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const capitalizeName = (name: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.jobTitle || !formData.location) return;

    const newProfile: UserProfile = {
      name: capitalizeName(formData.name),
      jobTitle: formData.jobTitle,
      company: "N/A", // Not collected in this simple form
      location: formData.location,
      workHours: `${formData.workHours} hours/week`,
      commute: "N/A",
      eatingHabits: "N/A",
      calendarSummary: "Busy schedule.",
      searchHistory: [],
      preferences: formData.preferences.split(',').map(p => p.trim()).filter(p => p),
      avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(formData.name)}/200/200`,
    };
    onLogin(newProfile);
  };
  
  const renderGoogleSignIn = () => (
    <div className="animate-fade-in text-center">
      <GoogleIcon />
      <h2 className="text-2xl font-bold text-slate-100 mt-4">Sign in</h2>
      <p className="text-slate-400 mt-2">to continue to Eden AI</p>
      <div className="mt-6 p-4 border border-slate-600 rounded-lg text-left space-y-4">
        <input type="email" value="francesca.rossi@example.com" readOnly className="w-full p-2 border border-slate-500 bg-slate-700 text-slate-300 rounded-md" />
        <input type="password" value="***********" readOnly className="w-full p-2 border border-slate-500 bg-slate-700 text-slate-300 rounded-md" />
        <button className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 rounded-md text-base font-medium text-white hover:bg-blue-700 transition-all duration-200">
          {isProcessing ? <Spinner /> : 'Next'}
        </button>
      </div>
       <p className="text-xs text-slate-500 pt-4 tracking-wide text-center">This is a simulated sign-in for demo purposes.</p>
    </div>
  );

  const renderGooglePermission = () => (
    <div className="animate-fade-in text-center">
        <h1 className="mt-4 text-4xl font-bold text-slate-100 text-glow uppercase tracking-wider">Eden AI</h1>
        <h2 className="text-2xl font-bold text-slate-200 mt-6">Eden AI wants to access your Google Account</h2>
        <div className="mt-6 p-4 border border-slate-600 rounded-lg text-left flex items-center gap-4">
            <img src={FRANCESCA_PROFILE.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full" />
            <div>
                <p className="font-medium text-slate-200">{FRANCESCA_PROFILE.name}</p>
                <p className="text-sm text-slate-400">francesca.rossi@example.com</p>
            </div>
        </div>
        <p className="text-sm text-slate-400 mt-6 text-left">
            This will allow Eden AI to: <br/>
            <span className="text-slate-300 font-medium ml-2">- See your basic profile info (name, email, profile picture)</span>
        </p>
        <p className="text-xs text-slate-500 mt-6 text-left">
            Make sure you trust Eden AI. You can see its privacy policy and terms of service.
        </p>
        <div className="mt-8 flex justify-end gap-4">
            <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-blue-400 rounded-md hover:bg-blue-400/10">Cancel</button>
            <button className="px-6 py-2 flex items-center justify-center bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                {isProcessing ? <Spinner /> : 'Allow'}
            </button>
        </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <svg className="w-16 h-16 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h1 className="mt-4 text-4xl font-bold text-slate-100 text-glow uppercase tracking-wider">Eden AI</h1>
        <p className="mt-2 text-cyan-300/80">Personalize Your Journey</p>
      </div>

      <p className="text-center text-slate-300">
        Sign in to provide Eden AI with your travel preferences for tailored recommendations.
      </p>

      <div className="space-y-4">
        <div>
            <button
                onClick={() => setView('google-signin')}
                className="w-full flex items-center justify-center py-3 px-4 bg-slate-700/50 border border-cyan-400/50 rounded-md text-base font-medium text-slate-200 hover:bg-cyan-400/20 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-200 ease-in-out transform hover:scale-105"
            >
                <GoogleIcon />
                Sign in with Google
            </button>
            <p className="text-xs text-slate-500 pt-2 tracking-wide text-center">Simulated auth. This will use the demo profile.</p>
        </div>
        
        <button 
          onClick={() => setView('create')}
          className="w-full flex items-center justify-center py-3 px-4 bg-transparent border border-slate-600 rounded-md text-base font-medium text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-200"
        >
          Create Profile
        </button>
      </div>
      
      <div className="text-center">
        <button 
          onClick={() => onLogin(GUEST_PROFILE)}
          className="font-medium text-cyan-400 hover:text-cyan-200 hover:underline transition-colors duration-200"
        >
          use Eden AI without profile
        </button>
      </div>
    </div>
  );
  
  const renderCreateForm = () => (
    <div className="animate-fade-in">
        <button onClick={() => setView('login')} className="flex items-center text-sm text-cyan-300 hover:text-cyan-100 mb-6 group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Back to login
        </button>
        <h2 className="text-2xl font-bold text-slate-100 text-center mb-1">Create Your Profile</h2>
        <p className="text-slate-400 text-center text-sm mb-6">Tell us about yourself for personalized recommendations.</p>
        <form onSubmit={handleCreateProfile} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="w-full p-2 border border-slate-600 focus:border-cyan-400 focus:ring-cyan-400 bg-slate-900 text-slate-200 rounded-md" />
            </div>
            <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-400 mb-1">Job Title</label>
                <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleInputChange} required className="w-full p-2 border border-slate-600 focus:border-cyan-400 focus:ring-cyan-400 bg-slate-900 text-slate-200 rounded-md" />
            </div>
            <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-400 mb-1">Location (e.g. San Francisco, CA)</label>
                <input type="text" name="location" id="location" value={formData.location} onChange={handleInputChange} required className="w-full p-2 border border-slate-600 focus:border-cyan-400 focus:ring-cyan-400 bg-slate-900 text-slate-200 rounded-md" />
            </div>
            <div>
                <label htmlFor="workHours" className="block text-sm font-medium text-slate-400 mb-1">Average Weekly Work Hours</label>
                <select name="workHours" id="workHours" value={formData.workHours} onChange={handleInputChange} className="w-full p-2 border border-slate-600 focus:border-cyan-400 focus:ring-cyan-400 bg-slate-900 text-slate-200 rounded-md">
                    <option value="<40">&lt;40</option>
                    <option value="40-50">40-50</option>
                    <option value="50-60">50-60</option>
                    <option value="60-80">60-80</option>
                    <option value=">80">&gt;80</option>
                </select>
            </div>
            <div>
                <label htmlFor="preferences" className="block text-sm font-medium text-slate-400 mb-1">Hobbies & Interests</label>
                <textarea name="preferences" id="preferences" value={formData.preferences} onChange={handleInputChange} placeholder="e.g. Hiking, Yoga, Good food" rows={3} className="w-full p-2 border border-slate-600 focus:border-cyan-400 focus:ring-cyan-400 bg-slate-900 text-slate-200 rounded-md"></textarea>
                <p className="text-xs text-slate-500 mt-1">Separate with commas.</p>
            </div>
            <button type="submit" className="w-full flex items-center justify-center py-3 px-4 bg-cyan-500/20 border border-cyan-500/80 rounded-md text-base font-medium text-cyan-200 hover:bg-cyan-400/30 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-200">
                Create & Start Exploring
            </button>
        </form>
    </div>
  );

  const renderContent = () => {
    switch(view) {
        case 'login':
            return renderLoginForm();
        case 'create':
            return renderCreateForm();
        case 'google-signin':
            return renderGoogleSignIn();
        case 'google-permission':
            return renderGooglePermission();
        default:
            return renderLoginForm();
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-8 bg-slate-800/50 border border-cyan-400/30 rounded-lg relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors z-10" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default LoginModal;