import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DrillType, DrillSession, ResultType, DrillResult, User } from '../../types';
import { drillLabels, calculateDrillStatsWithRecent } from '../../utils/drillUtils';
import { storageUtils } from '../../utils/storage';
import { 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Clock, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Users,
  UserCheck,
  Shield,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

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

const DrillEvaluationInterface: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDrill, setSelectedDrill] = useState<DrillType | ''>('');
  const [activeSession, setActiveSession] = useState<DrillSession | null>(null);
  const [sessionResults, setSessionResults] = useState<ResultType[]>([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [drillStats, setDrillStats] = useState<any>(null);
  const [lastSessionNotes, setLastSessionNotes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  // Add effect to reload users when window gains focus (in case users were added in another tab)
  useEffect(() => {
    const handleFocus = () => {
      loadUsers();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  useEffect(() => {
    if (selectedUser && selectedDrill) {
      loadDrillStats();
    } else {
      setDrillStats(null);
      setLastSessionNotes('');
    }
  }, [selectedUser, selectedDrill]);

  const loadUsers = () => {
    setIsRefreshing(true);
    const allUsers = storageUtils.getUsers()
      .filter(u => !u.isAdmin && !u.isEvaluator)
      .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
    setUsers(allUsers);
    setIsRefreshing(false);
  };

  const handleRefreshUsers = () => {
    loadUsers();
    // Also reload filtered users
    setSearchTerm('');
  };

  const filterUsers = () => {
    let filtered = users;
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(u =>
        u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  };

  const loadDrillStats = () => {
    if (!selectedUser || !selectedDrill) return;
    
    const results = storageUtils.getUserDrillResultsByType(selectedUser.id, selectedDrill);
    const stats = calculateDrillStatsWithRecent(results);
    setDrillStats(stats);
    
    // Get last session notes for this drill
    const sessions = storageUtils.getUserSessions(selectedUser.id);
    const lastSession = sessions
      .filter(s => s.drillType === selectedDrill && s.notes)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
    
    setLastSessionNotes(lastSession?.notes || '');
  };

  const handleBeginDrill = () => {
    if (!user || !selectedUser || !selectedDrill) return;

    const sessionId = `eval_${Date.now()}_${selectedUser.id}`;
    const session: DrillSession = {
      id: sessionId,
      userId: selectedUser.id,
      drillType: selectedDrill,
      startTime: new Date(),
      results: [],
      evaluatorId: user.id,
      evaluatorUsername: user.username,
      isEvaluatorRecorded: true,
      isActive: true
    };

    setActiveSession(session);
    setSessionResults([]);
  };

  const handleResultClick = (result: ResultType) => {
    const newResults = [...sessionResults, result];
    setSessionResults(newResults);
    
    if (activeSession) {
      const updatedSession = {
        ...activeSession,
        results: newResults
      };
      setActiveSession(updatedSession);
    }
  };

  const handleEndDrill = () => {
    if (sessionResults.length === 0) {
      handleEndSession();
      return;
    }
    
    setShowNotesModal(true);
  };

  const handleEndSession = () => {
    if (!activeSession || !user || !selectedUser) return;

    const endTime = new Date();
    const finalSession = {
      ...activeSession,
      endTime,
      results: sessionResults,
      notes: sessionNotes,
      isActive: false
    };

    // Save individual drill results with evaluator metadata
    sessionResults.forEach(result => {
      const drillResult: DrillResult = {
        id: Date.now().toString() + Math.random(),
        userId: selectedUser.id,
        drillType: activeSession.drillType,
        result,
        sessionId: activeSession.id,
        sessionStartTime: activeSession.startTime,
        sessionEndTime: endTime,
        sessionNotes: sessionNotes || undefined,
        evaluatorId: user.id,
        evaluatorUsername: user.username,
        isEvaluatorRecorded: true,
        timestamp: new Date()
      };
      storageUtils.addDrillResult(drillResult);
    });

    // Save session to history
    storageUtils.saveSessionToHistory(finalSession);
    
    // Save session notes to personal notes if notes were provided
    if (sessionNotes && sessionNotes.trim()) {
      const personalNote = {
        id: Date.now().toString() + '_eval_session_note',
        userId: selectedUser.id,
        username: selectedUser.username,
        content: `Evaluator Training Session: ${drillLabels[activeSession.drillType]}\n\nEvaluated by: ${user.username}\nSession Summary:\n• Duration: ${formatDuration(activeSession.startTime, endTime)}\n• Total Calls: ${sessionResults.length}\n• Confirmed: ${sessionResults.filter(r => r === 'confirmed').length}\n• Stands: ${sessionResults.filter(r => r === 'stands').length}\n• Overturned: ${sessionResults.filter(r => r === 'overturned').length}\n\nEvaluator Notes:\n${sessionNotes}`,
        timestamp: endTime,
        likes: [],
        comments: []
      };
      storageUtils.addNote(personalNote);
    }
    
    // Reset state
    setActiveSession(null);
    setSessionResults([]);
    setSessionNotes('');
    setShowNotesModal(false);
    
    // Refresh drill stats
    loadDrillStats();
  };

  const handleSkipNotes = () => {
    setSessionNotes('');
    handleEndSession();
  };

  const handleSaveWithNotes = () => {
    handleEndSession();
  };

  const getResultIcon = (result: ResultType) => {
    switch (result) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5" />;
      case 'stands':
        return <MinusCircle className="w-5 h-5" />;
      case 'overturned':
        return <XCircle className="w-5 h-5" />;
    }
  };

  const getResultColor = (result: ResultType) => {
    switch (result) {
      case 'confirmed':
        return 'bg-green-600 hover:bg-green-700';
      case 'stands':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'overturned':
        return 'bg-red-600 hover:bg-red-700';
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!user?.isEvaluator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-red-700">You do not have evaluator permissions to access this interface.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-mlb-red to-mlb-red-dark rounded-2xl flex items-center justify-center shadow-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent">
                Drill Evaluation Interface
              </h1>
              <p className="text-gray-500 font-medium">Complete drills on behalf of selected users</p>
            </div>
          </div>
          
          {/* Evaluator Mode Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Evaluator Mode Active</h3>
                <p className="text-amber-700 text-sm">
                  You are recording drill results on behalf of another user. All results will be saved to their account with evaluator metadata.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!activeSession ? (
          <div className="space-y-8">
            {/* User Selection */}
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-mlb-navy" />
                <h2 className="text-xl font-bold text-mlb-navy">Select User</h2>
                <button
                  onClick={handleRefreshUsers}
                  disabled={isRefreshing}
                  className="ml-auto flex items-center gap-2 px-3 py-2 bg-mlb-navy text-white rounded-lg hover:bg-mlb-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Users'}
                </button>
              </div>
              
              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent transition-all duration-200"
                />
              </div>
              
              {/* User Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                      selectedUser?.id === u.id
                        ? 'border-mlb-navy bg-mlb-navy/5 shadow-lg'
                        : 'border-gray-200 hover:border-mlb-navy/50 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center">
                        {u.profilePhoto ? (
                          <img src={u.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-mlb-navy">
                          {u.firstName} {u.lastName}
                        </h3>
                        <div className="text-sm text-gray-500">
                          @{u.username} • {u.level}
                        </div>
                        <div className="text-xs text-gray-400">
                          📍 {u.location}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    {isRefreshing ? 'Loading users...' : 'No users found'}
                  </p>
                  {!isRefreshing && (
                    <div className="mt-4 space-y-2">
                      <p className="text-gray-400 text-sm">
                        {searchTerm ? 'Try adjusting your search' : 'No members available for evaluation'}
                      </p>
                      <button
                        onClick={handleRefreshUsers}
                        className="text-mlb-navy hover:text-mlb-navy-light font-medium text-sm underline"
                      >
                        Click here to refresh the user list
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drill Selection */}
            {selectedUser && (
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-mlb-navy" />
                  <h2 className="text-xl font-bold text-mlb-navy">Select Drill for {selectedUser.firstName} {selectedUser.lastName}</h2>
                </div>
                
                <div className="mb-6">
                  <select
                    value={selectedDrill}
                    onChange={(e) => setSelectedDrill(e.target.value as DrillType)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Choose a drill...</option>
                    {drillTypes.map(drillType => (
                      <option key={drillType} value={drillType}>
                        {drillLabels[drillType]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current User Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-800">Recording for: {selectedUser.firstName} {selectedUser.lastName}</h3>
                      <p className="text-blue-700 text-sm">
                        @{selectedUser.username} • {selectedUser.level} • {selectedUser.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Drill Statistics */}
                {selectedDrill && drillStats && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-200/50">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-5 h-5 text-mlb-navy" />
                      <h3 className="text-lg font-bold text-mlb-navy">
                        {drillLabels[selectedDrill]} - Current Statistics
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-mlb-navy mb-3">Overall Performance</h4>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {drillStats.confirmedPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Confirmed</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-yellow-600">
                              {drillStats.standsPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Stands</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-red-600">
                              {drillStats.overturnedPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Overturned</div>
                          </div>
                        </div>
                        <div className="text-center mt-3 text-sm text-gray-600">
                          Total: {drillStats.total} attempts
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-mlb-navy mb-3">Last 20 Attempts</h4>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {drillStats.last20.confirmedPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Confirmed</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-yellow-600">
                              {drillStats.last20.standsPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Stands</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-red-600">
                              {drillStats.last20.overturnedPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Overturned</div>
                          </div>
                        </div>
                        <div className="text-center mt-3 text-sm text-gray-600">
                          Recent: {drillStats.last20.total} attempts
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Session Notes */}
                {selectedDrill && lastSessionNotes && (
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-200/50">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-mlb-navy mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-mlb-navy mb-2">Notes from Last Session</h4>
                        <p className="text-gray-700 text-sm">{lastSessionNotes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Begin Button */}
                <div className="text-center">
                  <button
                    onClick={handleBeginDrill}
                    disabled={!selectedDrill}
                    className="bg-gradient-to-r from-mlb-red to-mlb-red-dark text-white px-8 py-4 rounded-xl hover:from-mlb-red-dark hover:to-mlb-red disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 mx-auto font-semibold shadow-lg"
                  >
                    <Play className="w-5 h-5" />
                    Begin Drill Evaluation
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Session Interface */
          <div>
            <div className="text-center mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Evaluating: {selectedUser?.firstName} {selectedUser?.lastName}</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Results will be saved to @{selectedUser?.username}'s training record
                </p>
              </div>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent mb-4">
                {drillLabels[activeSession.drillType]}
              </h2>
              <div className="flex items-center justify-center gap-6 text-gray-600 font-medium">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Duration: {formatDuration(activeSession.startTime)}</span>
                </div>
                <div>
                  Calls Made: {sessionResults.length}
                </div>
              </div>
            </div>

            {/* Result Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <button
                onClick={() => handleResultClick('confirmed')}
                className={`${getResultColor('confirmed')} text-white p-8 rounded-2xl flex flex-col items-center gap-4 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1`}
              >
                {getResultIcon('confirmed')}
                <span className="text-xl font-bold">Confirmed</span>
                <span className="text-sm opacity-90 font-medium">
                  {sessionResults.filter(r => r === 'confirmed').length} calls
                </span>
              </button>
              
              <button
                onClick={() => handleResultClick('stands')}
                className={`${getResultColor('stands')} text-white p-8 rounded-2xl flex flex-col items-center gap-4 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1`}
              >
                {getResultIcon('stands')}
                <span className="text-xl font-bold">Stands</span>
                <span className="text-sm opacity-90 font-medium">
                  {sessionResults.filter(r => r === 'stands').length} calls
                </span>
              </button>
              
              <button
                onClick={() => handleResultClick('overturned')}
                className={`${getResultColor('overturned')} text-white p-8 rounded-2xl flex flex-col items-center gap-4 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1`}
              >
                {getResultIcon('overturned')}
                <span className="text-xl font-bold">Overturned</span>
                <span className="text-sm opacity-90 font-medium">
                  {sessionResults.filter(r => r === 'overturned').length} calls
                </span>
              </button>
            </div>

            {/* Recent Calls */}
            {sessionResults.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-mlb-navy mb-4">Recent Calls</h3>
                <div className="flex flex-wrap gap-2">
                  {sessionResults.slice(-10).map((result, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 rounded-full text-white text-sm font-semibold shadow-md ${
                        result === 'confirmed' ? 'bg-green-500' :
                        result === 'stands' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    >
                      {result}
                    </div>
                  ))}
                  {sessionResults.length > 10 && (
                    <div className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-sm">
                      +{sessionResults.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* End Button */}
            <div className="text-center">
              <button
                onClick={handleEndDrill}
                className="bg-gradient-to-r from-mlb-red to-mlb-red-dark text-white px-10 py-4 rounded-2xl hover:from-mlb-red-dark hover:to-mlb-red transition-all duration-200 flex items-center gap-3 mx-auto font-semibold shadow-xl"
              >
                <Square className="w-5 h-5" />
                End Drill
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200/50">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-mlb-navy" />
              <h3 className="text-xl font-bold text-mlb-navy">Add Evaluation Notes</h3>
            </div>
            
            <p className="text-gray-600 mb-6 font-medium">
              Add notes about this evaluation session for {selectedUser?.firstName} {selectedUser?.lastName}
            </p>
            
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Enter evaluation notes here..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent resize-none transition-all duration-200"
              rows={4}
            />
            
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSkipNotes}
                className="flex-1 bg-gray-200 text-mlb-navy py-3 px-6 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
              >
                Skip Notes
              </button>
              <button
                onClick={handleSaveWithNotes}
                className="flex-1 bg-gradient-to-r from-mlb-navy to-mlb-navy-light text-white py-3 px-6 rounded-xl hover:from-mlb-navy-light hover:to-mlb-navy transition-all duration-200 font-semibold shadow-lg"
              >
                Save Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrillEvaluationInterface;