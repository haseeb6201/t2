import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Lock, ChevronRight } from 'lucide-react';

interface SignupFormProps {
  onToggleMode: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onToggleMode }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [level, setLevel] = useState<'rookie' | 'AA' | 'AAA' | 'The Show'>('rookie');
  const [location, setLocation] = useState<'Philadelphia' | 'Seattle' | 'Mobile Camp'>('Philadelphia');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [educationLevel, setEducationLevel] = useState<'Youth' | 'High School' | 'NAIA' | 'NCAA D1' | 'NCAA D2' | 'NCAA D3'>('High School');
  const [conferencesWorked, setConferencesWorked] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    const result = await signup(firstName, lastName, email, username, password, level, location, city, state, educationLevel, conferencesWorked);
    if (!result.success) {
      setError(result.message);
    } else {
      setShowEmailConfirmation(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {showEmailConfirmation ? (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-gray-400 mb-4">
              We've sent a confirmation link to <strong>{email}</strong>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Please check your inbox and click the confirmation link to activate your account before signing in.
            </p>
          </div>
          <button
            onClick={onToggleMode}
            className="bg-gradient-to-r from-mlb-red to-mlb-red-dark text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:from-mlb-red-dark hover:to-mlb-red shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Join the Elite</h2>
        <p className="text-gray-400">Create your professional umpire account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mlb-red focus:border-transparent backdrop-blur-sm transition-all duration-200"
              placeholder="First name"
              autoComplete="given-name"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck="false"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mlb-red focus:border-transparent backdrop-blur-sm transition-all duration-200"
              placeholder="Last name"
              autoComplete="family-name"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck="false"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mlb-red focus:border-transparent backdrop-blur-sm transition-all duration-200"
              placeholder="Enter your email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mlb-red focus:border-transparent backdrop-blur-sm transition-all duration-200"
              placeholder="Choose a username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mlb-red focus:border-transparent backdrop-blur-sm transition-all duration-200"
                placeholder="Password"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mlb-red focus:border-transparent backdrop-blur-sm transition-all duration-200"
                placeholder="Confirm"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-300 mb-2">
              Experience Level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as 'rookie' | 'AA' | 'AAA' | 'The Show')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-mlb-red focus:border-transparent backdrop-blur-sm transition-all duration-200"
              required
            >
              <option value="rookie" className="bg-mlb-navy text-white">Rookie</option>
              <option value="AA" className="bg-mlb-navy text-white">AA</option>
              <option value="AAA" className="bg-mlb-navy text-white">AAA</option>
              <option value="The Show" className="bg-mlb-navy text-white">The Show</option>
            </select>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value as 'Philadelphia' | 'Seattle' | 'Mobile Camp')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-mlb-red focus:border-transparent backdrop-blur-sm transition-all duration-200"
              required
            >
              <option value="Philadelphia" className="bg-mlb-navy text-white">Philadelphia</option>
              <option value="Seattle" className="bg-mlb-navy text-white">Seattle</option>
              <option value="Mobile Camp" className="bg-mlb-navy text-white">Mobile Camp</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-300 mb-2">
            Current Level
          </label>
          <select
            id="educationLevel"
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value as 'Youth' | 'High School' | 'NAIA' | 'NCAA D1' | 'NCAA D2' | 'NCAA D3')}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-mlb-red focus:border-transparent backdrop-blur-sm transition-all duration-200"
            required
          >
            <option value="Youth" className="bg-mlb-navy text-white">Youth</option>
            <option value="High School" className="bg-mlb-navy text-white">High School</option>
            <option value="NAIA" className="bg-mlb-navy text-white">NAIA</option>
            <option value="NCAA D1" className="bg-mlb-navy text-white">NCAA D1</option>
            <option value="NCAA D2" className="bg-mlb-navy text-white">NCAA D2</option>
            <option value="NCAA D3" className="bg-mlb-navy text-white">NCAA D3</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-mlb-red to-mlb-red-dark text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:from-mlb-red-dark hover:to-mlb-red disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Create Account
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-gray-400 text-sm">
          Already have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-mlb-red hover:text-mlb-red-dark font-semibold transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
        </>
      )}
    </div>
  );
};

export default SignupForm;