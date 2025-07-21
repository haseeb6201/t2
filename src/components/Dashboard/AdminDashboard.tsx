import React from 'react';
import { migrateLocalDataToSupabase } from '../../utils/dataMigration';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EvaluatorDashboard from './EvaluatorDashboard';
import UserManagement from './UserManagement';
import SessionManagement from './SessionManagement';
import { storageUtils } from '../../utils/storage';
import { 
  generateUsersCSV, 
  generateDrillResultsCSV, 
  generateNotesCSV, 
  generateUserStatsCSV,
  downloadCSV,
  generateCleanupReportCSV,
  getOrphanedDataStats
} from '../../utils/csvExport';
import { Download, Database, Users, FileText, BarChart3, Settings, ChevronDown, Shield, AlertTriangle, CheckCircle, Upload, Trash2, AlertCircle, UploadCloud as CloudUpload } from 'lucide-react';
import { Target } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showSessionManagement, setShowSessionManagement] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [dataIntegrity, setDataIntegrity] = useState<{ isValid: boolean; issues: string[] } | null>(null);
  const [orphanedDataStats, setOrphanedDataStats] = useState<{ totalOrphaned: number; orphanedResults: any[]; orphanedNotes: any[] } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<'admin' | 'evaluator'>(() => {
    // Check localStorage for saved mode preference, default to admin
    return (localStorage.getItem('dashboard_mode') as 'admin' | 'evaluator') || 'admin';
  });

  if (!user?.isAdmin) {
    return null;
  }

  // Check data integrity on component mount
  React.useEffect(() => {
    const integrity = storageUtils.checkDataIntegrity();
    setDataIntegrity(integrity);
    
    // Check for orphaned data
    const data = storageUtils.getAllDataForExport();
    const orphanedStats = getOrphanedDataStats(data.users, data.drillResults, data.notes);
    setOrphanedDataStats(orphanedStats);
  }, []);

  // If user has both admin and evaluator permissions and evaluator mode is selected
  if (user.isEvaluator && currentMode === 'evaluator') {
    return <EvaluatorDashboard />;
  }

  const handleDownloadUsers = () => {
    const data = storageUtils.getAllDataForExport();
    const csv = generateUsersCSV(data.users);
    downloadCSV(csv, `users_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDownloadDrillResults = () => {
    const data = storageUtils.getAllDataForExport();
    // CSV export automatically filters out orphaned data
    const csv = generateDrillResultsCSV(data.drillResults, data.users);
    downloadCSV(csv, `drill_results_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDownloadNotes = () => {
    const data = storageUtils.getAllDataForExport();
    // CSV export automatically filters out orphaned data
    const csv = generateNotesCSV(data.notes, data.users);
    downloadCSV(csv, `notes_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDownloadUserStats = () => {
    const data = storageUtils.getAllDataForExport();
    // CSV export automatically filters out orphaned data
    const csv = generateUserStatsCSV(data.users, data.drillResults);
    downloadCSV(csv, `user_stats_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDownloadCleanupReport = () => {
    const data = storageUtils.getAllDataForExport();
    const orphanedStats = getOrphanedDataStats(data.users, data.drillResults, data.notes);
    const csv = generateCleanupReportCSV(orphanedStats.orphanedResults, orphanedStats.orphanedNotes, data.users);
    downloadCSV(csv, `cleanup_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleCleanupOrphanedData = () => {
    if (!orphanedDataStats || orphanedDataStats.totalOrphaned === 0) {
      alert('No orphaned data found to clean up.');
      return;
    }
    
    if (window.confirm(`This will permanently remove ${orphanedDataStats.totalOrphaned} orphaned records. This action cannot be undone. Continue?`)) {
      const result = storageUtils.cleanupOrphanedData(user.id);
      if (result.cleaned) {
        alert(`Successfully cleaned up ${result.orphanedCount} orphaned records.`);
        // Refresh the page to reflect changes
        window.location.reload();
      } else {
        alert('Failed to clean up orphaned data. Please try again.');
      }
    }
  };

  const handleExportAllData = () => {
    const data = storageUtils.exportAllData();
    if (data) {
      downloadCSV(data, `complete_backup_${new Date().toISOString().split('T')[0]}.json`);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const success = storageUtils.importData(content, user.id);
        if (success) {
          alert('Data imported successfully!');
          window.location.reload();
        } else {
          alert('Failed to import data. Please check the file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleMigrateToSupabase = async () => {
    if (!window.confirm('This will migrate all localStorage data to Supabase. This process may take a few minutes. Continue?')) {
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await migrateLocalDataToSupabase();
      setMigrationResult(result.message);
      if (result.success) {
        // Optionally reload the page after successful migration
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (error) {
      setMigrationResult(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const data = storageUtils.getAllDataForExport();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Profile Dropdown */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-md">
              <img src="/EL1_Logo.png" alt="EL Logo" className="w-6 h-6 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-mlb-navy">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Export and manage system data</p>
        </div>
        
        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-mlb-navy to-mlb-navy-dark rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-mlb-navy">{user.firstName} {user.lastName}</div>
              <div className="text-sm text-gray-500">Administrator</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200/50 py-2 z-10">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="font-semibold text-mlb-navy">{user.firstName} {user.lastName}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="text-xs text-mlb-red font-medium mt-1">Admin Access</div>
              </div>
              
              <button
                onClick={() => {
                  setShowUserManagement(true);
                  setShowProfileDropdown(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <Users className="w-4 h-4 text-mlb-navy" />
                <div>
                  <div className="font-medium text-gray-900">Manage Members</div>
                  <div className="text-sm text-gray-500">Add, edit, and remove members</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowSessionManagement(true);
                  setShowProfileDropdown(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <Target className="w-4 h-4 text-mlb-navy" />
                <div>
                  <div className="font-medium text-gray-900">Manage Sessions</div>
                  <div className="text-sm text-gray-500">View and edit training sessions</div>
                </div>
              </button>
              
              <div className="px-4 py-2 border-t border-gray-100">
                <div className="text-xs text-gray-400 font-medium">SYSTEM INFO</div>
                <div className="text-sm text-gray-600 mt-1">
                  {data.users.length} users • {data.drillResults.length} results
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Integrity Status */}
      {dataIntegrity && (
        <div className={`mb-6 p-4 rounded-xl border ${
          dataIntegrity.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {dataIntegrity.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <h3 className={`font-semibold ${
              dataIntegrity.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              Data Integrity Status
            </h3>
          </div>
          {dataIntegrity.isValid ? (
            <p className="text-green-700 text-sm">All data is valid and consistent</p>
          ) : (
            <div className="text-red-700 text-sm">
              <p className="mb-2">Issues detected:</p>
              <ul className="list-disc list-inside space-y-1">
                {dataIntegrity.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Orphaned Data Warning */}
      {orphanedDataStats && orphanedDataStats.totalOrphaned > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Orphaned Data Detected</h3>
          </div>
          <p className="text-yellow-700 text-sm mb-3">
            Found {orphanedDataStats.totalOrphaned} orphaned records from deleted users. 
            These records are automatically excluded from CSV exports.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadCleanupReport}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
            <button
              onClick={handleCleanupOrphanedData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clean Up Data
            </button>
          </div>
        </div>
      )}

      {/* Migration Status */}
      {(isMigrating || migrationResult) && (
        <div className={`mb-6 p-4 rounded-xl border ${
          migrationResult?.includes('successfully') 
            ? 'bg-green-50 border-green-200' 
            : migrationResult?.includes('failed')
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <CloudUpload className={`w-5 h-5 ${isMigrating ? 'animate-pulse' : ''} ${
              migrationResult?.includes('successfully') ? 'text-green-600' : 
              migrationResult?.includes('failed') ? 'text-red-600' : 'text-blue-600'
            }`} />
            <h3 className="font-semibold">Data Migration Status</h3>
          </div>
          <p className="text-sm">{isMigrating ? 'Migrating data to Supabase...' : migrationResult}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-mlb-navy" />
            <div>
              <h3 className="text-lg font-semibold text-mlb-navy">Total Users</h3>
              <p className="text-3xl font-bold text-mlb-navy">{data.users.length}</p>
            </div>
          </div>
          <button
            onClick={handleDownloadUsers}
            className="w-full bg-mlb-navy text-white px-4 py-2 rounded-md hover:bg-mlb-navy-light transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Users CSV
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-mlb-red" />
            <div>
              <h3 className="text-lg font-semibold text-mlb-navy">Drill Results</h3>
              <p className="text-3xl font-bold text-mlb-red">{data.drillResults.length}</p>
            </div>
          </div>
          <button
            onClick={handleDownloadDrillResults}
            className="w-full bg-mlb-red text-white px-4 py-2 rounded-md hover:bg-mlb-red-dark transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Results CSV
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-mlb-navy" />
            <div>
              <h3 className="text-lg font-semibold text-mlb-navy">Training Notes</h3>
              <p className="text-3xl font-bold text-mlb-navy">{data.notes.length}</p>
            </div>
          </div>
          <button
            onClick={handleDownloadNotes}
            className="w-full bg-mlb-navy text-white px-4 py-2 rounded-md hover:bg-mlb-navy-light transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Notes CSV
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-mlb-red" />
            <div>
              <h3 className="text-lg font-semibold text-mlb-navy">User Statistics</h3>
              <p className="text-sm text-gray-500">Compiled stats</p>
            </div>
          </div>
          <button
            onClick={handleDownloadUserStats}
            className="w-full bg-mlb-red text-white px-4 py-2 rounded-md hover:bg-mlb-red-dark transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Stats CSV
          </button>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-mlb-navy" />
          <h2 className="text-xl font-semibold text-mlb-navy">Data Management</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-mlb-navy mb-2">Migrate to Supabase</h3>
            <p className="text-sm text-gray-600 mb-3">Push all localStorage data to Supabase database</p>
            <button
              onClick={handleMigrateToSupabase}
              disabled={isMigrating}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-md hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <CloudUpload className={`w-4 h-4 ${isMigrating ? 'animate-bounce' : ''}`} />
              {isMigrating ? 'Migrating...' : 'Migrate to Supabase'}
            </button>
          </div>
          
          <div>
            <h3 className="font-semibold text-mlb-navy mb-2">Export Data</h3>
            <p className="text-sm text-gray-600 mb-3">Download complete system backup</p>
            <button
              onClick={handleExportAllData}
              className="w-full bg-mlb-navy text-white px-4 py-2 rounded-md hover:bg-mlb-navy-light transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Complete Backup
            </button>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="font-semibold text-mlb-navy mb-2">Import Data</h3>
            <p className="text-sm text-gray-600 mb-3">Restore from backup file</p>
            <label className="w-full bg-mlb-red text-white px-4 py-2 rounded-md hover:bg-mlb-red-dark transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Import Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-mlb-navy mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-mlb-navy mb-2">
              {data.users.filter(u => u.level === 'rookie').length}
            </div>
            <div className="text-sm text-gray-500">Rookie Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-mlb-navy mb-2">
              {data.users.filter(u => u.level === 'AA').length}
            </div>
            <div className="text-sm text-gray-500">AA Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-mlb-navy mb-2">
              {data.users.filter(u => u.level === 'AAA').length}
            </div>
            <div className="text-sm text-gray-500">AAA Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-mlb-navy mb-2">
              {data.users.filter(u => u.level === 'The Show').length}
            </div>
            <div className="text-sm text-gray-500">The Show Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {data.drillResults.filter(r => r.result === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-500">Confirmed Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-mlb-red mb-2">
              {data.drillResults.filter(r => r.result === 'overturned').length}
            </div>
            <div className="text-sm text-gray-500">Overturned Calls</div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-purple-50 rounded-lg p-6">
        <h3 className="font-semibold text-mlb-navy mb-2">Admin Features</h3>
        <ul className="text-mlb-navy text-sm space-y-1">
          <li>• Export all user data including levels and locations</li>
          <li>• Download comprehensive drill results with timestamps</li>
          <li>• Export training notes with engagement metrics</li>
          <li>• Generate user performance statistics reports</li>
          <li>• Complete data backup and restore functionality</li>
          <li>• Automatic data integrity checking and validation</li>
          <li>• Secure user management with admin-only deletion</li>
          <li>• Automatic orphaned data filtering in CSV exports</li>
          <li>• Orphaned data cleanup tools and reporting</li>
        </ul>
      </div>
      
      {/* User Management Modal */}
      <UserManagement 
        isOpen={showUserManagement} 
        onClose={() => setShowUserManagement(false)} 
      />
      
      {/* Session Management Modal */}
      <SessionManagement 
        isOpen={showSessionManagement} 
        onClose={() => setShowSessionManagement(false)} 
      />
    </div>
  );
};

export default AdminDashboard;