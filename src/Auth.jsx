import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import appLogo from './assets/logonewtransparent.png';

const Auth = () => {
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
    <div key="auth-container" className="app-main relative overflow-hidden">
      {/* Dynamic background with theme accent colors */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div style={{ 
          backgroundColor: `var(--accent)/10`,
          opacity: '0.3'
        }} className="w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none fixed -top-48 -left-48" />
        <div style={{ 
          backgroundColor: `var(--accent)/10`,
          opacity: '0.2'
        }} className="w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none fixed -bottom-32 -right-32" />
      </div>

      <div className="ui-center">
        <div style={{ 
          backgroundColor: `var(--card)/80`,
          borderColor: 'var(--border)'
        }} className="w-full max-w-sm p-8 rounded-3xl backdrop-blur-3xl border">
          <div className="flex justify-center mb-8">
            <img src={appLogo} alt="Trackd" className="h-8 w-auto object-contain" />
          </div>

          {isResetPassword ? (
            // Reset Password Form
            <div key="reset-password-form">
              <h2 style={{ color: 'var(--text)' }} className="text-xl font-semibold mb-6 text-center">
                Reset Password
              </h2>
              {resetSuccess ? (
                <div style={{
                  backgroundColor: 'var(--accent)/20',
                  borderColor: 'var(--accent)',
                  color: 'var(--text)'
                }} className="p-4 rounded-lg border text-center mb-4">
                  Check your inbox! / Sprawdź swoją skrzynkę e-mail!
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-2 opacity-80">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)'
                      }}
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none transition"
                      required
                    />
                  </div>
                  {error && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'var(--accent)',
                      color: 'var(--text)'
                    }} className="p-3 rounded-lg border text-sm">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--text)'
                    }}
                    className="w-full px-4 py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
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
                  style={{ color: 'var(--accent)' }}
                  className="hover:opacity-80 text-sm font-medium transition"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            // Login/SignUp Form
            <div key="login-signup-form">
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-2 opacity-80">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)'
                    }}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-2 opacity-80">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)'
                    }}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none transition"
                    required
                  />
                </div>
                {error && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'var(--accent)',
                    color: 'var(--text)'
                  }} className="p-3 rounded-lg border text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'white'
                  }}
                  className="w-full px-4 py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
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
                    style={{ color: 'var(--accent)' }}
                    className="hover:opacity-80 text-sm font-medium transition"
                  >
                    Forgot password? / Zapomniałeś hasła?
                  </button>
                </div>
              )}
              <div className="mt-6 text-center">
                <p style={{ color: 'var(--text)' }} className="opacity-60 text-sm">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </p>
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  style={{ color: 'var(--accent)' }}
                  className="hover:opacity-80 text-sm font-medium mt-2 transition"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
