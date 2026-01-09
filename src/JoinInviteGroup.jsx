import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { getInviteDetails, acceptInvite } from './services/socialService';
import { useToast } from './ToastContext';
import translations from './translations';

const JoinInviteGroup = ({ language = 'en' }) => {
  const navigate = useNavigate();
  const { code } = useParams(); // Route param is `:code`
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { success: showSuccess, error: showError } = useToast();
  const t = translations[language];

  /**
   * Load and verify invite details on mount
   */
  useEffect(() => {
    const loadInviteDetails = async () => {
      try {
        setLoading(true);
        
        if (!code || code.length === 0) {
          setError('Invalid invite code');
          return;
        }

        const result = await getInviteDetails(code);
        
        if (!result.success) {
          setError(result.error || 'Invalid or expired invite link');
          return;
        }

        setInviteDetails(result.data);
      } catch (err) {
        console.error('Error loading invite details:', err);
        setError('Failed to load invite link. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadInviteDetails();
  }, [code]);

  /**
   * Accept the invite and join the group
   */
  const handleAcceptInvite = async () => {
    try {
      setAccepting(true);
      const result = await acceptInvite(code);

      if (result.success) {
        setSuccess(true);
        showSuccess('🎉 Workout Partner Added!');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Failed to join group');
        showError(result.error || 'Failed to join group');
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Failed to join group. Please try again.');
      showError('Failed to join group. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff';
  const cardColor = getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || '#f5f5f5';
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#000000';
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b82f6';
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e0e0e0';
  const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888888';

  return (
    <div
      style={{ backgroundColor: bgColor, color: textColor }}
      className="w-full h-full min-h-screen flex flex-col items-center justify-center p-4"
    >
      {/* Loading State */}
      {loading && (
        <div style={{ backgroundColor: cardColor }} className="rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Loader className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: accentColor }} />
          <p style={{ color: mutedColor }} className="text-lg">
            Verifying invite link...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{ backgroundColor: cardColor }} className="rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12" style={{ color: '#ef4444' }} />
          </div>
          <h1 style={{ color: textColor }} className="text-2xl font-bold mb-2 text-center">
            {language === 'pl' ? 'Niedochodowa Propozycja' : 'Invalid Invite Link'}
          </h1>
          <p style={{ color: mutedColor }} className="text-center mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ backgroundColor: accentColor }}
            className="w-full px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            {language === 'pl' ? 'Wróć do Strony Głównej' : 'Back to Home'}
          </button>
        </div>
      )}

      {/* Invite Details */}
      {inviteDetails && !error && !loading && (
        <div style={{ backgroundColor: cardColor }} className="rounded-lg shadow-lg p-8 max-w-md w-full">
          {success ? (
            // Success State
            <>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12" style={{ color: accentColor }} />
              </div>
              <h1 style={{ color: textColor }} className="text-2xl font-bold mb-2 text-center">
                {language === 'pl' ? 'Zaproszenie Zaakceptowane!' : 'Welcome to the Group!'}
              </h1>
              <p style={{ color: mutedColor }} className="text-center">
                {language === 'pl'
                  ? 'Jesteś teraz przyjacielem i możesz ćwiczyć razem!'
                  : 'You are now friends and can train together!'}
              </p>
            </>
          ) : (
            // Invite Pending State
            <>
              <h1 style={{ color: textColor }} className="text-2xl font-bold mb-6 text-center">
                {language === 'pl' ? 'Zaproszenie Treningowe' : 'Workout Group Invite'}
              </h1>

              <div style={{ borderColor }} className="border rounded-lg p-4 mb-6">
                <p style={{ color: mutedColor }} className="text-sm mb-2">
                  {language === 'pl' ? 'Zaproszenie od:' : 'Invite from:'}
                </p>
                <p style={{ color: textColor }} className="text-lg font-semibold">
                  {inviteDetails.created_by_username || inviteDetails.created_by_email || 'Friend'}
                </p>
              </div>

              <p style={{ color: mutedColor }} className="text-center mb-6">
                {language === 'pl'
                  ? 'Kliknij poniżej, aby dołączyć do grupy treningowej i ćwiczyć razem!'
                  : 'Click below to join the workout group and train together!'}
              </p>

              <button
                onClick={handleAcceptInvite}
                disabled={accepting}
                style={{
                  backgroundColor: accentColor,
                }}
                className="w-full px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mb-3"
              >
                {accepting
                  ? (language === 'pl' ? 'Dołączanie...' : 'Joining...')
                  : (language === 'pl' ? '✨ Dołącz do Grupy' : '✨ Join Group')}
              </button>

              <button
                onClick={() => navigate('/')}
                style={{ borderColor, color: textColor }}
                className="w-full px-6 py-3 rounded-lg font-semibold border hover:opacity-90 transition-opacity"
              >
                {language === 'pl' ? 'Anuluj' : 'Cancel'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div style={{ color: mutedColor }} className="mt-8 text-center text-sm max-w-md">
        <p>
          {language === 'pl'
            ? 'Musisz być zalogowany, aby zaakceptować zaproszenie.'
            : 'You must be logged in to accept an invite.'}
        </p>
      </div>
    </div>
  );
};

export default JoinInviteGroup;
