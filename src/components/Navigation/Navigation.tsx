import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, Trophy, LogOut, User, Menu, X } from 'lucide-react';

interface NavigationProps {
  currentView: 'dashboard' | 'leaderboard' | 'profile';
  onViewChange: (view: 'dashboard' | 'leaderboard' | 'profile') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white/95 backdrop-blur-xl shadow-2xl border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl bg-white">
                  <img src="/EL1_Logo.png" alt="EL Logo" className="w-10 h-10 object-contain" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-mlb-red rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent">
                  Umpire Performance
                </h1>
                <p className="text-xs text-gray-500 font-medium">Elite Training Platform</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              <div className="flex bg-gray-100/80 backdrop-blur-sm rounded-2xl p-2 shadow-inner">
                <button
                  onClick={() => onViewChange('dashboard')}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    currentView === 'dashboard'
                      ? 'bg-white text-mlb-navy shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-mlb-navy hover:bg-white/50'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                  Dashboard
                </button>
                
                <button
                  onClick={() => onViewChange('leaderboard')}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    currentView === 'leaderboard'
                      ? 'bg-white text-mlb-navy shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-mlb-navy hover:bg-white/50'
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </button>
                
                <button
                  onClick={() => onViewChange('profile')}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    currentView === 'profile'
                      ? 'bg-white text-mlb-navy shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-mlb-navy hover:bg-white/50'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Profile
                </button>
              </div>
            </div>
          </div>
          
          {/* Right side - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            {/* User Profile Card */}
            <div className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl px-6 py-3 shadow-lg border border-gray-200/50">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center shadow-lg">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-left">
                <div className="font-bold text-mlb-navy text-sm">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-gray-500 font-medium">@{user?.username}</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-mlb-red hover:bg-mlb-red/10 rounded-xl font-semibold transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:text-mlb-navy hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50">
          <div className="px-4 py-6 space-y-4">
            {/* User info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <div className="font-semibold text-mlb-navy">{user?.firstName} {user?.lastName}</div>
                <div className="text-sm text-gray-500">@{user?.username}</div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  onViewChange('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  currentView === 'dashboard'
                    ? 'bg-mlb-navy text-white'
                    : 'text-gray-600 hover:text-mlb-navy hover:bg-mlb-navy/10'
                }`}
              >
                <Activity className="w-5 h-5" />
                Dashboard
              </button>
              
              <button
                onClick={() => {
                  onViewChange('leaderboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  currentView === 'leaderboard'
                    ? 'bg-mlb-navy text-white'
                    : 'text-gray-600 hover:text-mlb-navy hover:bg-mlb-navy/10'
                }`}
              >
                <Trophy className="w-5 h-5" />
                Leaderboard
              </button>
              
              <button
                onClick={() => {
                  onViewChange('profile');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  currentView === 'profile'
                    ? 'bg-mlb-navy text-white'
                    : 'text-gray-600 hover:text-mlb-navy hover:bg-mlb-navy/10'
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </button>
            </div>

            {/* Sign out button */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-mlb-red hover:bg-mlb-red/10 rounded-xl font-semibold transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;