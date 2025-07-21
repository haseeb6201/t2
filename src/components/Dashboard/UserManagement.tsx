import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';
import { supabaseStorage, SupabaseStorageError } from '../../utils/supabaseStorage';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Save,
  X,
  UserCheck,
  UserX,
  Mail,
  MapPin,
  Award,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    level: 'rookie' as 'rookie' | 'AA' | 'AAA' | 'The Show',
    location: 'Philadelphia' as 'Philadelphia' | 'Seattle' | 'Mobile Camp',
    city: '',
    state: '',
    educationLevel: 'High School' as 'Youth' | 'High School' | 'NAIA' | 'NCAA D1' | 'NCAA D2' | 'NCAA D3',
    conferencesWorked: '',
    isAdmin: false,
    isEvaluator: false
  });

  // Separate password state for new users only
  const [newPassword, setNewPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, levelFilter, locationFilter]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setError('');
    
    try {
      const allUsers = await supabaseStorage.getUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof SupabaseStorageError ? err.message : 'Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(user => user.level === levelFilter);
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(user => user.location === locationFilter);
    }

    setFilteredUsers(filtered);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      level: 'rookie',
      location: 'Philadelphia',
      city: '',
      state: '',
      educationLevel: 'High School',
      conferencesWorked: '',
      isAdmin: false,
      isEvaluator: false
    });
    setNewPassword('');
    setFormErrors({});
    setError('');
    setSuccess('');
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.username.trim()) errors.username = 'Username is required';
    
    // Only validate password for new users
    if (!editingUser) {
      if (!newPassword.trim()) errors.password = 'Password is required';
      if (newPassword.length < 6) errors.password = 'Password must be at least 6 characters';
    }

    // Check for duplicate username
    const existingUser = users.find(u => 
      u.username === formData.username && u.id !== editingUser?.id
    );
    if (existingUser) errors.username = 'Username already exists';

    // Check for duplicate email
    const existingEmail = users.find(u => 
      u.email === formData.email && u.id !== editingUser?.id
    );
    if (existingEmail) errors.email = 'Email already exists';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: newPassword,
        user_metadata: {
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName
        },
        email_confirm: true
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create user account');
      }

      // Create user profile in users table (upsert)
      const userProfile = {
        id: authData.user.id,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        level: formData.level,
        location: formData.location,
        city: formData.city || undefined,
        state: formData.state || undefined,
        educationLevel: formData.educationLevel,
        conferencesWorked: formData.conferencesWorked || undefined,
        isAdmin: formData.isAdmin,
        isEvaluator: formData.isEvaluator
      };

      await supabaseStorage.createUser(userProfile);

      setSuccess(`User ${formData.firstName} ${formData.lastName} created successfully!`);
      await loadUsers();
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof SupabaseStorageError ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      level: user.level,
      location: user.location,
      city: user.city || '',
      state: user.state || '',
      educationLevel: user.educationLevel || 'High School',
      conferencesWorked: user.conferencesWorked || '',
      isAdmin: user.isAdmin || false,
      isEvaluator: user.isEvaluator || false
    });
    setShowAddForm(true);
  };

  const handleUpdateUser = async () => {
    if (!validateForm() || !editingUser) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const updatedUser = {
        ...editingUser,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        level: formData.level,
        location: formData.location,
        city: formData.city || undefined,
        state: formData.state || undefined,
        educationLevel: formData.educationLevel,
        conferencesWorked: formData.conferencesWorked || undefined,
        isAdmin: formData.isAdmin,
        isEvaluator: formData.isEvaluator
      };

      await supabaseStorage.updateUser(editingUser.id, updatedUser);

      setSuccess(`User ${formData.firstName} ${formData.lastName} updated successfully!`);
      await loadUsers();
      setShowAddForm(false);
      setEditingUser(null);
      resetForm();
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof SupabaseStorageError ? err.message : 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Prevent deletion of master admin account
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && userToDelete.username === 'umpireperformance') {
      setError('Cannot delete master admin account');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      // Delete user from Supabase Auth (this will cascade delete the profile)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setSuccess('User deleted successfully');
      await loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof SupabaseStorageError ? err.message : 'Failed to delete user');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      handleUpdateUser();
    } else {
      handleAddUser();
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingUser(null);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-mlb-navy to-mlb-navy-light px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Member Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
                >
                  <option value="all">All Levels</option>
                  <option value="rookie">Rookie</option>
                  <option value="AA">AA</option>
                  <option value="AAA">AAA</option>
                  <option value="The Show">The Show</option>
                </select>

                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-mlb-navy focus:border-transparent focus:bg-white transition-all duration-200"
                >
                  <option value="all">All Locations</option>
                  <option value="Philadelphia">Philadelphia</option>
                  <option value="Seattle">Seattle</option>
                  <option value="Mobile Camp">Mobile Camp</option>
                </select>
              </div>

              {/* Add User Button */}
              <button
                onClick={() => setShowAddForm(true)}
                disabled={isLoadingUsers}
                className="bg-gradient-to-r from-mlb-navy to-mlb-navy-light text-white px-6 py-3 rounded-xl hover:from-mlb-navy-light hover:to-mlb-navy disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-mlb-navy">{filteredUsers.length}</div>
                <div className="text-sm text-gray-500">Total Members</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-mlb-red">{filteredUsers.filter(u => u.isAdmin).length}</div>
                <div className="text-sm text-gray-500">Admins</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{filteredUsers.filter(u => u.level === 'The Show').length}</div>
                <div className="text-sm text-gray-500">The Show</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredUsers.filter(u => u.level === 'rookie').length}</div>
                <div className="text-sm text-gray-500">Rookies</div>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <h3 className="text-lg font-bold text-mlb-navy mb-4">
                {editingUser ? 'Edit Member' : 'Add New Member'}
              </h3>
              
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200 ${
                        formErrors.firstName ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Enter first name"
                      disabled={isLoading}
                    />
                    {formErrors.firstName && <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200 ${
                        formErrors.lastName ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Enter last name"
                      disabled={isLoading}
                    />
                    {formErrors.lastName && <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200 ${
                        formErrors.email ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Enter email address"
                      disabled={isLoading}
                    />
                    {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200 ${
                        formErrors.username ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Enter username"
                      disabled={isLoading}
                    />
                    {formErrors.username && <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>}
                  </div>

                  {/* Only show password field for new users */}
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200 ${
                          formErrors.password ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Enter password"
                        disabled={isLoading}
                      />
                      {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200"
                      disabled={isLoading}
                    >
                      <option value="rookie">Rookie</option>
                      <option value="AA">AA</option>
                      <option value="AAA">AAA</option>
                      <option value="The Show">The Show</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200"
                      disabled={isLoading}
                    >
                      <option value="Philadelphia">Philadelphia</option>
                      <option value="Seattle">Seattle</option>
                      <option value="Mobile Camp">Mobile Camp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200"
                      placeholder="Enter city"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200"
                      placeholder="Enter state"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education Level</label>
                    <select
                      value={formData.educationLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, educationLevel: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200"
                      disabled={isLoading}
                    >
                      <option value="Youth">Youth</option>
                      <option value="High School">High School</option>
                      <option value="NAIA">NAIA</option>
                      <option value="NCAA D1">NCAA D1</option>
                      <option value="NCAA D2">NCAA D2</option>
                      <option value="NCAA D3">NCAA D3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Conferences Worked</label>
                    <input
                      type="text"
                      value={formData.conferencesWorked}
                      onChange={(e) => setFormData(prev => ({ ...prev, conferencesWorked: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200"
                      placeholder="Enter conferences worked"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isAdmin}
                        onChange={(e) => setFormData(prev => ({ ...prev, isAdmin: e.target.checked }))}
                        className="w-4 h-4 text-mlb-navy focus:ring-mlb-navy border-gray-300 rounded"
                        disabled={isLoading}
                      />
                      <span className="text-sm font-medium text-gray-700">Admin privileges</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isEvaluator}
                        onChange={(e) => setFormData(prev => ({ ...prev, isEvaluator: e.target.checked }))}
                        className="w-4 h-4 text-mlb-red focus:ring-mlb-red border-gray-300 rounded"
                        disabled={isLoading}
                      />
                      <span className="text-sm font-medium text-gray-700">Evaluator privileges</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-mlb-navy to-mlb-navy-light text-white px-6 py-3 rounded-xl hover:from-mlb-navy-light hover:to-mlb-navy disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isLoading ? 'Saving...' : editingUser ? 'Update Member' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
                    disabled={isLoading}
                    className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200/50">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-mlb-navy" />
                <span className="ml-2 text-mlb-navy">Loading members...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level & Location</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Award className="w-4 h-4 text-mlb-navy" />
                              <span className="font-medium text-mlb-navy">{user.level}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="w-4 h-4" />
                              {user.location}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {user.isAdmin && user.isEvaluator ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-mlb-red">
                                  <UserCheck className="w-4 h-4" />
                                  <span className="text-xs font-medium">Admin</span>
                                </div>
                                <div className="flex items-center gap-1 text-mlb-navy">
                                  <UserCheck className="w-4 h-4" />
                                  <span className="text-xs font-medium">Evaluator</span>
                                </div>
                              </div>
                            ) : user.isAdmin ? (
                              <div className="flex items-center gap-1 text-mlb-red">
                                <UserCheck className="w-4 h-4" />
                                <span className="text-sm font-medium">Admin</span>
                              </div>
                            ) : user.isEvaluator ? (
                              <div className="flex items-center gap-1 text-mlb-navy">
                                <UserCheck className="w-4 h-4" />
                                <span className="text-sm font-medium">Evaluator</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-500">
                                <UserX className="w-4 h-4" />
                                <span className="text-sm">Member</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              disabled={isLoading}
                              className="text-mlb-navy hover:text-mlb-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.username === 'umpireperformance' || isLoading}
                              className="text-mlb-red hover:text-mlb-red-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoadingUsers && filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No members found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;