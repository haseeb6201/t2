import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import EvaluatorDashboard from './EvaluatorDashboard';
import DrillSessionManager from './DrillSessionManager';
import DrillAnalytics from './DrillAnalytics';
import NotesSection from './NotesSection';
import GameFilmSection from './GameFilmSection';
import { Activity } from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'training' | 'analytics' | 'notes' | 'gamefilm'>('training');

  if (!user) return null;

  // Show admin dashboard for admin users
  if (user.isAdmin) {

    return <AdminDashboard />;
  }

  // Show evaluator dashboard for evaluator users
  if (user.isEvaluator) {
    return <EvaluatorDashboard />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-2 bg-gray-100/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50">
          <button
            onClick={() => setActiveTab('training')}
            className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'training'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            Training
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'notes'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('gamefilm')}
            className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'gamefilm'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            Game Film
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'training' && <DrillSessionManager />}
        {activeTab === 'analytics' && <DrillAnalytics />}
        {activeTab === 'notes' && <NotesSection />}
        {activeTab === 'gamefilm' && <GameFilmSection />}
      </div>
    </div>
  );
};

export default UserDashboard;