import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

/**
 * ActivityHeatmap Component
 * Displays a monthly activity heatmap showing which days had workouts
 * Data fetched from completed_sessions table
 */
const ActivityHeatmap = ({ userId, language = 'en', refreshTrigger = 0 }) => {
  const [heatmapData, setHeatmapData] = useState({});
  const [loading, setLoading] = useState(true);

  // Days of week labels
  const dayLabels = language === 'pl' 
    ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Month label
  const now = new Date();
  const monthLabel = language === 'pl'
    ? `${['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'][now.getMonth()]} ${now.getFullYear()}`
    : `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    fetchHeatmapData();
  }, [userId, refreshTrigger]);

  const fetchHeatmapData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get current month start and end dates
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('completed_sessions')
        .select('completed_at')
        .eq('user_id', userId)
        .gte('completed_at', monthStart.toISOString())
        .lte('completed_at', monthEnd.toISOString());

      if (error) {
        console.error('Error fetching heatmap data:', error);
        setHeatmapData({});
      } else {
        // Group by date
        const dateMap = {};
        if (data) {
          data.forEach(session => {
            if (session.completed_at) {
              const date = new Date(session.completed_at);
              const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
            }
          });
        }
        setHeatmapData(dateMap);
      }
    } catch (err) {
      console.error('Error in fetchHeatmapData:', err);
      setHeatmapData({});
    } finally {
      setLoading(false);
    }
  };

  // Generate grid of days for current month
  const generateCalendarDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday, need Monday = 0)
    let startingDayOfWeek = firstDay.getDay();
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Convert Sunday to 6
    
    const daysArray = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysArray.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      daysArray.push(day);
    }
    
    return daysArray;
  };

  const calendarDays = generateCalendarDays();

  // Get date key for a day
  const getDateKey = (day) => {
    if (!day) return null;
    const now = new Date();
    const dateStr = new Date(now.getFullYear(), now.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return dateStr;
  };

  // Check if a day has activity
  const hasActivity = (day) => {
    if (!day) return false;
    const dateKey = getDateKey(day);
    return dateKey && heatmapData[dateKey] ? true : false;
  };

  return (
    <div style={{
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      border: '1px solid',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{
        color: 'var(--text)',
        marginBottom: '1rem',
        fontSize: '1rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Monthly Activity
      </h3>

      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
        marginBottom: '1rem'
      }}>
        {monthLabel}
      </p>

      {loading ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          Loading...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem'
        }}>
          {/* Day labels */}
          {dayLabels.map(label => (
            <div
              key={`label-${label}`}
              style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                paddingBottom: '0.5rem',
                marginBottom: '0.25rem'
              }}
            >
              {label}
            </div>
          ))}

          {/* Calendar squares */}
          {calendarDays.map((day, index) => {
            const dateKey = getDateKey(day);
            const isActive = hasActivity(day);

            return (
              <div
                key={`day-${index}`}
                style={{
                  aspectRatio: '1',
                  borderRadius: '0.375rem',
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--border)',
                  opacity: day ? 1 : 0,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: isActive ? 'var(--bg)' : 'var(--text-muted)',
                  border: isActive ? `1px solid var(--accent)` : `1px solid var(--border)`,
                  cursor: day ? 'default' : 'default'
                }}
                title={dateKey ? `${dateKey}: ${heatmapData[dateKey] || 0} workout(s)` : ''}
              >
                {day}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '0.875rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '1.25rem',
            height: '1.25rem',
            borderRadius: '0.3rem',
            backgroundColor: 'var(--accent)',
            border: '1px solid var(--accent)'
          }} />
          <span>{language === 'pl' ? 'Trening odbył się' : 'Workout completed'}</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
