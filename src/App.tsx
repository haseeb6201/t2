import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import Navigation from './components/Navigation/Navigation';
import UserDashboard from './components/Dashboard/UserDashboard';
import Leaderboard from './components/Leaderboard/Leaderboard';
import UserProfile from './components/Dashboard/UserProfile';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'leaderboard' | 'profile'>('dashboard');
  
  // Check if we're on the reset password page
  const isResetPasswordPage = window.location.pathname === '/reset-password' || 
                            window.location.hash.includes('#/reset-password') ||
                            window.location.search.includes('type=recovery');

  // Show reset password page if we're in recovery mode
  if (isResetPasswordPage) {
    return <ResetPasswordPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-mlb-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-mlb-navy font-medium">Loading application...</p>
          <p className="text-gray-500 text-sm mt-2">Connecting to server...</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm bg-mlb-navy text-white rounded-lg hover:bg-mlb-navy-light transition-colors"
          >
            Reload if stuck
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      <main className="relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-mlb-red/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-mlb-navy/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 py-8">
          {currentView === 'dashboard' && (
            <UserDashboard />
          )}
          {currentView === 'leaderboard' && (
            <Leaderboard />
          )}
          {currentView === 'profile' && (
            <UserProfile />
          )}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;