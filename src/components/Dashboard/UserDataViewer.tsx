import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, GameFilmEvaluation, Note, DrillResult } from '../../types';
import { storageUtils } from '../../utils/storage';
import { drillLabels } from '../../utils/drillUtils';
import { 
  Database, 
  Search, 
  Users, 
  Video, 
  StickyNote, 
  Target,
  User as UserIcon,
  Award,
  MapPin,
  Calendar,
  FileText,
  BarChart3,
  TrendingUp,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  MinusCircle
} from 'lucide-react';

const UserDataViewer: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userEvaluations, setUserEvaluations] = useState<GameFilmEvaluation[]>([]);
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [userDrillResults, setUserDrillResults] = useState<DrillResult[]>([]);
  const [activeTab, setActiveTab] = useState<'evaluations' | 'notes' | 'drills'>('evaluations');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  useEffect(() => {
    if (selectedUser) {
      loadUserData(selectedUser.id);
    }
  }, [selectedUser]);

  const loadUsers = () => {
    const allUsers = storageUtils.getUsers()
      .filter(u => !u.isAdmin && !u.isEvaluator)
      .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
    setUsers(allUsers);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm.trim()) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const loadUserData = (userId: string) => {
    // Load evaluations for this user
    const evaluations = storageUtils.getUserGameFilmEvaluations(userId);
    setUserEvaluations(evaluations);

    // Load notes for this user
    const notes = storageUtils.getUserNotes(userId);
    setUserNotes(notes);

    // Load drill results for this user
    const drillResults = storageUtils.getUserDrillResults(userId);
    setUserDrillResults(drillResults);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'stands':
        return <MinusCircle className="w-4 h-4 text-yellow-600" />;
      case 'overturned':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getDrillStats = () => {
    if (userDrillResults.length === 0) return null;

    const confirmed = userDrillResults.filter(r => r.result === 'confirmed').length;
    const stands = userDrillResults.filter(r => r.result === 'stands').length;
    const overturned = userDrillResults.filter(r => r.result === 'overturned').length;
    const total = userDrillResults.length;

    return {
      confirmed,
      stands,
      overturned,
      total,
      confirmedPercentage: (confirmed / total) * 100,
      standsPercentage: (stands / total) * 100,
      overturnedPercentage: (overturned / total) * 100
    };
  };

  const getDrillStatsByType = () => {
    const drillTypes = Object.keys(drillLabels);
    const statsByType: Record<string, any> = {};
    
    drillTypes.forEach(drillType => {
      const drillResults = userDrillResults.filter(r => r.drillType === drillType);
      
      if (drillResults.length > 0) {
        const confirmed = drillResults.filter(r => r.result === 'confirmed').length;
        const stands = drillResults.filter(r => r.result === 'stands').length;
        const overturned = drillResults.filter(r => r.result === 'overturned').length;
        const total = drillResults.length;
        
        statsByType[drillType] = {
          confirmed,
          stands,
          overturned,
          total,
          confirmedPercentage: (confirmed / total) * 100,
          standsPercentage: (stands / total) * 100,
          overturnedPercentage: (overturned / total) * 100
        };
      }
    });
    
    return statsByType;
  };

  const toggleVideoPlayback = (noteId: string) => {
    setPlayingVideo(playingVideo === noteId ? null : noteId);
  };

  if (!user?.isEvaluator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-red-700">You do not have evaluator permissions to access this feature.</p>
        </div>
      </div>
    );
  }

  const drillStats = getDrillStats();
  const drillStatsByType = getDrillStatsByType();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* User Selection Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-6 sticky top-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-mlb-navy" />
            <h2 className="text-lg font-bold text-mlb-navy">Select User</h2>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`w-full p-3 text-left border rounded-lg transition-all duration-200 ${
                  selectedUser?.id === u.id
                    ? 'border-mlb-navy bg-mlb-navy/5 shadow-md'
                    : 'border-gray-200 hover:border-mlb-navy/50 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center">
                    {u.profilePhoto ? (
                      <img src={u.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-mlb-navy text-sm truncate">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      @{u.username}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {!selectedUser ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-12 text-center">
            <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500 mb-2">Select a User</h3>
            <p className="text-gray-400">Choose a user from the sidebar to view their training data</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Header */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center shadow-lg">
                  {selectedUser.profilePhoto ? (
                    <img src={selectedUser.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-mlb-navy">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <div className="flex items-center gap-3 text-gray-500">
                    <span>@{selectedUser.username}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{selectedUser.level}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedUser.location}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {selectedUser.email}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50/80 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-mlb-red">{userEvaluations.length}</div>
                  <div className="text-sm text-gray-500">Evaluations</div>
                </div>
                <div className="bg-gray-50/80 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-mlb-navy">{userNotes.length}</div>
                  <div className="text-sm text-gray-500">Personal Notes</div>
                </div>
                <div className="bg-gray-50/80 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{userDrillResults.length}</div>
                  <div className="text-sm text-gray-500">Drill Attempts</div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
              <div className="flex bg-gray-50/80 backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab('evaluations')}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all duration-200 ${
                    activeTab === 'evaluations'
                      ? 'bg-white text-mlb-navy shadow-lg border-b-2 border-mlb-navy'
                      : 'text-gray-600 hover:text-mlb-navy hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Video className="w-4 h-4" />
                    <span>Evaluations ({userEvaluations.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all duration-200 ${
                    activeTab === 'notes'
                      ? 'bg-white text-mlb-navy shadow-lg border-b-2 border-mlb-navy'
                      : 'text-gray-600 hover:text-mlb-navy hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    <span>Notes ({userNotes.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('drills')}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all duration-200 ${
                    activeTab === 'drills'
                      ? 'bg-white text-mlb-navy shadow-lg border-b-2 border-mlb-navy'
                      : 'text-gray-600 hover:text-mlb-navy hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>Drill Results ({userDrillResults.length})</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'evaluations' && (
                  <div className="space-y-4">
                    {userEvaluations.length > 0 ? (
                      userEvaluations.map(evaluation => (
                        <div key={evaluation.id} className="border border-gray-200/50 rounded-xl p-4 bg-gray-50/50">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-mlb-navy">{evaluation.playType}</h4>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <span>By {evaluation.evaluatorUsername}</span>
                                <span>•</span>
                                <span>{formatDate(new Date(evaluation.timestamp))}</span>
                                {evaluation.videoUrl && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1 text-mlb-red">
                                      <Video className="w-3 h-3" />
                                      <span>Video</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white/80 rounded-lg p-3 mb-3">
                            <p className="text-gray-700 text-sm leading-relaxed">{evaluation.notes}</p>
                          </div>
                          
                          {evaluation.videoUrl && (
                            <div className="flex justify-end">
                              <button
                                onClick={() => window.open(evaluation.videoUrl, '_blank')}
                                className="flex items-center gap-1 px-3 py-1 bg-mlb-red text-white rounded-lg hover:bg-mlb-red-dark transition-colors text-sm"
                              >
                                <Eye className="w-3 h-3" />
                                Watch Video
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No evaluations found</p>
                        <p className="text-gray-400 text-sm">This user hasn't received any evaluations yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    {userNotes.length > 0 ? (
                      userNotes.map(note => (
                        <div key={note.id} className="border border-gray-200/50 rounded-xl p-4 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <FileText className="w-4 h-4" />
                              <span>{formatDate(new Date(note.timestamp))}</span>
                              {note.videoFile && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1 text-mlb-red">
                                    <Video className="w-3 h-3" />
                                    <span>Video</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-white/80 rounded-lg p-3 mb-3">
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                          </div>
                          
                          {note.videoFile && (
                            <div className="space-y-2">
                              <button
                                onClick={() => toggleVideoPlayback(note.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-mlb-red text-white rounded-lg hover:bg-mlb-red-dark transition-colors text-sm"
                              >
                                <Play className="w-3 h-3" />
                                {playingVideo === note.id ? 'Hide Video' : 'View Video'}
                              </button>
                              
                              {playingVideo === note.id && (
                                <div className="bg-black rounded-lg overflow-hidden">
                                  <video
                                    src={note.videoFile}
                                    className="w-full max-h-64 object-contain"
                                    controls
                                    autoPlay
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No personal notes found</p>
                        <p className="text-gray-400 text-sm">This user hasn't created any personal notes yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'drills' && (
                  <div className="space-y-6">
                    {drillStats && (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <BarChart3 className="w-6 h-6 text-mlb-navy" />
                          <h3 className="text-lg font-bold text-mlb-navy">Overall Performance</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white/80 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-mlb-navy">{drillStats.total}</div>
                            <div className="text-sm text-gray-500">Total Attempts</div>
                          </div>
                          <div className="bg-white/80 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{drillStats.confirmedPercentage.toFixed(1)}%</div>
                            <div className="text-sm text-gray-500">Confirmed</div>
                          </div>
                          <div className="bg-white/80 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{drillStats.standsPercentage.toFixed(1)}%</div>
                            <div className="text-sm text-gray-500">Stands</div>
                          </div>
                          <div className="bg-white/80 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{drillStats.overturnedPercentage.toFixed(1)}%</div>
                            <div className="text-sm text-gray-500">Overturned</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {Object.keys(drillStatsByType).length > 0 ? (
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <Target className="w-6 h-6 text-mlb-navy" />
                          <h3 className="text-lg font-bold text-mlb-navy">Performance by Drill Type</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(drillStatsByType).map(([drillType, stats]) => (
                            <div key={drillType} className="border border-gray-200/50 rounded-xl p-6 bg-gray-50/50">
                              <div className="flex items-center gap-3 mb-4">
                                <Target className="w-5 h-5 text-mlb-navy" />
                                <h4 className="font-bold text-mlb-navy">
                                  {drillLabels[drillType as keyof typeof drillLabels] || drillType}
                                </h4>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white/80 rounded-lg p-3 text-center">
                                  <div className="text-lg font-bold text-mlb-navy">{stats.total}</div>
                                  <div className="text-xs text-gray-500">Total</div>
                                </div>
                                <div className="bg-white/80 rounded-lg p-3 text-center">
                                  <div className="text-lg font-bold text-green-600">{stats.confirmedPercentage.toFixed(1)}%</div>
                                  <div className="text-xs text-gray-500">Confirmed</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/80 rounded-lg p-3 text-center">
                                  <div className="text-lg font-bold text-yellow-600">{stats.standsPercentage.toFixed(1)}%</div>
                                  <div className="text-xs text-gray-500">Stands</div>
                                </div>
                                <div className="bg-white/80 rounded-lg p-3 text-center">
                                  <div className="text-lg font-bold text-red-600">{stats.overturnedPercentage.toFixed(1)}%</div>
                                  <div className="text-xs text-gray-500">Overturned</div>
                                </div>
                              </div>
                              
                              {/* Performance bar */}
                              <div className="mt-4">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Performance Distribution</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div className="h-full flex">
                                    <div 
                                      className="bg-green-500" 
                                      style={{ width: `${stats.confirmedPercentage}%` }}
                                    ></div>
                                    <div 
                                      className="bg-yellow-500" 
                                      style={{ width: `${stats.standsPercentage}%` }}
                                    ></div>
                                    <div 
                                      className="bg-red-500" 
                                      style={{ width: `${stats.overturnedPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No drill results found</p>
                        <p className="text-gray-400 text-sm">This user hasn't completed any training drills yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDataViewer;