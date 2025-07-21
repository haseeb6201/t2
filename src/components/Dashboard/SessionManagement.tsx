import React, { useState, useEffect } from 'react';
import { DrillResult, DrillSession, User, DrillType, ResultType } from '../../types';
import { storageUtils } from '../../utils/storage';
import { drillLabels } from '../../utils/drillUtils';
import { 
  Clock, 
  User as UserIcon, 
  Edit3, 
  Save, 
  X, 
  Search, 
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  MinusCircle,
  FileText,
  BarChart3,
  Target,
  TrendingUp
} from 'lucide-react';

interface SessionManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const SessionManagement: React.FC<SessionManagementProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<DrillSession[]>([]);
  const [drillResults, setDrillResults] = useState<DrillResult[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<DrillSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<DrillSession | null>(null);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingResult, setEditingResult] = useState<ResultType>('confirmed');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [drillFilter, setDrillFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const drillTypes: DrillType[] = [
    'audio_force_play',
    'force_play_replay',
    'check_swing',
    'check_swing_middle',
    'pick_off_1b',
    'steal_2b',
    'steal_3b',
    'fair_foul',
    'play_at_plate'
  ];

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchTerm, drillFilter, userFilter, dateFilter]);

  const loadData = () => {
    const allSessions = storageUtils.getSessionHistory();
    const allResults = storageUtils.getDrillResults();
    const allUsers = storageUtils.getUsers();
    
    setSessions(allSessions);
    setDrillResults(allResults);
    setUsers(allUsers);
  };

  const filterSessions = () => {
    let filtered = sessions;

    // Search filter
    if (searchTerm.trim()) {
      const userMap = new Map(users.map(user => [user.id, user]));
      filtered = filtered.filter(session => {
        const user = userMap.get(session.userId);
        return user && (
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          drillLabels[session.drillType].toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Drill filter
    if (drillFilter !== 'all') {
      filtered = filtered.filter(session => session.drillType === drillFilter);
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(session => session.userId === userFilter);
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate.toDateString() === filterDate.toDateString();
      });
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    setFilteredSessions(filtered);
  };

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName} (@${user.username})` : 'Unknown User';
  };

  const getUser = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
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

  const formatDuration = (start: Date, end?: Date) => {
    if (!end) return 'In Progress';
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getResultIcon = (result: ResultType) => {
    switch (result) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'stands':
        return <MinusCircle className="w-4 h-4 text-yellow-600" />;
      case 'overturned':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getResultColor = (result: ResultType) => {
    switch (result) {
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'stands':
        return 'text-yellow-600 bg-yellow-50';
      case 'overturned':
        return 'text-red-600 bg-red-50';
    }
  };

  const handleEditResult = (sessionId: string, resultIndex: number, currentResult: ResultType) => {
    setEditingResultId(`${sessionId}-${resultIndex}`);
    setEditingResult(currentResult);
  };

  const handleSaveResult = (sessionId: string, resultIndex: number) => {
    // Update the session results
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        const newResults = [...session.results];
        newResults[resultIndex] = editingResult;
        return { ...session, results: newResults };
      }
      return session;
    });

    // Update session history
    const sessionToUpdate = updatedSessions.find(s => s.id === sessionId);
    if (sessionToUpdate) {
      // Save updated session to history
      const allSessions = storageUtils.getSessionHistory();
      const updatedAllSessions = allSessions.map(s => 
        s.id === sessionId ? sessionToUpdate : s
      );
      localStorage.setItem('baseball_umpire_session_history', JSON.stringify(updatedAllSessions));

      // Update individual drill results
      const sessionResults = drillResults.filter(r => r.sessionId === sessionId);
      if (sessionResults.length > 0 && sessionResults[resultIndex]) {
        const resultToUpdate = sessionResults[resultIndex];
        const updatedDrillResults = drillResults.map(result => 
          result.id === resultToUpdate.id 
            ? { ...result, result: editingResult }
            : result
        );
        storageUtils.saveDrillResults(updatedDrillResults);
      }
    }

    setSessions(updatedSessions);
    setEditingResultId(null);
    loadData(); // Reload to ensure consistency
  };

  const handleCancelEdit = () => {
    setEditingResultId(null);
  };

  const getSessionStats = (session: DrillSession) => {
    const confirmed = session.results.filter(r => r === 'confirmed').length;
    const stands = session.results.filter(r => r === 'stands').length;
    const overturned = session.results.filter(r => r === 'overturned').length;
    const total = session.results.length;

    return {
      confirmed,
      stands,
      overturned,
      total,
      confirmedPercentage: total > 0 ? (confirmed / total) * 100 : 0
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-mlb-navy to-mlb-navy-light px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Session Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!selectedSession ? (
            <>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
                    />
                  </div>

                  {/* Drill Filter */}
                  <select
                    value={drillFilter}
                    onChange={(e) => setDrillFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
                  >
                    <option value="all">All Drills</option>
                    {drillTypes.map(drillType => (
                      <option key={drillType} value={drillType}>
                        {drillLabels[drillType]}
                      </option>
                    ))}
                  </select>

                  {/* User Filter */}
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
                  >
                    <option value="all">All Members</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} (@{user.username})
                      </option>
                    ))}
                  </select>

                  {/* Date Filter */}
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-mlb-navy">{filteredSessions.length}</div>
                    <div className="text-sm text-gray-500">Total Sessions</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredSessions.reduce((sum, session) => sum + session.results.filter(r => r === 'confirmed').length, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Confirmed Calls</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {filteredSessions.reduce((sum, session) => sum + session.results.filter(r => r === 'stands').length, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Stands Calls</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {filteredSessions.reduce((sum, session) => sum + session.results.filter(r => r === 'overturned').length, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Overturned Calls</div>
                  </div>
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-4">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map(session => {
                    const user = getUser(session.userId);
                    const stats = getSessionStats(session);
                    
                    return (
                      <div
                        key={session.id}
                        className="bg-white border border-gray-200/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-mlb-navy to-mlb-navy-dark rounded-xl flex items-center justify-center shadow-lg">
                              <Target className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-mlb-navy">
                                {drillLabels[session.drillType]}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <UserIcon className="w-4 h-4" />
                                <span>{getUserName(session.userId)}</span>
                                {user && (
                                  <>
                                    <span>•</span>
                                    <span>{user.level}</span>
                                    <span>•</span>
                                    <span>{user.location}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-500 mb-1">
                              {formatDate(new Date(session.startTime))}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(new Date(session.startTime), session.endTime ? new Date(session.endTime) : undefined)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{stats.total}</div>
                            <div className="text-xs text-gray-500">Total Calls</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-green-600">{stats.confirmed}</div>
                            <div className="text-xs text-gray-500">Confirmed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-yellow-600">{stats.stands}</div>
                            <div className="text-xs text-gray-500">Stands</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-red-600">{stats.overturned}</div>
                            <div className="text-xs text-gray-500">Overturned</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              {stats.confirmedPercentage.toFixed(1)}% Confirmed
                            </span>
                          </div>
                          
                          {session.notes && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <FileText className="w-4 h-4" />
                              <span>Has notes</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No sessions found</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Session Detail View */
            <div>
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-mlb-navy hover:text-mlb-navy-light transition-colors"
                >
                  ← Back to Sessions
                </button>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-mlb-navy">
                    {drillLabels[selectedSession.drillType]} Session
                  </h3>
                  <p className="text-gray-500">
                    {getUserName(selectedSession.userId)} • {formatDate(new Date(selectedSession.startTime))}
                  </p>
                </div>
              </div>

              {/* Session Info */}
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-200/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-mlb-navy mb-2">Session Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Duration: {formatDuration(new Date(selectedSession.startTime), selectedSession.endTime ? new Date(selectedSession.endTime) : undefined)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        <span>Total Calls: {selectedSession.results.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-mlb-navy mb-2">Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Confirmed:</span>
                        <span className="font-medium text-green-600">
                          {selectedSession.results.filter(r => r === 'confirmed').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stands:</span>
                        <span className="font-medium text-yellow-600">
                          {selectedSession.results.filter(r => r === 'stands').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overturned:</span>
                        <span className="font-medium text-red-600">
                          {selectedSession.results.filter(r => r === 'overturned').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedSession.notes && (
                    <div>
                      <h4 className="font-semibold text-mlb-navy mb-2">Session Notes</h4>
                      <p className="text-sm text-gray-700 bg-white/80 p-3 rounded-lg">
                        {selectedSession.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Results */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h4 className="font-semibold text-mlb-navy">Individual Call Results</h4>
                  <p className="text-sm text-gray-500">Click edit to modify any result</p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedSession.results.map((result, index) => {
                      const isEditing = editingResultId === `${selectedSession.id}-${index}`;
                      
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            isEditing ? 'border-mlb-navy bg-mlb-navy/5' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-600">
                              Call #{index + 1}
                            </span>
                            {!isEditing && (
                              <button
                                onClick={() => handleEditResult(selectedSession.id, index, result)}
                                className="text-mlb-navy hover:text-mlb-navy-light transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          {isEditing ? (
                            <div className="space-y-3">
                              <select
                                value={editingResult}
                                onChange={(e) => setEditingResult(e.target.value as ResultType)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mlb-navy"
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="stands">Stands</option>
                                <option value="overturned">Overturned</option>
                              </select>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveResult(selectedSession.id, index)}
                                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                                >
                                  <Save className="w-4 h-4" />
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex-1 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-1"
                                >
                                  <X className="w-4 h-4" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getResultColor(result)}`}>
                              {getResultIcon(result)}
                              <span className="font-medium capitalize">{result}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionManagement;