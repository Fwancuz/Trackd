import React, { useState, useEffect } from 'react';
import { Users, Play, X, Zap } from 'lucide-react';
import { getActiveFriendSessions, createClonedSessionData } from './services/socialService';
import { useSocial } from './useSocial';
import translations from './translations';

const ACTIVE_SESSION_KEY = 'trackd_active_session';

const ActiveFriendsBanner = ({ onSessionJoined, language = 'en', userId = null }) => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const t = translations[language];

  // Use the new useSocial hook for live updates
  const {
    liveFriends,
    loading: liveLoading,
    subscribed,
    formatWorkoutProgress,
  } = useSocial(userId, language);

  /**
   * Fetch active friend sessions on mount and refresh periodically
   */
  useEffect(() => {
    const fetchActiveSessions = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getActiveFriendSessions();
        if (result.success) {
          setActiveSessions(result.data || []);
        } else {
          console.error('Error fetching active sessions:', result.error);
          setActiveSessions([]);
        }
      } catch (error) {
        console.error('Error in fetchActiveSessions:', error);
        setActiveSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveSessions();

    // Keep 30-second polling as fallback
    const interval = setInterval(fetchActiveSessions, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  /**
   * Handle "Join" button click
   * Creates a cloned session from friend's workout and stores in localStorage
   */
  const handleJoinWorkout = (session) => {
    try {
      // Create cloned session data from friend's exercises
      const clonedSessionData = createClonedSessionData(
        session,
        `${session.friend?.username || 'Friend'}'s Workout`
      );

      if (!clonedSessionData) {
        alert('Error creating session. Please try again.');
        return;
      }

      // Store cloned session in localStorage
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(clonedSessionData));

      // Notify parent component
      if (onSessionJoined) {
        onSessionJoined(clonedSessionData);
      }
    } catch (error) {
      console.error('Error joining workout:', error);
      alert('Error joining workout. Please try again.');
    }
  };

  const handleDismiss = (index) => {
    setActiveSessions(activeSessions.filter((_, i) => i !== index));
  };

  // Don't render if no active sessions
  if (!loading && activeSessions.length === 0 && liveFriends.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r" style={{ background: `linear-gradient(135deg, var(--card), var(--card))` }}>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Users size={18} style={{ color: 'var(--accent)' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
            {t?.['Active Friends'] || 'Active Friends'}
          </h3>
          {subscribed && (
            <span
              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                backgroundColor: 'rgba(var(--accent), 0.2)',
                color: 'var(--accent)',
              }}
            >
              <Zap size={12} />
              Live
            </span>
          )}
        </div>

        {loading || liveLoading ? (
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
            <div className="h-4 w-24 bg-gray-400 rounded"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Live friends (real-time via useSocial hook) */}
            {liveFriends.map((friend, index) => {
              const workout = formatWorkoutProgress(friend.active_workout_data);
              if (!workout) return null;

              return (
                <div
                  key={`live-${friend.user_id}-${index}`}
                  className="p-3 rounded border transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--accent)',
                    borderWidth: '2px',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {friend.avatar_url && (
                        <img
                          src={friend.avatar_url}
                          alt={friend.username}
                          className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate flex items-center gap-1" style={{ color: 'var(--text)' }}>
                          {friend.username}
                          <span
                            className="inline-flex h-2 w-2 rounded-full"
                            style={{ backgroundColor: 'var(--accent)' }}
                          />
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {workout.name} • {workout.exerciseProgress}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--accent)' }}>
                      {workout.duration}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-1 rounded-full mb-3"
                    style={{ backgroundColor: 'var(--border)' }}
                  >
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{
                        width: `${(workout.completedExercises / workout.totalExercises) * 100}%`,
                        backgroundColor: 'var(--accent)',
                      }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      const sessionData = createClonedSessionData(
                        {
                          user_id: friend.user_id,
                          username: friend.username,
                          avatar_url: friend.avatar_url,
                          active_workout_data: friend.active_workout_data,
                        },
                        `${friend.username}'s ${workout.name}`
                      );

                      if (sessionData) {
                        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionData));
                        if (onSessionJoined) {
                          onSessionJoined(sessionData);
                        }
                      }
                    }}
                    className="w-full py-2 rounded font-medium text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--bg)',
                    }}
                  >
                    <Play size={14} />
                    {t?.['Join Workout'] || 'Join Workout'}
                  </button>
                </div>
              );
            })}

            {/* Fallback: Traditional sessions list (for compatibility) */}
            {activeSessions.map((session, index) => (
              <div
                key={`session-${session.id}-${index}`}
                className="p-3 rounded border transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {session.friend?.avatar_url && (
                      <img
                        src={session.friend.avatar_url}
                        alt={session.friend.username}
                        className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
                        {session.friend?.username || 'Unknown User'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {session.exercises && JSON.parse(typeof session.exercises === 'string' ? session.exercises : JSON.stringify(session.exercises)).length || 0}{' '}
                        exercises
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="text-xs px-2 py-1 rounded flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--bg)',
                    }}
                  >
                    {expandedIndex === index ? 'Hide' : 'Show'}
                  </button>
                </div>

                {/* Expanded exercises list */}
                {expandedIndex === index && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="space-y-1 max-h-32 overflow-y-auto mb-3">
                      {(() => {
                        try {
                          const exData = typeof session.exercises === 'string'
                            ? JSON.parse(session.exercises)
                            : session.exercises || [];
                          return exData.map((ex, idx) => (
                            <div key={idx} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {ex.name} • {ex.sets}x{ex.reps} @ {ex.weight}
                            </div>
                          ));
                        } catch {
                          return <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Unable to parse exercises</div>;
                        }
                      })()}
                    </div>

                    <button
                      onClick={() => handleJoinWorkout(session)}
                      className="w-full py-2 rounded font-medium text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--bg)',
                      }}
                    >
                      <Play size={14} />
                      {t?.['Join Workout'] || 'Join Workout'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveFriendsBanner;
