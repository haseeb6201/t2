import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DrillType, DrillSession, ResultType, DrillResult } from '../../types';
import { drillLabels, calculateDrillStatsWithRecent } from '../../utils/drillUtils';
import { storageUtils } from '../../utils/storage';
import { Play, Square, CheckCircle, XCircle, MinusCircle, Clock, FileText, BarChart3, TrendingUp } from 'lucide-react';

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

const DrillSessionManager: React.FC = () => {
  const { user } = useAuth();
  const [selectedDrill, setSelectedDrill] = useState<DrillType | ''>('');
  const [activeSession, setActiveSession] = useState<DrillSession | null>(null);
  const [sessionResults, setSessionResults] = useState<ResultType[]>([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [drillStats, setDrillStats] = useState<any>(null);
  const [lastSessionNotes, setLastSessionNotes] = useState<string>('');

  useEffect(() => {
    // Check for any active session on component mount
    if (user) {
      const session = storageUtils.getActiveSession(user.id);
      if (session) {
        setActiveSession(session);
        setSelectedDrill(session.drillType);
        setSessionResults(session.results);
      }
    }
  }, [user]);

  useEffect(() => {
    // Load drill stats when a drill is selected
    if (user && selectedDrill) {
      const results = storageUtils.getUserDrillResultsByType(user.id, selectedDrill);
      const stats = calculateDrillStatsWithRecent(results);
      setDrillStats(stats);
      
      // Get last session notes for this drill
      const sessions = storageUtils.getUserSessions(user.id);
      const lastSession = sessions
        .filter(s => s.drillType === selectedDrill && s.notes)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
      
      setLastSessionNotes(lastSession?.notes || '');
    } else {
      setDrillStats(null);
      setLastSessionNotes('');
    }
  }, [user, selectedDrill]);

  const handleBeginDrill = () => {
    if (!user || !selectedDrill) return;

    const session: DrillSession = {
      id: Date.now().toString(),
      userId: user.id,
      drillType: selectedDrill,
      startTime: new Date(),
      results: [],
      isActive: true
    };

    storageUtils.saveActiveSession(session);
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
      storageUtils.saveActiveSession(updatedSession);
      setActiveSession(updatedSession);
    }
  };

  const handleEndDrill = () => {
    if (sessionResults.length === 0) {
      // If no results, just end the session
      handleEndSession();
      return;
    }
    
    setShowNotesModal(true);
  };

  const handleEndSession = () => {
    if (!activeSession || !user) return;

    const endTime = new Date();
    const finalSession = {
      ...activeSession,
      endTime,
      results: sessionResults,
      notes: sessionNotes,
      isActive: false
    };

    // Save individual drill results
    sessionResults.forEach(result => {
      const drillResult: DrillResult = {
        id: Date.now().toString() + Math.random(),
        userId: user.id,
        drillType: activeSession.drillType,
        result,
        sessionId: activeSession.id,
        sessionStartTime: activeSession.startTime,
        sessionEndTime: endTime,
        sessionNotes: sessionNotes || undefined,
        timestamp: new Date()
      };
      storageUtils.addDrillResult(drillResult);
    });

    // Save session to history
    storageUtils.saveSessionToHistory(finalSession);
    
    // Save session notes to personal notes if notes were provided
    if (sessionNotes && sessionNotes.trim()) {
      const personalNote = {
        id: Date.now().toString() + '_session_note',
        userId: user.id,
        username: user.username,
        content: `Training Session: ${drillLabels[activeSession.drillType]}\n\nSession Summary:\n• Duration: ${formatDuration(activeSession.startTime, endTime)}\n• Total Calls: ${sessionResults.length}\n• Confirmed: ${sessionResults.filter(r => r === 'confirmed').length}\n• Stands: ${sessionResults.filter(r => r === 'stands').length}\n• Overturned: ${sessionResults.filter(r => r === 'overturned').length}\n\nNotes:\n${sessionNotes}`,
        timestamp: endTime,
        likes: [],
        comments: []
      };
      storageUtils.addNote(personalNote);
    }
    
    // Clear active session
    storageUtils.clearActiveSession(user.id);
    
    // Reset state
    setActiveSession(null);
    setSessionResults([]);
    setSelectedDrill('');
    setSessionNotes('');
    setShowNotesModal(false);
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

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8">
        {!activeSession ? (
          // Drill Selection Screen
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent mb-8">Select Training Drill</h2>
            
            <div className="mb-8">
              <select
                value={selectedDrill}
                onChange={(e) => setSelectedDrill(e.target.value as DrillType)}
                className="w-full max-w-lg px-6 py-4 border border-gray-200 rounded-2xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white text-lg font-medium shadow-inner transition-all duration-200"
              >
                <option value="">Choose a drill...</option>
                {drillTypes.map(drillType => (
                  <option key={drillType} value={drillType}>
                    {drillLabels[drillType]}
                  </option>
                ))}
              </select>
            </div>

            {/* Drill Statistics Display */}
            {selectedDrill && drillStats && (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 mb-6 border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-6 h-6 text-mlb-navy" />
                    <h3 className="text-2xl font-bold text-mlb-navy">
                      {drillLabels[selectedDrill]} Statistics
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Overall Stats */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50">
                      <h4 className="font-semibold text-mlb-navy mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-mlb-navy" />
                        Overall Performance
                      </h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {drillStats.confirmedPercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmed</div>
                          <div className="text-sm text-gray-600">{drillStats.confirmed} calls</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {drillStats.standsPercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stands</div>
                          <div className="text-sm text-gray-600">{drillStats.stands} calls</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {drillStats.overturnedPercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overturned</div>
                          <div className="text-sm text-gray-600">{drillStats.overturned} calls</div>
                        </div>
                      </div>
                      <div className="text-center mt-4 pt-4 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Total Attempts: {drillStats.total}</span>
                      </div>
                    </div>

                    {/* Last 20 Stats */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50">
                      <h4 className="font-semibold text-mlb-navy mb-4">Last 20 Attempts</h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {drillStats.last20.confirmedPercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmed</div>
                          <div className="text-sm text-gray-600">{drillStats.last20.confirmed} calls</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {drillStats.last20.standsPercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stands</div>
                          <div className="text-sm text-gray-600">{drillStats.last20.stands} calls</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {drillStats.last20.overturnedPercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overturned</div>
                          <div className="text-sm text-gray-600">{drillStats.last20.overturned} calls</div>
                        </div>
                      </div>
                      <div className="text-center mt-4 pt-4 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Recent Attempts: {drillStats.last20.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last Session Notes */}
                {lastSessionNotes && (
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-mlb-navy mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-mlb-navy mb-2">Notes from Last Session</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{lastSessionNotes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleBeginDrill}
              disabled={!selectedDrill}
              className="bg-gradient-to-r from-mlb-navy to-mlb-navy-light text-white px-10 py-4 rounded-2xl hover:from-mlb-navy-light hover:to-mlb-navy disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 mx-auto text-lg font-semibold shadow-2xl"
            >
              <Play className="w-5 h-5" />
              Begin Drill
            </button>
            
            {selectedDrill && drillStats && drillStats.total === 0 && (
              <p className="text-gray-500 text-sm mt-6 font-medium">
                This will be your first attempt at this drill. Good luck!
              </p>
            )}
          </div>
        ) : (
          // Active Drill Session Screen
          <div>
            <div className="text-center mb-8">
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

            <div className="text-center">
              <button
                onClick={handleEndDrill}
                className="bg-gradient-to-r from-mlb-red to-mlb-red-dark text-white px-10 py-4 rounded-2xl hover:from-mlb-red-dark hover:to-mlb-red transition-all duration-200 flex items-center gap-3 mx-auto text-lg font-semibold shadow-xl"
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
              <h3 className="text-xl font-bold text-mlb-navy">Add Session Notes</h3>
            </div>
            
            <p className="text-gray-600 mb-6 font-medium">
              Would you like to add any notes about this training session?
            </p>
            
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Enter your notes here (optional)..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white resize-none transition-all duration-200"
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
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrillSessionManager;