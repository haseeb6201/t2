import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';
import { storageUtils } from '../../utils/storage';
import { 
  User as UserIcon, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Trophy,
  Camera,
  Save,
  X,
  Edit,
  Eye,
  EyeOff,
  Home,
  Award,
  FileText,
  Settings,
  Video,
  RotateCcw
} from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [dashboardMode, setDashboardMode] = useState<'admin' | 'evaluator'>('admin');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
    city: user?.city || '',
    state: user?.state || '',
    educationLevel: user?.educationLevel || 'High School' as 'Youth' | 'High School' | 'NAIA' | 'NCAA D1' | 'NCAA D2' | 'NCAA D3',
    conferencesWorked: user?.conferencesWorked || '',
    profilePhoto: user?.profilePhoto || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  // Check if user has both admin and evaluator permissions
  const hasMultipleRoles = user.isAdmin && user.isEvaluator;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePhoto: 'Image must be less than 2MB' }));
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profilePhoto: 'Please select an image file' }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, profilePhoto: result }));
        setErrors(prev => ({ ...prev, profilePhoto: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';

    // Check for duplicate username (excluding current user)
    const existingUser = storageUtils.getUserByUsername(formData.username);
    if (existingUser && existingUser.id !== user.id) {
      newErrors.username = 'Username already exists';
    }

    // Check for duplicate email (excluding current user)
    const existingEmail = storageUtils.getUserByEmail(formData.email);
    if (existingEmail && existingEmail.id !== user.id) {
      newErrors.email = 'Email already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    } else if (passwordData.currentPassword !== user.password) {
      newErrors.currentPassword = 'Current password is incorrect';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;

    setIsLoading(true);
    try {
      const updatedUser: User = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        city: formData.city,
        state: formData.state,
        educationLevel: formData.educationLevel,
        conferencesWorked: formData.conferencesWorked,
        profilePhoto: formData.profilePhoto
      };

      storageUtils.updateUser(user.id, updatedUser);
      
      // Update current user in localStorage
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      
      // Force a page reload to update the auth context
      window.location.reload();
      
    } catch (error) {
      setErrors({ general: 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setIsLoading(true);
    try {
      const updatedUser: User = {
        ...user,
        password: passwordData.newPassword
      };

      storageUtils.updateUser(user.id, updatedUser);
      
      // Update current user in localStorage
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      alert('Password changed successfully!');
      
    } catch (error) {
      setErrors({ general: 'Failed to change password' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchDashboard = () => {
    // Store the selected mode in localStorage for persistence
    localStorage.setItem('dashboard_mode', dashboardMode);
    // Reload the page to switch to the selected dashboard
    window.location.href = '/';
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      city: user.city || '',
      state: user.state || '',
      educationLevel: user.educationLevel || 'High School',
      conferencesWorked: user.conferencesWorked || '',
      profilePhoto: user.profilePhoto || ''
    });
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl bg-white">
            <img src="/EL1_Logo.png" alt="EL Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent">My Profile</h1>
        </div>
        <p className="text-gray-500 text-lg font-medium">Manage your account settings and profile information</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-2 bg-gray-100/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'account'
                ? 'bg-white text-mlb-navy shadow-lg'
                : 'text-gray-600 hover:text-mlb-navy'
            }`}
          >
            Account Settings
          </button>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
        <div className="p-8">
          {/* Dashboard Mode Selector - Only for users with multiple roles */}
          {hasMultipleRoles && (
            <div className="mb-8 bg-gradient-to-r from-mlb-navy/5 to-mlb-red/5 rounded-xl p-6 border border-gray-200/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-mlb-navy to-mlb-red rounded-lg flex items-center justify-center shadow-md">
                  <RotateCcw className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-mlb-navy">Dashboard Mode</h3>
                  <p className="text-gray-500 text-sm">Switch between your administrator and evaluator roles</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex space-x-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/50">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="radio"
                      id="admin-mode"
                      name="dashboard-mode"
                      value="admin"
                      checked={dashboardMode === 'admin'}
                      onChange={(e) => setDashboardMode(e.target.value as 'admin' | 'evaluator')}
                      className="w-4 h-4 text-mlb-navy focus:ring-mlb-navy border-gray-300"
                    />
                    <label htmlFor="admin-mode" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-mlb-navy to-mlb-navy-dark rounded-xl flex items-center justify-center shadow-md">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-mlb-navy">Administrator Dashboard</div>
                        <div className="text-sm text-gray-500">Manage users, export data, and system administration</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="flex space-x-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/50">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="radio"
                      id="evaluator-mode"
                      name="dashboard-mode"
                      value="evaluator"
                      checked={dashboardMode === 'evaluator'}
                      onChange={(e) => setDashboardMode(e.target.value as 'admin' | 'evaluator')}
                      className="w-4 h-4 text-mlb-red focus:ring-mlb-red border-gray-300"
                    />
                    <label htmlFor="evaluator-mode" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-mlb-red to-mlb-red-dark rounded-xl flex items-center justify-center shadow-md">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-mlb-red">Evaluator Dashboard</div>
                        <div className="text-sm text-gray-500">Create game film evaluations and assess umpire performance</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleSwitchDashboard}
                    className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 flex items-center gap-2 ${
                      dashboardMode === 'admin'
                        ? 'bg-gradient-to-r from-mlb-navy to-mlb-navy-light text-white hover:from-mlb-navy-light hover:to-mlb-navy'
                        : 'bg-gradient-to-r from-mlb-red to-mlb-red-dark text-white hover:from-mlb-red-dark hover:to-mlb-red'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Switch to {dashboardMode === 'admin' ? 'Administrator' : 'Evaluator'} Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'profile' ? (
            /* Profile Tab */
            <div className="space-y-8">
              {/* Profile Photo Section */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-mlb-navy to-mlb-navy-dark shadow-xl">
                    {formData.profilePhoto ? (
                      <img
                        src={formData.profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-mlb-red rounded-full flex items-center justify-center shadow-lg hover:bg-mlb-red-dark transition-colors"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {errors.profilePhoto && (
                  <p className="text-red-500 text-sm mt-2">{errors.profilePhoto}</p>
                )}
                <h3 className="text-2xl font-bold text-mlb-navy mt-4">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-gray-500 font-medium">@{user.username}</p>
                <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    <span>{user.level}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-mlb-navy">Profile Information</h4>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-mlb-navy text-white rounded-lg hover:bg-mlb-navy-light transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing 
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy border-gray-200' 
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        } ${errors.firstName ? 'border-red-300' : ''}`}
                      />
                      {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing 
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy border-gray-200' 
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        } ${errors.lastName ? 'border-red-300' : ''}`}
                      />
                      {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Home className="w-4 h-4 inline mr-1" />
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter your city"
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing 
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy border-gray-200' 
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        State
                      </label>
                      <select
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing 
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy border-gray-200' 
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        <option value="">Select a state</option>
                        <option value="AL">Alabama</option>
                        <option value="AK">Alaska</option>
                        <option value="AZ">Arizona</option>
                        <option value="AR">Arkansas</option>
                        <option value="CA">California</option>
                        <option value="CO">Colorado</option>
                        <option value="CT">Connecticut</option>
                        <option value="DE">Delaware</option>
                        <option value="FL">Florida</option>
                        <option value="GA">Georgia</option>
                        <option value="HI">Hawaii</option>
                        <option value="ID">Idaho</option>
                        <option value="IL">Illinois</option>
                        <option value="IN">Indiana</option>
                        <option value="IA">Iowa</option>
                        <option value="KS">Kansas</option>
                        <option value="KY">Kentucky</option>
                        <option value="LA">Louisiana</option>
                        <option value="ME">Maine</option>
                        <option value="MD">Maryland</option>
                        <option value="MA">Massachusetts</option>
                        <option value="MI">Michigan</option>
                        <option value="MN">Minnesota</option>
                        <option value="MS">Mississippi</option>
                        <option value="MO">Missouri</option>
                        <option value="MT">Montana</option>
                        <option value="NE">Nebraska</option>
                        <option value="NV">Nevada</option>
                        <option value="NH">New Hampshire</option>
                        <option value="NJ">New Jersey</option>
                        <option value="NM">New Mexico</option>
                        <option value="NY">New York</option>
                        <option value="NC">North Carolina</option>
                        <option value="ND">North Dakota</option>
                        <option value="OH">Ohio</option>
                        <option value="OK">Oklahoma</option>
                        <option value="OR">Oregon</option>
                        <option value="PA">Pennsylvania</option>
                        <option value="RI">Rhode Island</option>
                        <option value="SC">South Carolina</option>
                        <option value="SD">South Dakota</option>
                        <option value="TN">Tennessee</option>
                        <option value="TX">Texas</option>
                        <option value="UT">Utah</option>
                        <option value="VT">Vermont</option>
                        <option value="VA">Virginia</option>
                        <option value="WA">Washington</option>
                        <option value="WV">West Virginia</option>
                        <option value="WI">Wisconsin</option>
                        <option value="WY">Wyoming</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <GraduationCap className="w-4 h-4 inline mr-1" />
                        Current Level
                      </label>
                      <select
                        value={formData.educationLevel}
                        onChange={(e) => handleInputChange('educationLevel', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing 
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy border-gray-200' 
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        <option value="Youth">Youth</option>
                        <option value="High School">High School</option>
                        <option value="NAIA">NAIA</option>
                        <option value="NCAA D1">NCAA D1</option>
                        <option value="NCAA D2">NCAA D2</option>
                        <option value="NCAA D3">NCAA D3</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Conferences Worked
                      </label>
                      <textarea
                        value={formData.conferencesWorked}
                        onChange={(e) => handleInputChange('conferencesWorked', e.target.value)}
                        disabled={!isEditing}
                        placeholder="List the conferences you've worked (e.g., Big Ten, SEC, ACC, etc.)"
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200 ${
                          isEditing 
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy border-gray-200' 
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-mlb-navy to-mlb-navy-light text-white px-6 py-3 rounded-xl hover:from-mlb-navy-light hover:to-mlb-navy disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg"
                      >
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
            </div>
          ) : (
            /* Account Settings Tab */
            <div className="space-y-8">
              {/* Account Information */}
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                  <h4 className="text-lg font-bold text-mlb-navy mb-6">Account Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing 
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy border-gray-200' 
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        } ${errors.email ? 'border-red-300' : ''}`}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <UserIcon className="w-4 h-4 inline mr-1" />
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing 
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy border-gray-200' 
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        } ${errors.username ? 'border-red-300' : ''}`}
                      />
                      {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="mt-6">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-mlb-navy text-white rounded-lg hover:bg-mlb-navy-light transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Account Info
                      </button>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-mlb-navy to-mlb-navy-light text-white px-6 py-3 rounded-xl hover:from-mlb-navy-light hover:to-mlb-navy disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg"
                      >
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Change Password */}
                <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                  <h4 className="text-lg font-bold text-mlb-navy mb-6">Change Password</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200 ${
                            errors.currentPassword ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200 ${
                            errors.newPassword ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-mlb-navy transition-all duration-200 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Confirm new password"
                      />
                      {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="bg-gradient-to-r from-mlb-red to-mlb-red-dark text-white px-6 py-3 rounded-xl hover:from-mlb-red-dark hover:to-mlb-red disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-6 border border-red-200/50">
                  <h4 className="text-lg font-bold text-red-600 mb-4">Account Actions</h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Need to sign out of your account? Click the button below to securely log out.
                  </p>
                  <button
                    onClick={logout}
                    className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-semibold"
                  >
                    Sign Out
                  </button>
                </div>
            </div>
          )}

          {errors.general && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;