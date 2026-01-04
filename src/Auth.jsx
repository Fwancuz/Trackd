import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import Aurora from './Aurora';

const Auth = ({ onAuthStateChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'https://trackd.pl/?verified=true',
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://trackd.pl/reset-password',
      });
      if (error) throw error;
      setResetSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-main">
      <div className="aurora-bg">
        <Aurora
          colorStops={['#3A29FF', '#FF94B4', '#FF3232']}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      <div className="ui-center">
        <div className="w-full max-w-sm p-8 rounded-3xl bg-white/10 backdrop-blur-3xl border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            Trackd
          </h1>

          {isResetPassword ? (
            // Reset Password Form
            <>
              <h2 className="text-xl font-semibold text-white mb-6 text-center">
                Reset Password
              </h2>
              {resetSuccess ? (
                <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-center mb-4">
                  Check your inbox! / Sprawdź swoją skrzynkę e-mail!
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
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
                    {loading ? 'Loading...' : 'Send reset link / Wyślij link'}
                  </button>
                </form>
              )}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsResetPassword(false);
                    setResetSuccess(false);
                    setError('');
                    setEmail('');
                  }}
                  className="text-blue-300 hover:text-blue-200 text-sm font-medium transition"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          ) : (
            // Login/SignUp Form
            <>
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </form>
              {!isSignUp && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setIsResetPassword(true);
                      setError('');
                    }}
                    className="text-blue-300 hover:text-blue-200 text-sm font-medium transition"
                  >
                    Forgot password? / Zapomniałeś hasła?
                  </button>
                </div>
              )}
              <div className="mt-6 text-center">
                <p className="text-white/60 text-sm">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </p>
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-blue-300 hover:text-blue-200 text-sm font-medium mt-2 transition"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
