import { User, DrillResult, Note } from '../types';
import { drillLabels } from './drillUtils';

// Function to filter out orphaned drill results
const filterOrphanedDrillResults = (results: DrillResult[], users: User[]): DrillResult[] => {
  const validUserIds = new Set(users.map(user => user.id));
  return results.filter(result => validUserIds.has(result.userId));
};

// Function to filter out orphaned notes
const filterOrphanedNotes = (notes: Note[], users: User[]): Note[] => {
  const validUserIds = new Set(users.map(user => user.id));
  return notes.filter(note => validUserIds.has(note.userId));
};

export const generateUsersCSV = (users: User[]): string => {
  const headers = [
    'ID', 
    'First Name', 
    'Last Name', 
    'Email', 
    'Username', 
    'Level', 
    'Location', 
    'City',
    'State',
    'Education Level',
    'Conferences Worked',
    'Is Admin',
    'Is Evaluator',
    'Created At'
  ];
  
  const rows = users.map(user => [
    user.id,
    user.firstName,
    user.lastName,
    user.email,
    user.username,
    user.level,
    user.location,
    user.city || '',
    user.state || '',
    user.educationLevel || '',
    user.conferencesWorked || '',
    user.isAdmin ? 'Yes' : 'No',
    user.isEvaluator ? 'Yes' : 'No',
    new Date(user.createdAt).toISOString()
  ]);
  
  return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
};

export const generateDrillResultsCSV = (results: DrillResult[], users: User[]): string => {
  // Automatically filter out orphaned drill results
  const validResults = filterOrphanedDrillResults(results, users);
  
  const headers = [
    'ID', 
    'User ID', 
    'First Name', 
    'Last Name', 
    'Email', 
    'Username', 
    'Level', 
    'Location', 
    'City',
    'State',
    'Drill Type', 
    'Drill Label',
    'Result', 
    'Session ID',
    'Session Start Time',
    'Session End Time',
    'Session Notes',
    'Is Evaluator Recorded',
    'Evaluator ID',
    'Evaluator Username',
    'Timestamp'
  ];
  
  const userMap = new Map(users.map(user => [user.id, user]));
  
  const rows = validResults.map(result => {
    const user = userMap.get(result.userId);
    return [
      result.id,
      result.userId,
      user?.firstName || 'Unknown',
      user?.lastName || 'Unknown',
      user?.email || 'Unknown',
      user?.username || 'Unknown',
      user?.level || 'Unknown',
      user?.location || 'Unknown',
      user?.city || '',
      user?.state || '',
      result.drillType,
      drillLabels[result.drillType] || result.drillType,
      result.result,
      result.sessionId || '',
      result.sessionStartTime ? new Date(result.sessionStartTime).toISOString() : '',
      result.sessionEndTime ? new Date(result.sessionEndTime).toISOString() : '',
      result.sessionNotes || '',
      result.isEvaluatorRecorded ? 'Yes' : 'No',
      result.evaluatorId || '',
      result.evaluatorUsername || '',
      new Date(result.timestamp).toISOString()
    ];
  });
  
  return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
};

export const generateNotesCSV = (notes: Note[], users: User[]): string => {
  // Automatically filter out orphaned notes
  const validNotes = filterOrphanedNotes(notes, users);
  
  const headers = [
    'ID', 
    'User ID', 
    'Username', 
    'First Name',
    'Last Name',
    'Content', 
    'Has Video',
    'Likes Count', 
    'Comments Count', 
    'Timestamp'
  ];
  
  const userMap = new Map(users.map(user => [user.id, user]));
  
  const rows = validNotes.map(note => {
    const user = userMap.get(note.userId);
    return [
      note.id,
      note.userId,
      note.username,
      user?.firstName || 'Unknown',
      user?.lastName || 'Unknown',
      note.content.replace(/\n/g, '\\n'), // Replace newlines with literal \n
      note.videoFile ? 'Yes' : 'No',
      note.likes.length.toString(),
      note.comments.length.toString(),
      new Date(note.timestamp).toISOString()
    ];
  });
  
  return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
};

export const generateUserStatsCSV = (users: User[], results: DrillResult[]): string => {
  // Automatically filter out orphaned drill results
  const validResults = filterOrphanedDrillResults(results, users);
  
  const headers = [
    'User ID', 
    'First Name', 
    'Last Name', 
    'Email', 
    'Username', 
    'Level', 
    'Location', 
    'City',
    'State',
    'Education Level',
    'Conferences Worked',
    'Is Admin',
    'Is Evaluator',
    'Total Attempts', 
    'Confirmed', 
    'Stands', 
    'Overturned', 
    'Confirmed %', 
    'Stands %', 
    'Overturned %',
    'Account Created'
  ];
  
  const rows = users.map(user => {
    const userResults = validResults.filter(r => r.userId === user.id);
    const confirmed = userResults.filter(r => r.result === 'confirmed').length;
    const stands = userResults.filter(r => r.result === 'stands').length;
    const overturned = userResults.filter(r => r.result === 'overturned').length;
    const total = userResults.length;
    
    return [
      user.id,
      user.firstName,
      user.lastName,
      user.email,
      user.username,
      user.level,
      user.location,
      user.city || '',
      user.state || '',
      user.educationLevel || '',
      user.conferencesWorked || '',
      user.isAdmin ? 'Yes' : 'No',
      user.isEvaluator ? 'Yes' : 'No',
      total.toString(),
      confirmed.toString(),
      stands.toString(),
      overturned.toString(),
      total > 0 ? ((confirmed / total) * 100).toFixed(2) : '0.00',
      total > 0 ? ((stands / total) * 100).toFixed(2) : '0.00',
      total > 0 ? ((overturned / total) * 100).toFixed(2) : '0.00',
      new Date(user.createdAt).toISOString()
    ];
  });
  
  return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
};

export const generateCleanupReportCSV = (orphanedResults: DrillResult[], orphanedNotes: Note[], users: User[]): string => {
  const headers = [
    'Type',
    'ID',
    'User ID',
    'Description',
    'Timestamp',
    'Action Taken'
  ];
  
  const userMap = new Map(users.map(user => [user.id, user]));
  
  const rows: string[][] = [];
  
  // Add orphaned drill results
  orphanedResults.forEach(result => {
    rows.push([
      'Drill Result',
      result.id,
      result.userId,
      `${drillLabels[result.drillType] || result.drillType} - ${result.result}`,
      new Date(result.timestamp).toISOString(),
      'Removed from exports'
    ]);
  });
  
  // Add orphaned notes
  orphanedNotes.forEach(note => {
    rows.push([
      'Note',
      note.id,
      note.userId,
      note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
      new Date(note.timestamp).toISOString(),
      'Removed from exports'
    ]);
  });
  
  return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
};

export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Export function to get orphaned data statistics
export const getOrphanedDataStats = (users: User[], results: DrillResult[], notes: Note[]) => {
  const validUserIds = new Set(users.map(user => user.id));
  
  const orphanedResults = results.filter(result => !validUserIds.has(result.userId));
  const orphanedNotes = notes.filter(note => !validUserIds.has(note.userId));
  
  return {
    orphanedResults,
    orphanedNotes,
    totalOrphaned: orphanedResults.length + orphanedNotes.length
  };
};