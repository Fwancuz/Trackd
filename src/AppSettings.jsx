import React, { useState } from 'react';
import translations from './translations';
import ConfirmModal from './ConfirmModal';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';

const AppSettings = ({ settings, updateSettings, logout, onResetStats, onFetchSessions, language }) => {
  const t = translations[settings.language || 'en'];
  const { success, error } = useToast();
  const { theme, switchTheme, availableThemes } = useTheme();
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
                style={settings.language === lang.code ? {
                  backgroundColor: 'var(--accent)',
                  color: 'var(--bg)',
                } : {}}
              >
                {lang.code === 'en' ? t.english : t.polish}
              </button>
            ))}
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t.languageNote}
          </p>

          {/* Theme Section */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: `1px solid var(--border)` }}>
            <h2 style={{ marginBottom: '1rem' }}>{language === 'pl' ? 'Wybierz Motyw' : 'Choose Theme'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {availableThemes.map(themeOption => (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    switchTheme(themeOption.id);
                    success(`Theme changed to ${themeOption.name}`);
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: theme === themeOption.id ? themeOption.accent : 'transparent',
                    color: theme === themeOption.id ? themeOption.bg : themeOption.text,
                    border: `2px solid ${themeOption.accent}`,
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (theme !== themeOption.id) {
                      e.target.style.backgroundColor = themeOption.accent;
                      e.target.style.color = themeOption.bg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (theme !== themeOption.id) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = themeOption.text;
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{themeOption.name}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                        {themeOption.description}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: themeOption.bg,
                          border: `1px solid ${themeOption.text}`,
                          borderRadius: '3px'
                        }}
                        title="Background"
                      />
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: themeOption.card,
                          border: `1px solid ${themeOption.text}`,
                          borderRadius: '3px'
                        }}
                        title="Card"
                      />
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: themeOption.accent,
                          borderRadius: '3px'
                        }}
                        title="Accent"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t.languageNote}
          </p>

          {/* Account Section */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: `1px solid var(--border)` }}>
            <h2 style={{ marginBottom: '1rem' }}>{t.account}</h2>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                color: 'var(--accent)',
                border: `2px solid var(--accent)`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--accent)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--accent)';
              }}
            >
              {t.logout}
            </button>

            {/* Reset Statistics Button */}
            <div className="danger-zone">
              <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                color: 'var(--accent)',
                border: `2px solid var(--accent)`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: isResettingStats ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isResettingStats ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isResettingStats) {
                  e.target.style.backgroundColor = 'var(--accent)';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isResettingStats) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'var(--accent)';
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