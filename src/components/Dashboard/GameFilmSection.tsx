import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GameFilmEvaluation } from '../../types';
import { storageUtils } from '../../utils/storage';
import { 
  Video, 
  Play, 
  Pause, 
  FileText, 
  Calendar, 
  User,
  Award,
  Search,
  Filter,
  Eye
} from 'lucide-react';

const GameFilmSection: React.FC = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<GameFilmEvaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<GameFilmEvaluation[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [playTypeFilter, setPlayTypeFilter] = useState<string>('all');
  const [selectedEvaluation, setSelectedEvaluation] = useState<GameFilmEvaluation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const playTypes = [
    'Ball/Strike Call',
    'Safe/Out at First',
    'Safe/Out at Second', 
    'Safe/Out at Third',
    'Safe/Out at Home',
    'Fair/Foul Ball',
    'Check Swing',
    'Balk Call',
    'Interference/Obstruction',
    'Hit by Pitch',
    'Catch/No Catch',
    'Infield Fly',
    'Other'
  ];

  useEffect(() => {
    loadEvaluations();
    
    // Set up interval to check for new evaluations every 30 seconds
    const interval = setInterval(() => {
      loadEvaluations();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Add effect to reload evaluations when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      loadEvaluations();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadEvaluations();
      }
    };
    
    const handleStorageChange = () => {
      loadEvaluations();
    };
    
    const handleEvaluationAdded = (event: CustomEvent) => {
      // Check if this evaluation is for the current user
      if (user && event.detail.targetUserId === user.id) {
        console.log('New evaluation added for current user, refreshing...');
        loadEvaluations();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('evaluationAdded', handleEvaluationAdded as EventListener);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('evaluationAdded', handleEvaluationAdded as EventListener);
    };
  }, [user]);

  useEffect(() => {
    filterEvaluations();
  }, [evaluations, searchTerm, playTypeFilter]);

  const loadEvaluations = () => {
    if (!user) return;
    setIsRefreshing(true);
    const userEvaluations = storageUtils.getUserGameFilmEvaluations(user.id);
    console.log('Loading evaluations for user:', user.id, 'Found:', userEvaluations.length);
    setEvaluations(userEvaluations);
    setIsRefreshing(false);
  };

  const filterEvaluations = () => {
    let filtered = evaluations;

    if (searchTerm.trim()) {
      filtered = filtered.filter(evaluation =>
        evaluation.playType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.evaluatorUsername.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (playTypeFilter !== 'all') {
      filtered = filtered.filter(evaluation => evaluation.playType === playTypeFilter);
    }

    setFilteredEvaluations(filtered);
  };

  const toggleVideoPlayback = (evaluationId: string) => {
    setPlayingVideo(playingVideo === evaluationId ? null : evaluationId);
  };

  const handleManualRefresh = () => {
    loadEvaluations();
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setPlayTypeFilter('all');
  };

  if (!user) return null;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-white">
          <img src="/EL1_Logo.png" alt="EL Logo" className="w-6 h-6 object-contain" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent">Game Film Evaluations</h2>
          <p className="text-gray-500 text-sm font-medium">Review evaluations and game film from your evaluators</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-mlb-navy text-white rounded-lg hover:bg-mlb-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
        >
          <div className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}>
            🔄
          </div>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-mlb-navy" />
          <h3 className="font-semibold text-mlb-navy">Search & Filter</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search evaluations</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by play type, notes, or evaluator..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by play type</label>
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={playTypeFilter}
                onChange={(e) => setPlayTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
              >
                <option value="all">All play types</option>
                {playTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {(searchTerm || playTypeFilter !== 'all') && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 font-medium">
              Showing {filteredEvaluations.length} of {evaluations.length} evaluations
              {isRefreshing && <span className="text-mlb-navy"> • Checking for updates...</span>}
            </p>
            <button
              onClick={handleClearFilters}
              className="text-sm text-mlb-red hover:text-mlb-red-dark font-medium underline decoration-2 underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Evaluations List */}
      <div className="space-y-6">
        {filteredEvaluations.length > 0 ? (
          filteredEvaluations.map(evaluation => (
            <div key={evaluation.id} className="border border-gray-200/50 rounded-xl p-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-mlb-red to-mlb-red-dark flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-mlb-navy text-lg">{evaluation.playType}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Evaluated by {evaluation.evaluatorUsername}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(new Date(evaluation.timestamp))}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {evaluation.videoUrl && (
                    <span className="text-xs bg-mlb-red/10 text-mlb-red px-3 py-1 rounded-full font-medium flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Video
                    </span>
                  )}
                  <span className="text-xs bg-mlb-navy/10 text-mlb-navy px-3 py-1 rounded-full font-medium">
                    Evaluation
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-mlb-navy" />
                  <span className="text-sm font-medium text-gray-700">Evaluation Notes</span>
                </div>
                <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-200/50">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{evaluation.notes}</p>
                </div>
              </div>

              {/* Video Section */}
              {evaluation.videoUrl && (
                <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Video className="w-5 h-5 text-mlb-red" />
                    <span className="text-sm font-medium text-gray-700">Game Film</span>
                    <button
                      onClick={() => window.open(evaluation.videoUrl, '_blank')}
                      className="ml-auto flex items-center gap-1 px-3 py-1 bg-mlb-red text-white rounded-lg hover:bg-mlb-red-dark transition-colors text-sm font-medium"
                    >
                      <Play className="w-3 h-3" />
                      Watch Video
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : evaluations.length > 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-medium text-lg">No evaluations match your search criteria</p>
            <p className="text-sm">Try adjusting your search terms or filters</p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-medium text-lg">No game film evaluations yet</p>
            <p className="text-sm">Evaluations from your instructors will appear here</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {evaluations.length > 0 && (
        <div className="mt-8 bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <h3 className="font-semibold text-mlb-navy mb-4">Evaluation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-mlb-navy">{evaluations.length}</div>
              <div className="text-sm text-gray-500 font-medium">Total Evaluations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-mlb-red">
                {evaluations.filter(e => e.videoUrl).length}
              </div>
              <div className="text-sm text-gray-500 font-medium">With Video</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-mlb-navy">
                {evaluations.filter(e => {
                  const evalDate = new Date(e.timestamp);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return evalDate >= weekAgo;
                }).length}
              </div>
              <div className="text-sm text-gray-500 font-medium">This Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-mlb-navy">
                {new Set(evaluations.map(e => e.evaluatorUsername)).size}
              </div>
              <div className="text-sm text-gray-500 font-medium">Evaluators</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameFilmSection;