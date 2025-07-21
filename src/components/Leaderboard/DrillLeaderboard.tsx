import React, { useState } from 'react';
import { DrillType, UserStats } from '../../types';
import { drillLabels } from '../../utils/drillUtils';
import { Trophy, Medal, Award } from 'lucide-react';

interface DrillLeaderboardProps {
  drillType: DrillType;
  leaderboard: UserStats[];
  last20Leaderboard: UserStats[];
}

const DrillLeaderboard: React.FC<DrillLeaderboardProps> = ({ drillType, leaderboard, last20Leaderboard }) => {
  const [activeTab, setActiveTab] = useState<'total' | 'last20'>('total');
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-gray-600 font-bold text-sm">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gradient-to-r from-blue-400 to-blue-600';
    }
  };

  const currentLeaderboard = activeTab === 'total' ? leaderboard : last20Leaderboard;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
      <div className="bg-gradient-to-r from-mlb-navy to-mlb-navy-light px-6 py-5">
        <h3 className="text-lg font-bold text-white">{drillLabels[drillType]}</h3>
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-gray-50/80 backdrop-blur-sm px-6 py-3 border-b border-gray-200/50">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('total')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === 'total'
                ? 'bg-mlb-navy text-white shadow-md'
                : 'text-gray-600 hover:text-mlb-navy hover:bg-mlb-navy/10'
            }`}
          >
            Total %
          </button>
          <button
            onClick={() => setActiveTab('last20')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === 'last20'
                ? 'bg-mlb-navy text-white shadow-md'
                : 'text-gray-600 hover:text-mlb-navy hover:bg-mlb-navy/10'
            }`}
          >
            Last 20 %
          </button>
        </div>
      </div>
      
      {currentLeaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No data available</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {currentLeaderboard.map((user, index) => (
            <div
              key={user.userId}
              className={`p-5 flex items-center gap-4 hover:bg-gray-50/50 transition-all duration-200 ${
                index < 3 ? 'bg-gradient-to-r from-gray-50/50 to-white/50' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${getRankBadge(index + 1)}`}>
                {getRankIcon(index + 1)}
              </div>
              
              {/* User Avatar */}
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center shadow-sm">
                {(user as any).profilePhoto ? (
                  <img
                    src={(user as any).profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xs">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-mlb-navy truncate">{user.username}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <span>{(user as any).level}</span>
                  <span>•</span>
                  <span>{(user as any).location}</span>
                </div>
                {(user as any).hometown && (
                  <p className="text-xs text-gray-400 truncate">📍 {(user as any).city}{(user as any).state && `, ${(user as any).state}`}</p>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {(activeTab === 'total' ? user.confirmedPercentage : (user as any).last20ConfirmedPercentage).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {activeTab === 'total' ? user.totalConfirmed : (user as any).last20Confirmed} confirmed
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DrillLeaderboard;