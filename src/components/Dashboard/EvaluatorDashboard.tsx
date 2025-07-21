import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, GameFilmEvaluation } from '../../types';
import { storageUtils } from '../../utils/storage';
import { 
  Video, 
  X, 
  Search, 
  Users, 
  FileText, 
  Send,
  Eye,
  Calendar,
  Target,
  Link,
  Upload,
  Award,
  Edit,
  Save,
  Database,
  BarChart3,
  StickyNote
} from 'lucide-react';
import DrillEvaluationInterface from './DrillEvaluationInterface';
import AllEvaluationsManager from './AllEvaluationsManager';
import UserDataViewer from './UserDataViewer';

const EvaluatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [playType, setPlayType] = useState('');
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [recentEvaluations, setRecentEvaluations] = useState<GameFilmEvaluation[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [activeTab, setActiveTab] = useState<'evaluations' | 'drill_evaluation' | 'all_evaluations' | 'user_data'>('evaluations');

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
    loadUsers();
    loadRecentEvaluations();
  }, []);

  // Add effect to reload users when window gains focus
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

  const loadUsers = () => {
    const allUsers = storageUtils.getUsers()
      .filter(u => !u.isAdmin && !u.isEvaluator)
      .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
    setUsers(allUsers);
  };

  const loadRecentEvaluations = () => {
    const evaluations = storageUtils.getGameFilmEvaluations()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5); // Show last 5 evaluations
    setRecentEvaluations(evaluations);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm.trim()) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedUser || !playType || !notes.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    const evaluation: GameFilmEvaluation = {
      id: Date.now().toString(),
      evaluatorId: user!.id,
      evaluatorUsername: user!.username,
      targetUserId: selectedUser.id,
      targetUsername: selectedUser.username,
      playType,
      notes: notes.trim(),
      videoUrl: videoUrl.trim() || undefined,
      timestamp: new Date()
    };

    console.log('Saving evaluation:', evaluation);
    storageUtils.addGameFilmEvaluation(evaluation);
    
    // Trigger a storage event to notify other components
    window.dispatchEvent(new Event('storage'));
    
    // Also trigger a custom event for immediate updates
    window.dispatchEvent(new CustomEvent('evaluationAdded', { 
      detail: { evaluation, targetUserId: selectedUser.id } 
    }));
    
    // Reset form
    setSelectedUser(null);
    setPlayType('');
    setNotes('');
    setVideoUrl('');
    setShowForm(false);
    setIsSubmitting(false);
    
    loadRecentEvaluations();
    alert(`Evaluation submitted successfully for ${selectedUser.firstName} ${selectedUser.lastName}!`);
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
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-red-700">You do not have evaluator permissions to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl bg-white">
            <img src="/EL1_Logo.png" alt="EL Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent">Evaluator Dashboard</h1>
            <p className="text-gray-500 text-lg font-medium">Manage evaluations and view user performance data</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Logged in as</div>
            <div className="font-bold text-mlb-navy">{user.firstName} {user.lastName}</div>
            <div className="text-sm text-mlb-red font-medium">Evaluator</div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-gray-100/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50">
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'evaluations'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Video className="w-4 h-4" />
              <span>New Evaluation</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('all_evaluations')}
            className={`flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'all_evaluations'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span>All Evaluations</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('user_data')}
            className={`flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'user_data'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Database className="w-4 h-4" />
              <span>Umpire Data</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('drill_evaluation')}
            className={`flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'drill_evaluation'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Target className="w-4 h-4" />
              <span>Drill Evaluation</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'drill_evaluation' ? (
        <DrillEvaluationInterface />
      ) : activeTab === 'all_evaluations' ? (
        <AllEvaluationsManager />
      ) : activeTab === 'user_data' ? (
        <UserDataViewer />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Selection & Form */}
        <div className="lg:col-span-2 space-y-6">
          {!showForm ? (
            /* User Selection */
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-mlb-navy" />
                <h2 className="text-2xl font-bold text-mlb-navy">Select Umpire to Evaluate</h2>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search umpires..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Users Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredUsers.map(umpire => (
                  <button
                    key={umpire.id}
                    onClick={() => {
                      setSelectedUser(umpire);
                      setShowForm(true);
                    }}
                    className="p-4 border border-gray-200 rounded-xl hover:border-mlb-navy hover:bg-mlb-navy/5 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center">
                        {umpire.profilePhoto ? (
                          <img
                            src={umpire.profilePhoto}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {(umpire.firstName || '').charAt(0)}{(umpire.lastName || '').charAt(0)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-mlb-navy">
                          {umpire.firstName} {umpire.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>@{umpire.username}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>{umpire.level}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          📍 {umpire.location}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No umpires found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search</p>
                </div>
              )}
            </div>
          ) : (
            /* Evaluation Form */
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-mlb-red" />
                  <h2 className="text-2xl font-bold text-mlb-navy">Create Evaluation</h2>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedUser(null);
                    setPlayType('');
                    setNotes('');
                    setVideoUrl('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedUser && (
                <div className="bg-gray-50/80 rounded-xl p-4 mb-6 border border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center">
                      {selectedUser.profilePhoto ? (
                        <img
                          src={selectedUser.profilePhoto}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {(selectedUser.firstName || '').charAt(0)}{(selectedUser.lastName || '').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-mlb-navy">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
                      <div className="text-sm text-gray-500">
                        @{selectedUser.username} • {selectedUser.level} • {selectedUser.location}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Play Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Play Type *
                  </label>
                  <select
                    value={playType}
                    onChange={(e) => setPlayType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select play type...</option>
                    {playTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Evaluation Notes *
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide detailed feedback on the umpire's performance, positioning, mechanics, and decision-making..."
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent resize-none transition-all duration-200"
                    rows={6}
                    required
                  />
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Game Film Video URL (Optional)
                  </label>
                  
                  <div className="space-y-4">
                    {/* Google Drive Upload Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Video className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900">Upload to Google Drive</h4>
                          <p className="text-sm text-blue-700">Upload your game film video to the shared evaluations folder</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => window.open('https://drive.google.com/drive/folders/15ywN79Agxr1dyKvJxRKWzJwHZPnEwvLP?dmr=1&ec=wgc-drive-globalnav-goto', '_blank')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Video
                        </button>
                        <button
                          onClick={() => window.open('https://drive.google.com/drive/folders/15ywN79Agxr1dyKvJxRKWzJwHZPnEwvLP?dmr=1&ec=wgc-drive-globalnav-goto', '_blank')}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View Folder
                        </button>
                      </div>
                      
                      <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium mb-1">Quick Instructions:</p>
                        <ol className="text-xs text-blue-700 space-y-1">
                          <li>1. Click "Upload Video" to open the shared Google Drive folder</li>
                          <li>2. Drag & drop or click "New" → "File upload" to upload your video</li>
                          <li>3. Once uploaded, right-click the video → "Get link" → "Copy link"</li>
                          <li>4. Paste the link in the field below</li>
                        </ol>
                      </div>
                    </div>

                    {/* Video URL Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Link (paste from Google Drive or other source)
                      </label>
                      <div className="relative">
                        <Link className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="https://drive.google.com/file/d/... or https://youtube.com/watch?v=..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Paste the shareable link from Google Drive or any other video platform
                      </p>
                    </div>
                  </div>
                  
                  {videoUrl && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="w-5 h-5 text-mlb-red" />
                        <span className="font-medium text-gray-700 text-sm">Video URL provided</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-600 break-all flex-1">{videoUrl}</p>
                        <button
                          onClick={() => window.open(videoUrl, '_blank')}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Test Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSubmitEvaluation}
                    disabled={!selectedUser || !playType || !notes.trim() || isSubmitting}
                    className="flex-1 bg-gradient-to-r from-mlb-red to-mlb-red-dark text-white px-8 py-4 rounded-xl hover:from-mlb-red-dark hover:to-mlb-red disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-xl flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Evaluations Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-6 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-5 h-5 text-mlb-navy" />
              <h3 className="text-lg font-bold text-mlb-navy">Recent Evaluations</h3>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentEvaluations.length > 0 ? (
                recentEvaluations.map(evaluation => (
                  <div key={evaluation.id} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-md overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {evaluation.targetUsername.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-mlb-navy text-sm">
                        {evaluation.targetUsername}
                      </span>
                      {evaluation.videoUrl && (
                        <Video className="w-3 h-3 text-mlb-red" />
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2">
                      <span className="font-medium">{evaluation.playType}</span>
                    </div>
                    
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {evaluation.notes}
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(new Date(evaluation.timestamp))}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No evaluations yet</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-mlb-navy">
                    {recentEvaluations.length}
                  </div>
                  <div className="text-xs text-gray-500">Recent Evaluations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default EvaluatorDashboard;