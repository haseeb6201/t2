import React, { useState, useEffect, useRef } from 'react';
import { 
  StickyNote, 
  Plus, 
  Video, 
  Upload, 
  X, 
  Search, 
  Calendar, 
  FileText, 
  Pause, 
  Play 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Note } from '../../types';
import { storageUtils } from '../../utils/storage';

const NotesSection: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const loadNotes = () => {
    if (!user) return;
    const userNotes = storageUtils.getUserNotes(user.id).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setNotes(userNotes);
  };

  useEffect(() => {
    loadNotes();
  }, [user]);

  useEffect(() => {
    // Filter notes based on search criteria
    let filtered = notes;

    if (searchKeyword.trim()) {
      filtered = filtered.filter(note =>
        note.content.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    if (searchDate) {
      const searchDateObj = new Date(searchDate);
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.timestamp);
        return noteDate.toDateString() === searchDateObj.toDateString();
      });
    }

    setFilteredNotes(filtered);
  }, [notes, searchKeyword, searchDate]);

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }
      
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Video file must be less than 50MB');
        return;
      }
      
      setSelectedVideo(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  const removeVideo = () => {
    setSelectedVideo(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  const convertVideoToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddNote = async () => {
    if (!user || (!newNote.trim() && !selectedVideo)) return;

    setIsUploading(true);

    let videoData: string | undefined;
    
    if (selectedVideo) {
      try {
        videoData = await convertVideoToBase64(selectedVideo);
      } catch (error) {
        alert('Failed to process video file');
        setIsUploading(false);
        return;
      }
    }

    const note: Note = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      content: newNote.trim() || 'Video note',
      videoFile: videoData,
      timestamp: new Date(),
      likes: [],
      comments: []
    };

    storageUtils.addNote(note);
    setNewNote('');
    removeVideo();
    setIsUploading(false);
    loadNotes();
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    setSearchDate('');
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

  const toggleVideoPlayback = (noteId: string) => {
    setPlayingVideo(playingVideo === noteId ? null : noteId);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-white">
          <img src="/EL1_Logo.png" alt="EL Logo" className="w-6 h-6 object-contain" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent">Personal Training Notes</h2>
          <p className="text-gray-500 text-sm font-medium">Keep track of your training insights and observations</p>
        </div>
      </div>

      {/* Add New Note */}
      <div className="mb-8 bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-mlb-navy" />
          <h3 className="font-semibold text-mlb-navy">Add New Note</h3>
        </div>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Record your training insights, observations, areas for improvement, or attach a video..."
          className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white resize-none transition-all duration-200"
          rows={4}
        />
        
        {/* Video Upload Section */}
        <div className="mt-4">
          {!selectedVideo ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-mlb-navy/50 transition-colors">
              <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Attach a training video (optional)</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Choose Video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">Max file size: 50MB</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-mlb-navy" />
                  <span className="text-sm font-medium text-gray-700">Video attached</span>
                </div>
                <button
                  onClick={removeVideo}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {videoPreview && (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    src={videoPreview}
                    className="w-full h-32 object-cover"
                    controls
                  />
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500">
                <span className="font-medium">{selectedVideo.name}</span>
                <span className="ml-2">({(selectedVideo.size / (1024 * 1024)).toFixed(1)} MB)</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={handleAddNote}
            disabled={(!newNote.trim() && !selectedVideo) || isUploading}
            className="bg-gradient-to-r from-mlb-navy to-mlb-navy-light text-white px-6 py-3 rounded-xl hover:from-mlb-navy-light hover:to-mlb-navy disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isUploading ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-mlb-navy" />
          <h3 className="font-semibold text-mlb-navy">Search Notes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search by keyword</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Search in note content..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>
          </div>
        </div>
        {(searchKeyword || searchDate) && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 font-medium">
              Showing {filteredNotes.length} of {notes.length} notes
            </p>
            <button
              onClick={handleClearSearch}
              className="text-sm text-mlb-red hover:text-mlb-red-dark font-medium underline decoration-2 underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map(note => (
            <div key={note.id} className="border border-gray-200/50 rounded-xl p-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {note.videoFile ? (
                    <Video className="w-4 h-4 text-mlb-red mt-0.5" />
                  ) : (
                    <FileText className="w-4 h-4 text-mlb-navy mt-0.5" />
                  )}
                  <span className="text-sm text-gray-500 font-medium">
                    {formatDate(new Date(note.timestamp))}
                  </span>
                  {note.videoFile && (
                    <span className="text-xs bg-mlb-red/10 text-mlb-red px-2 py-1 rounded-full font-medium">
                      Video
                    </span>
                  )}
                </div>
              </div>
              
              {note.content && (
                <div className="prose prose-gray max-w-none mb-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                </div>
              )}
              
              {note.videoFile && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Video className="w-5 h-5 text-mlb-red" />
                    <span className="text-sm font-medium text-gray-700">Training Video</span>
                    <button
                      onClick={() => toggleVideoPlayback(note.id)}
                      className="ml-auto flex items-center gap-1 px-3 py-1 bg-mlb-red text-white rounded-lg hover:bg-mlb-red-dark transition-colors text-sm"
                    >
                      {playingVideo === note.id ? (
                        <>
                          <Pause className="w-3 h-3" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Play
                        </>
                      )}
                    </button>
                  </div>
                  
                  {playingVideo === note.id && (
                    <div className="relative bg-black rounded-lg overflow-hidden">
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
        ) : notes.length > 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-medium text-lg">No notes match your search criteria</p>
            <p className="text-sm">Try adjusting your search terms or date filter</p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-medium text-lg">No personal notes yet</p>
            <p className="text-sm">Start recording your training insights, observations, and videos</p>
          </div>
        )}
      </div>

      {notes.length > 0 && (
        <div className="mt-8 bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <h3 className="font-semibold text-mlb-navy mb-3">Notes Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-mlb-navy">{notes.length}</div>
              <div className="text-sm text-gray-500 font-medium">Total Notes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-mlb-navy">
                {notes.filter(note => {
                  const noteDate = new Date(note.timestamp);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return noteDate >= weekAgo;
                }).length}
              </div>
              <div className="text-sm text-gray-500 font-medium">This Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-mlb-red">
                {notes.filter(note => note.videoFile).length}
              </div>
              <div className="text-sm text-gray-500 font-medium">With Videos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-mlb-navy">
                {notes.reduce((total, note) => total + (note.content?.split(' ').length || 0), 0)}
              </div>
              <div className="text-sm text-gray-500 font-medium">Total Words</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesSection;