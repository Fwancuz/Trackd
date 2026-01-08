/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

export const ThemeContext = createContext(null);

const THEME_OPTIONS = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Slate Blue with Orange',
    bg: '#0f172a',
    card: '#1e293b',
    text: '#ffffff',
    accent: '#f97316',
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e7eb',
    diamond: '#7dd3fc',
    titan: '#a78bfa'
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Pure Black with Cyan',
    bg: '#000000',
    card: '#0f0f0f',
    text: '#ffffff',
    accent: '#00e5ff',
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e7eb',
    diamond: '#7dd3fc',
    titan: '#a78bfa'
  },
  metal: {
    id: 'metal',
    name: 'Metal',
    description: 'Pure Black with Red',
    bg: '#000000',
    card: '#1a0505',
    text: '#ffffff',
    accent: '#ff0000',
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e7eb',
    diamond: '#7dd3fc',
    titan: '#a78bfa'
  }
};

const ThemeProvider = ({ children, user }) => {
  const [theme, setTheme] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch theme from database on mount or user change
  useEffect(() => {
    const fetchTheme = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('user_settings')
          .select('theme')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          // If no record exists, create one with default theme
          if (fetchError.code === 'PGRST116') {
            await supabase
              .from('user_settings')
              .insert([
                {
                  user_id: user.id,
                  theme: 'classic',
                  settings: { language: 'en' }
                }
              ]);
            setTheme('classic');
          } else {
            throw fetchError;
          }
        } else if (data?.theme && THEME_OPTIONS[data.theme]) {
          setTheme(data.theme);
        } else {
          // Default to 'classic' if theme is invalid or missing
          setTheme('classic');
        }
      } catch (err) {
        console.error('Error fetching theme:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, [user?.id]);

  // Apply theme to HTML element
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    // Remove all theme classes
    Object.keys(THEME_OPTIONS).forEach(themeKey => {
      htmlElement.classList.remove(`theme-${themeKey}`);
    });
    
    // Add current theme class (skip for 'classic' as it's the default)
    if (theme !== 'classic') {
      htmlElement.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const switchTheme = useCallback(async (newTheme) => {
    if (!THEME_OPTIONS[newTheme]) {
      console.error(`Invalid theme: ${newTheme}`);
      return;
    }

    // Optimistic update
    setTheme(newTheme);

    if (!user?.id) return;

    try {
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ theme: newTheme, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error('Error switching theme:', err);
      setError(err.message);
      // Revert optimistic update on error
      setTheme(theme);
    }
  }, [user?.id, theme]);

  const themeInfo = THEME_OPTIONS[theme] || THEME_OPTIONS.classic;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        switchTheme,
        loading,
        error,
        themeInfo,
        availableThemes: Object.values(THEME_OPTIONS)
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
