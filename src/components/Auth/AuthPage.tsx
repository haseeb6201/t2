import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { Trophy, ChevronRight, Star, Shield, Users, BarChart3, Key, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showOfflineMode, setShowOfflineMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetError, setResetError] = useState('');

  // Show offline mode option after 5 seconds if still on auth page
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOfflineMode(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus('loading');
    setResetError('');
    
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}?type=recovery`;
      console.log('Password reset redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl
      });
      
      if (error) {
        setResetError(error.message);
        setResetStatus('error');
        return;
      }
      
      setResetStatus('success');
    } catch (error) {
      setResetError('Failed to send password reset email. Please try again.');
      setResetStatus('error');
    }
  };

  const resetPasswordReset = () => {
    setShowPasswordReset(false);
    setResetEmail('');
    setResetStatus('idle');
    setResetError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-mlb-navy to-slate-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-mlb-red/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-mlb-red/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-mlb-navy/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left side - Hero Content */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-8 xl:px-16 2xl:px-24">
          <div className="max-w-xl">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4 mb-12">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl bg-white">
                  <img src="/EL1_Logo.png" alt="EL Logo" className="w-16 h-16 object-contain" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-mlb-red rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Umpire Performance</h1>
                <p className="text-mlb-red font-medium text-lg">Elite Training Platform</p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl font-bold text-white leading-tight mb-6">
                  Elevate Your
                  <span className="block text-transparent bg-gradient-to-r from-mlb-red to-red-400 bg-clip-text">
                    Officiating
                  </span>
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Professional-grade training platform designed to enhance your skills, 
                  track your progress, and connect you with elite umpire development resources.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-mlb-red/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-mlb-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Advanced Analytics</h3>
                    <p className="text-gray-400 text-sm">Real-time performance tracking and detailed insights</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-mlb-red/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-mlb-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Expert Evaluation</h3>
                    <p className="text-gray-400 text-sm">Game film analysis by professional evaluators</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-mlb-red/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-mlb-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Proven Methods</h3>
                    <p className="text-gray-400 text-sm">Training protocols used by professional umpires</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl bg-white">
                  <img src="/EL1_Logo.png" alt="EL Logo" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Umpire Performance</h1>
                  <p className="text-mlb-red font-medium text-sm sm:text-base">Elite Training Platform</p>
                </div>
              </div>
            </div>

            {/* Auth Form Container */}
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="p-6 sm:p-8">
                {/* Form Toggle */}
                <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                      isLogin
                        ? 'bg-mlb-red text-white shadow-lg'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                      !isLogin
                        ? 'bg-mlb-red text-white shadow-lg'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Form Content */}
                {showPasswordReset ? (
                  /* Password Reset Form */
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-mlb-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Key className="w-8 h-8 text-mlb-red" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
                      <p className="text-gray-400">Enter your email address and we'll send you a reset link</p>
                    </div>

                    {resetStatus === 'success' ? (
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <Mail className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Check Your Email</h3>
                          <p className="text-gray-400 mb-4">
                            We've sent a password reset link to <strong>{resetEmail}</strong>
                          </p>
                          <p className="text-gray-400 text-sm mb-6">
                            Please check your inbox and click the link to reset your password.
                          </p>
                        </div>
                        <button
                          onClick={resetPasswordReset}
                          className="bg-gradient-to-r from-mlb-navy to-mlb-navy-dark text-white py-3 px-6 rounded-xl hover:from-mlb-navy-dark hover:to-mlb-navy transition-all duration-200 font-semibold shadow-lg flex items-center gap-2 mx-auto"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to Sign In
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handlePasswordReset} className="space-y-6">
                        <div>
                          <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address
                          </label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                              <Mail className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                              id="reset-email"
                              type="email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mlb-red focus:border-transparent backdrop-blur-sm transition-all duration-200"
                              placeholder="Enter your email address"
                              required
                            />
                          </div>
                        </div>

                        {resetError && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <p className="text-red-400 text-sm">{resetError}</p>
                          </div>
                        )}

                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={resetPasswordReset}
                            className="flex-1 bg-gray-600 text-white py-4 px-6 rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={resetStatus === 'loading'}
                            className="flex-1 bg-gradient-to-r from-mlb-red to-mlb-red-dark text-white py-4 px-6 rounded-xl hover:from-mlb-red-dark hover:to-mlb-red disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg flex items-center justify-center gap-2"
                          >
                            {resetStatus === 'loading' ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              'Send Reset Link'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : isLogin ? (
                  <LoginForm onToggleMode={() => setIsLogin(false)} onShowPasswordReset={() => setShowPasswordReset(true)} />
                ) : (
                  <SignupForm onToggleMode={() => setIsLogin(true)} />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 sm:mt-8">
              <p className="text-gray-400 text-sm">
                © 2024 Umpire Performance. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
