import React, { useState, useEffect } from 'react';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import { supabase } from './supabaseClient';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if user has valid reset session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setIsValidSession(true);
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields / Wypełnij wszystkie pola');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters / Hasło musi mieć co najmniej 6 znaków');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match / Hasła nie są identyczne');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update password / Nie udało się zaktualizować hasła');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div key="reset-invalid-container" className="relative w-full h-screen overflow-hidden bg-slate-950">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none fixed -top-48 -left-48" />
          <div className="w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none fixed -bottom-32 -right-32" />
        </div>
        <div className="relative z-10 flex items-center justify-center w-full h-full px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">
              Invalid or Expired Link
            </h2>
            <p className="text-gray-200 drop-shadow-md mb-6">
              Please request a new password reset link
            </p>
            <a
              href="/"
              className="inline-block px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key="reset-valid-container" className="relative w-full h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none fixed -top-48 -left-48" />
        <div className="w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none fixed -bottom-32 -right-32" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex items-center justify-center w-full h-full px-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-3xl border border-white/20">
          {success ? (
            // Success Message
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-500/20 rounded-full backdrop-blur-sm">
                  <FiCheckCircle 
                    size={48} 
                    className="text-green-400 drop-shadow-lg"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">
                Password Updated!
              </h2>
              <p className="text-gray-200 drop-shadow-md mb-6">
                Your password has been successfully changed. You will be redirected to login shortly.
              </p>
              <div className="animate-pulse">
                <p className="text-sm text-gray-300">Redirecting in 3 seconds...</p>
              </div>
            </div>
          ) : (
            // Reset Password Form
            <>
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <FiLock 
                    size={32} 
                    className="text-blue-400"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white mb-2 text-center">
                Reset Password
              </h1>
              <p className="text-gray-300 text-sm text-center mb-6">
                Enter your new password below
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    New Password / Nowe Hasło
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Confirm Password / Potwierdź Hasło
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? 'Updating...' : 'Update Password / Zmień Hasło'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="/"
                  className="text-blue-300 hover:text-blue-200 text-sm font-medium transition"
                >
                  Back to Sign In
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
