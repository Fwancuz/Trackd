import React, { useState } from 'react';
import translations from './translations';
import ConfirmModal from './ConfirmModal';

const AppSettings = ({ settings, updateSettings, logout }) => {
  const t = translations[settings.language || 'en'];
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  return (
    <div className="ui-center">
      <div className="app-settings">
        <h1 className="app-title">Trackd</h1>
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
    </div>
  );
};

export default AppSettings;