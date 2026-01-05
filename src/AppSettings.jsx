import React, { useState } from 'react';
import translations from './translations';
import ConfirmModal from './ConfirmModal';
import { useToast } from './ToastContext';

const AppSettings = ({ settings, updateSettings, logout, onResetStats, onFetchSessions, language }) => {
  const t = translations[settings.language || 'en'];
  const { success, error } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetStatsConfirm, setShowResetStatsConfirm] = useState(false);
  const [isResettingStats, setIsResettingStats] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'pl', name: 'Polski' }
  ];

  const handleLanguageChange = (languageCode) => {
    updateSettings({ ...settings, language: languageCode });
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleResetStatsConfirm = async () => {
    setShowResetStatsConfirm(false);
    setIsResettingStats(true);
    
    try {
      await onResetStats();
      // Refresh the sessions data
      if (onFetchSessions) {
        await onFetchSessions();
      }
      success(t.resetStatsSuccess);
    } catch (err) {
      console.error('Error resetting stats:', err);
      error('Failed to reset statistics. Please try again.');
    } finally {
      setIsResettingStats(false);
    }
  };

  return (
    <div className="ui-center">
      <div className="app-settings">
        <div className="settings-content">
          <h2>{t.language}</h2>
          <div className="language-options">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`language-btn ${settings.language === lang.code ? 'active' : ''}`}
              >
                {lang.code === 'en' ? t.english : t.polish}
              </button>
            ))}
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            {t.languageNote}
          </p>

          {/* Account Section */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <h2 style={{ marginBottom: '1rem' }}>{t.account}</h2>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                color: '#ff4d4d',
                border: '2px solid #ff4d4d',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#ff4d4d';
                e.target.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#ff4d4d';
              }}
            >
              {t.logout}
            </button>

            {/* Reset Statistics Button */}
            <div className="danger-zone">
              <h3 style={{ color: '#ff6b6b', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {language === 'pl' ? '⚠️ Strefa Niebezpieczna' : '⚠️ Danger Zone'}
              </h3>
              <button
                onClick={() => setShowResetStatsConfirm(true)}
                disabled={isResettingStats}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                marginTop: '1rem',
                backgroundColor: 'transparent',
                color: '#ff6b6b',
                border: '2px solid #ff6b6b',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: isResettingStats ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isResettingStats ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isResettingStats) {
                  e.target.style.backgroundColor = '#ff6b6b';
                  e.target.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isResettingStats) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#ff6b6b';
                }
              }}
            >
              {isResettingStats ? 'Resetting...' : t.resetStats}
            </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title={t.logout}
        message={t.logoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText={t.yes || 'Yes'}
        cancelText={t.no || 'No'}
        isDangerous={true}
      />

      <ConfirmModal
        isOpen={showResetStatsConfirm}
        title={t.resetStats}
        message={t.resetStatsConfirm}
        onConfirm={handleResetStatsConfirm}
        onCancel={() => setShowResetStatsConfirm(false)}
        confirmText={t.yes || 'Yes'}
        cancelText={t.no || 'No'}
        isDangerous={true}
      />
    </div>
  );
};

export default AppSettings;