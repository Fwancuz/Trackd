import React from 'react';
import translations from './translations';

const AppSettings = ({ settings, updateSettings }) => {
  const t = translations[settings.language || 'en'];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'pl', name: 'Polski' }
  ];

  const handleLanguageChange = (languageCode) => {
    updateSettings({ ...settings, language: languageCode });
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
        </div>
      </div>
    </div>
  );
};

export default AppSettings;