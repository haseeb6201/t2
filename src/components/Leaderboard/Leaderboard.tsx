import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserStats, DrillType } from '../../types';
import { getLeaderboard, getDrillLeaderboard, getDrillLast20Leaderboard, drillLabels } from '../../utils/drillUtils';
import DrillLeaderboard from './DrillLeaderboard';
import { Trophy, Medal, Award, User, TrendingUp, BarChart3 } from 'lucide-react';

const drillTypes: DrillType[] = [
  'audio_force_play',
  'force_play_replay',
  'check_swing',
  'check_swing_middle',
  'pick_off_1b',
  'steal_2b',
  'steal_3b',
  'fair_foul',
  'play_at_plate',
  'plays_at_1b_advanced',
  'force_plays_middle'
];

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);
  const [drillLeaderboards, setDrillLeaderboards] = useState<Record<DrillType, UserStats[]>>({} as any);
  const [drillLast20Leaderboards, setDrillLast20Leaderboards] = useState<Record<DrillType, UserStats[]>>({} as any);
  const [userOverallStats, setUserOverallStats] = useState<UserStats | null>(null);
  const [userDrillStats, setUserDrillStats] = useState<Record<DrillType, any>>({} as any);
  const [activeTab, setActiveTab] = useState<'overall' | 'drills'>('overall');

  useEffect(() => {
    const stats = getLeaderboard();
    setLeaderboard(stats);
    
    // Get current user's overall stats
    if (user) {
      const currentUserStats = stats.find(s => s.userId === user.id);
      if (currentUserStats) {
        setUserOverallStats(currentUserStats);
      } else {
        // User has no drill results yet, create empty stats
        setUserOverallStats({
          userId: user.id,
          username: user.username,
          level: user.level,
          location: user.location,
          city: user.city,
          state: user.state,
          profilePhoto: user.profilePhoto,
          totalConfirmed: 0,
          totalAttempts: 0,
          confirmedPercentage: 0
        } as any);
      }
    }
    
    const drillStats: Record<DrillType, UserStats[]> = {} as any;
    const drillLast20Stats: Record<DrillType, UserStats[]> = {} as any;
    const userDrillStatsTemp: Record<DrillType, any> = {} as any;
    
    drillTypes.forEach(drillType => {
      drillStats[drillType] = getDrillLeaderboard(drillType);
      drillLast20Stats[drillType] = getDrillLast20Leaderboard(drillType);
      
      // Get current user's drill-specific stats
      if (user) {
        const userDrillStat = drillStats[drillType].find(s => s.userId === user.id);
        const userDrillLast20Stat = drillLast20Stats[drillType].find(s => s.userId === user.id);
        
        userDrillStatsTemp[drillType] = {
          overall: userDrillStat || {
            userId: user.id,
            username: user.username,
            level: user.level,
            location: user.location,
            city: user.city,
            state: user.state,
            profilePhoto: user.profilePhoto,
            totalConfirmed: 0,
            totalAttempts: 0,
            confirmedPercentage: 0
          },
          last20: userDrillLast20Stat || {
            userId: user.id,
            username: user.username,
            level: user.level,
            location: user.location,
            city: user.city,
            state: user.state,
            profilePhoto: user.profilePhoto,
            totalConfirmed: 0,
            totalAttempts: 0,
            confirmedPercentage: 0,
            last20Confirmed: 0,
            last20Attempts: 0,
            last20ConfirmedPercentage: 0
          }
        };
      }
    });
    
    setDrillLeaderboards(drillStats);
    setDrillLast20Leaderboards(drillLast20Stats);
    setUserDrillStats(userDrillStatsTemp);
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">{rank}</span>;
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

  const getUserRank = (userStats: UserStats, leaderboardData: UserStats[]): number => {
    const rank = leaderboardData.findIndex(stats => stats.userId === userStats.userId);
    return rank === -1 ? leaderboardData.length + 1 : rank + 1;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl bg-white">
            <img src="/EL1_Logo.png" alt="EL Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent">Leaderboard</h1>
        </div>
        <p className="text-gray-500 text-lg font-medium">Top performers across all training drills</p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 bg-gray-100/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50">
          <button
            onClick={() => setActiveTab('overall')}
            className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'overall'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            Overall Rankings
          </button>
          <button
            onClick={() => setActiveTab('drills')}
            className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'drills'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            Drill Rankings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* User Comparison Panel */}
        {user && userOverallStats && activeTab === 'overall' && (
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-mlb-red to-mlb-red-dark px-6 py-4">
                <h3 className="text-sm font-bold text-white">Your Performance</h3>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center shadow-md">
                    {userOverallStats.profilePhoto ? (
                      <img
                        src={userOverallStats.profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {userOverallStats.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-mlb-navy text-sm">{userOverallStats.username}</h4>
                      <span className="text-xs font-bold text-white bg-mlb-navy px-2 py-0.5 rounded-full">
                        {userOverallStats.totalAttempts > 0 ? `#${getUserRank(userOverallStats, leaderboard)}` : 'Unranked'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>{(userOverallStats as any).level}</span>
                      <span>•</span>
                      <span>{(userOverallStats as any).location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-gray-50/80 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-medium text-gray-700">Confirmed</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                      {userOverallStats.confirmedPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {userOverallStats.totalConfirmed} of {userOverallStats.totalAttempts} calls
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/80 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3 text-mlb-navy" />
                        <span className="text-xs font-medium text-gray-700">Attempts</span>
                      </div>
                      <div className="text-lg font-bold text-mlb-navy">
                      {userOverallStats.totalAttempts}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Across all drills
                    </div>
                  </div>
                  
                  {userOverallStats.totalAttempts === 0 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500 mb-1">No training data yet</p>
                      <p className="text-xs text-gray-400">Complete some drills to see your stats!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={activeTab === 'overall' && user ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {activeTab === 'overall' ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-mlb-navy to-mlb-navy-light px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Overall Top Performers</h2>
                <p className="text-gray-200 text-sm font-medium">Based on confirmed call percentage across all drills</p>
              </div>
              
            {leaderboard.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-xl font-semibold">No training data available yet</p>
                <p className="text-gray-400 font-medium">Start training to see the leaderboard!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaderboard.map((user, index) => (
                  <div
                    key={user.userId}
                    className={`p-8 flex items-center gap-6 hover:bg-gray-50/50 transition-all duration-200 ${
                      index < 3 ? 'bg-gradient-to-r from-gray-50/50 to-white/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${getRankBadge(index + 1)}`}>
                        {getRankIcon(index + 1)}
                      </div>
                      
                      {/* User Avatar */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center shadow-md">
                        {(user as any).profilePhoto ? (
                          <img
                            src={(user as any).profilePhoto}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-mlb-navy text-lg">{user.username}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                          <span>{user.level}</span>
                          <span>•</span>
                          <span>{user.location}</span>
                          <span>•</span>
                          <span>{user.totalAttempts} attempts</span>
                        </div>
                        {(user as any).city && (
                          <p className="text-xs text-gray-400 mt-1">📍 {(user as any).city}{(user as any).state && `, ${(user as any).state}`}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">
                        {user.confirmedPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500 font-medium">
                        {user.totalConfirmed} confirmed calls
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {drillTypes.map(drillType => (
                <div key={drillType} className="space-y-6">
                  {/* User Comparison for this drill */}
                  {user && userDrillStats[drillType] && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
                      <div className="bg-gradient-to-r from-mlb-red to-mlb-red-dark px-3 py-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">Your {drillLabels[drillType]} Stats</h4>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white">{userDrillStats[drillType].overall.username}</span>
                            <span className="text-xs font-bold text-white bg-white/20 px-1.5 py-0.5 rounded-full leading-none">
                              {userDrillStats[drillType].overall.totalAttempts > 0 
                                ? `#${getUserRank(userDrillStats[drillType].overall, drillLeaderboards[drillType])}`
                                : 'Unranked'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-md overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center">
                            {userDrillStats[drillType].overall.profilePhoto ? (
                              <img
                                src={userDrillStats[drillType].overall.profilePhoto}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold text-xs leading-none">
                                {userDrillStats[drillType].overall.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-xs text-gray-500 font-medium">Performance Overview</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1">
                            <div className="bg-gray-50/80 rounded-md p-2 text-center">
                              <div className="text-xs text-gray-500">Total %</div>
                              <div className="text-xs font-bold text-green-600">
                                {userDrillStats[drillType].overall.confirmedPercentage.toFixed(1)}%
                              </div>
                            </div>
                            <div className="bg-gray-50/80 rounded-md p-2 text-center">
                              <div className="text-xs text-gray-500">Last 20 %</div>
                              <div className="text-xs font-bold text-green-600">
                                {userDrillStats[drillType].last20.last20ConfirmedPercentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-center text-xs text-gray-400">
                            {userDrillStats[drillType].overall.totalAttempts} total attempts
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Drill Leaderboard */}
                  <DrillLeaderboard
                    drillType={drillType}
                    leaderboard={drillLeaderboards[drillType] || []}
                    last20Leaderboard={drillLast20Leaderboards[drillType] || []}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-gray-50/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50">
        <h3 className="font-bold text-mlb-navy mb-3 text-lg">How Rankings Work</h3>
        <p className="text-gray-700 text-sm font-medium leading-relaxed">
          {activeTab === 'overall' 
            ? 'Overall rankings are based on the percentage of confirmed calls across all training drills combined.'
            : 'Drill rankings show the top performers for each specific drill type based on confirmed call percentage.'
          } Only users with at least one training attempt are included in the rankings.
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;