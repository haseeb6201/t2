import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GameFilmEvaluation } from '../../types';
import { storageUtils } from '../../utils/storage';
import { 
  FileText, 
  Search, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Video, 
  User,
  Eye,
  Filter,
  Trash2
} from 'lucide-react';

const AllEvaluationsManager: React.FC = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<GameFilmEvaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<GameFilmEvaluation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [playTypeFilter, setPlayTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [editingEvaluation, setEditingEvaluation] = useState<GameFilmEvaluation | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');

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
  }, [user]);

  useEffect(() => {
    filterEvaluations();
  }, [evaluations, searchTerm, playTypeFilter, dateFilter]);

  const loadEvaluations = () => {
    if (!user) return;
    // Get all evaluations created by this evaluator
    const userEvaluations = storageUtils.getGameFilmEvaluations()
      .filter(evaluation => evaluation.evaluatorId === user.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setEvaluations(userEvaluations);
  };

  const filterEvaluations = () => {
    let filtered = evaluations;

    if (searchTerm.trim()) {
      filtered = filtered.filter(evaluation =>
        evaluation.targetUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.playType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (playTypeFilter !== 'all') {
      filtered = filtered.filter(evaluation => evaluation.playType === playTypeFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(evaluation => {
        const evalDate = new Date(evaluation.timestamp);
        return evalDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredEvaluations(filtered);
  };

  const handleEditEvaluation = (evaluation: GameFilmEvaluation) => {
    setEditingEvaluation(evaluation);
    setEditNotes(evaluation.notes);
    setEditVideoUrl(evaluation.videoUrl || '');
  };

  const handleSaveEdit = () => {
    if (!editingEvaluation || !editNotes.trim()) {
      alert('Notes cannot be empty');
      return;
    }

    const updatedEvaluation: GameFilmEvaluation = {
      ...editingEvaluation,
      notes: editNotes.trim(),
      videoUrl: editVideoUrl.trim() || undefined
    };

    storageUtils.updateGameFilmEvaluation(editingEvaluation.id, updatedEvaluation);
    
    // Update local state
    setEvaluations(prev => 
      prev.map(evaluation => 
        evaluation.id === editingEvaluation.id ? updatedEvaluation : evaluation
      )
    );

    setEditingEvaluation(null);
    setEditNotes('');
    setEditVideoUrl('');
  };

  const handleCancelEdit = () => {
    setEditingEvaluation(null);
    setEditNotes('');
    setEditVideoUrl('');
  };

  const handleDeleteEvaluation = (evaluationId: string) => {
    if (window.confirm('Are you sure you want to delete this evaluation? This action cannot be undone.')) {
      storageUtils.deleteGameFilmEvaluation(evaluationId);
      setEvaluations(prev => prev.filter(evaluation => evaluation.id !== evaluationId));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setPlayTypeFilter('all');
    setDateFilter('');
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

  if (!user?.isEvaluator) {
    return null;
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-white">
          <img src="/EL1_Logo.png" alt="EL Logo" className="w-6 h-6 object-contain" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent">My Evaluations</h2>
          <p className="text-gray-500 text-sm font-medium">View and edit all evaluations you've created</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-mlb-navy" />
          <h3 className="font-semibold text-mlb-navy">Search & Filter</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search evaluations</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by user, play type, or notes..."
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>
          </div>
        </div>
        
        {(searchTerm || playTypeFilter !== 'all' || dateFilter) && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 font-medium">
              Showing {filteredEvaluations.length} of {evaluations.length} evaluations
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50/80 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-mlb-navy">{evaluations.length}</div>
          <div className="text-sm text-gray-500">Total Evaluations</div>
        </div>
        <div className="bg-gray-50/80 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-mlb-red">
            {evaluations.filter(e => e.videoUrl).length}
          </div>
          <div className="text-sm text-gray-500">With Video</div>
        </div>
        <div className="bg-gray-50/80 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-mlb-navy">
            {evaluations.filter(e => {
              const evalDate = new Date(e.timestamp);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return evalDate >= weekAgo;
            }).length}
          </div>
          <div className="text-sm text-gray-500">This Week</div>
        </div>
        <div className="bg-gray-50/80 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-mlb-navy">
            {new Set(evaluations.map(e => e.targetUsername)).size}
          </div>
          <div className="text-sm text-gray-500">Unique Users</div>
        </div>
      </div>

      {/* Evaluations List */}
      <div className="space-y-6">
        {filteredEvaluations.length > 0 ? (
          filteredEvaluations.map(evaluation => (
            <div key={evaluation.id} className="border border-gray-200/50 rounded-xl p-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-200">
              {editingEvaluation?.id === evaluation.id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-mlb-navy">Editing Evaluation</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Evaluation Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>User:</strong> {evaluation.targetUsername}</div>
                        <div><strong>Play Type:</strong> {evaluation.playType}</div>
                        <div><strong>Date:</strong> {formatDate(new Date(evaluation.timestamp))}</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                      <input
                        type="url"
                        value={editVideoUrl}
                        onChange={(e) => setEditVideoUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-mlb-navy text-lg">{evaluation.playType}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>For {evaluation.targetUsername}</span>
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
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditEvaluation(evaluation)}
                          className="p-2 text-gray-400 hover:text-mlb-navy hover:bg-mlb-navy/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvaluation(evaluation.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                          <Eye className="w-3 h-3" />
                          Watch Video
                        </button>
                      </div>
                    </div>
                  )}
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
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-medium text-lg">No evaluations created yet</p>
            <p className="text-sm">Your evaluations will appear here once you create them</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllEvaluationsManager;