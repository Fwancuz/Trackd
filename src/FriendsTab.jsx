import React, { useState, useEffect } from 'react';
import { Copy, Zap, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from './supabaseClient';
import {
  generateFriendCode,
  getMyFriendCode,
  redeemFriendCode,
  getFriendsList,
  getPendingFriendRequests,
  getFriendDisplayName,
  removeFriend,
  acceptFriendRequest,
  rejectFriendRequest,
} from './services/socialService';
import { useToast } from './ToastContext';
import { useSocial } from './useSocial';
import translations from './translations';

const FriendsTab = ({ userId, language = 'en' }) => {
  const [friends, setFriends] = useState([]);
  const [myFriendCode, setMyFriendCode] = useState(null);
  const [codeRevealed, setCodeRevealed] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [activeSection, setActiveSection] = useState('friends'); // 'friends', 'code', 'requests'
  const [highlightedFriendId, setHighlightedFriendId] = useState(null);
  const { success, error: showError } = useToast();
  const { refreshLiveFriends } = useSocial(userId);
  const t = translations[language];

  /**
   * Load data on mount
   */
  useEffect(() => {
    if (userId) {
      loadFriends();
      loadMyFriendCode();
      loadPendingRequests();
      loadSentRequests();
    }
  }, [userId]);

  /**
   * Load user's friends list
   */
  const loadFriends = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const result = await getFriendsList();
      if (result.success) {
        // Enrich with display names
        const enrichedFriends = await Promise.all(
          (result.data || []).map(async (friend) => {
            const displayName = await getFriendDisplayName(friend.friend_id || friend.id);
            return { ...friend, displayName };
          })
        );
        setFriends(enrichedFriends);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      showError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load current user's friend code
   */
  const loadMyFriendCode = async () => {
    if (!userId) return;
    try {
      const result = await getMyFriendCode();
      if (result.success) {
        setMyFriendCode(result.code);
      } else {
        console.warn('Could not load friend code:', result.error);
      }
    } catch (error) {
      console.error('Error loading friend code:', error);
    }
  };

  /**
   * Load pending friend requests (incoming)
   */
  const loadPendingRequests = async () => {
    if (!userId) return;
    try {
      const result = await getPendingFriendRequests();
      if (result.success) {
        // Enrich with display names
        const enriched = await Promise.all(
          (result.data || []).map(async (req) => {
            const displayName = await getFriendDisplayName(req.requester_id);
            return { ...req, displayName };
          })
        );
        setPendingRequests(enriched);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  /**
   * Load sent friend requests (outgoing)
   */
  const loadSentRequests = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id, receiver_id, status, created_at')
        .eq('requester_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      // Get display names for receiver IDs
      const enriched = await Promise.all(
        (data || []).map(async (req) => {
          const displayName = await getFriendDisplayName(req.receiver_id);
          return { ...req, displayName };
        })
      );

      setSentRequests(enriched);
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  };

  /**
   * Generate a new friend code
   */
  const handleGenerateCode = async () => {
    try {
      setGeneratingCode(true);
      const result = await generateFriendCode();

      if (result.success && result.code) {
        setMyFriendCode(result.code);
        success('✅ New friend code generated!');
      } else {
        const errorMsg = result.error || 'Failed to generate friend code';
        showError(errorMsg);
      }
    } catch (err) {
      console.error('Error generating code:', err);
      showError('Failed to generate friend code. Please try again.');
    } finally {
      setGeneratingCode(false);
    }
  };

  /**
   * Copy friend code to clipboard
   */
  const handleCopyCode = async () => {
    if (!myFriendCode) return;
    try {
      await navigator.clipboard.writeText(myFriendCode);
      success('✅ Code copied to clipboard!');
    } catch (err) {
      console.error('Error copying code:', err);
      showError('Failed to copy code');
    }
  };

  /**
   * Redeem a friend code
   */
  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      showError('Please enter a friend code');
      return;
    }

    try {
      setRedeeming(true);
      const result = await redeemFriendCode(redeemCode.trim().toUpperCase());

      if (result.success) {
        success('🎉 Friend Added!');
        setRedeemCode(''); // Clear input
        
        // Immediately add friend to the list with display name
        if (result.friend) {
          const newFriend = {
            ...result.friend,
            displayName: result.friend.username,
            created_at: new Date().toISOString()
          };
          setFriends(prev => [...prev, newFriend]);
          
          // Highlight the new friend for 3 seconds
          setHighlightedFriendId(result.friend.id);
          setTimeout(() => setHighlightedFriendId(null), 3000);
        }
        
        // Refresh the full list and check live friends - await to ensure RLS permits queries
        await loadFriends();
        await refreshLiveFriends();
      } else {
        showError(result.error || 'Failed to redeem friend code');
      }
    } catch (err) {
      console.error('Error redeeming code:', err);
      showError('Failed to redeem friend code. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  /**
   * Accept friend request
   */
  const handleAcceptRequest = async (friendshipId) => {
    try {
      const result = await acceptFriendRequest(friendshipId);
      if (result.success) {
        loadPendingRequests();
        loadFriends();
        success('Friend request accepted!');
      } else {
        showError(result.error || 'Failed to accept request');
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      showError('Failed to accept request');
    }
  };

  /**
   * Reject friend request
   */
  const handleRejectRequest = async (friendshipId) => {
    try {
      const result = await rejectFriendRequest(friendshipId);
      if (result.success) {
        loadPendingRequests();
        success('Friend request rejected');
      } else {
        showError(result.error || 'Failed to reject request');
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      showError('Failed to reject request');
    }
  };

  /**
   * Remove friend
   */
  const handleRemoveFriend = async (friendId) => {
    try {
      const result = await removeFriend(friendId);
      if (result.success) {
        loadFriends();
        success('Friend removed');
      } else {
        showError(result.error || 'Failed to remove friend');
      }
    } catch (err) {
      console.error('Error removing friend:', err);
      showError('Failed to remove friend');
    }
  };

  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  const cardColor = getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
  const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();

  return (
    <div style={{ backgroundColor: bgColor, color: textColor }} className="w-full h-full p-4 overflow-y-auto relative">
      {/* Coming Soon Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          borderRadius: '8px'
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: '2px solid var(--accent)',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '300px'
          }}
        >
          <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }} className="text-2xl font-bold">
            Coming Soon
          </h2>
          <p style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} className="text-lg font-semibold">
            Social Features
          </p>
          <p style={{ color: 'var(--muted-color)' }} className="text-sm">
            We're working on connecting you with your workout buddies. Stay tuned!
          </p>
        </div>
      </div>

      {/* Blurred Content */}
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
      {/* Section Navigation */}
      <div style={{ borderColor }} className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveSection('friends')}
          style={{
            borderBottomColor: activeSection === 'friends' ? accentColor : 'transparent',
            color: activeSection === 'friends' ? accentColor : mutedColor
          }}
          className="px-4 py-2 border-b-2 font-medium transition-colors"
        >
          Friends {friends.length > 0 && `(${friends.length})`}
        </button>
        <button
          onClick={() => setActiveSection('code')}
          style={{
            borderBottomColor: activeSection === 'code' ? accentColor : 'transparent',
            color: activeSection === 'code' ? accentColor : mutedColor
          }}
          className="px-4 py-2 border-b-2 font-medium transition-colors"
        >
          Friend Code
        </button>
        <button
          onClick={() => setActiveSection('requests')}
          style={{
            borderBottomColor: activeSection === 'requests' ? accentColor : 'transparent',
            color: activeSection === 'requests' ? accentColor : mutedColor
          }}
          className="px-4 py-2 border-b-2 font-medium transition-colors"
        >
          Requests {(pendingRequests.length + sentRequests.length) > 0 && `(${pendingRequests.length + sentRequests.length})`}
        </button>
      </div>

      {/* Friends Section */}
      {activeSection === 'friends' && (
        <div>
          <h2 style={{ color: textColor }} className="text-xl font-bold mb-4">
            {t.label_friends || 'Friends'} ({friends.length})
          </h2>

          {loading ? (
            <div style={{ color: mutedColor }} className="text-center py-8">Loading friends...</div>
          ) : friends.length === 0 ? (
            <div style={{ backgroundColor: cardColor, borderColor }} className="border rounded-lg p-6 text-center">
              <Zap style={{ color: accentColor }} className="mx-auto mb-2 w-8 h-8" />
              <p style={{ color: textColor }} className="mb-2 font-semibold">Welcome! Enter a friend's code to get started</p>
              <p style={{ color: mutedColor }} className="text-sm">
                Go to the Friend Code tab above and enter a code to add your first friend, or share your code with others.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map(friend => (
                <div
                  key={friend.id || friend.friend_id}
                  style={{
                    backgroundColor: highlightedFriendId === (friend.id || friend.friend_id) ? accentColor + '20' : cardColor,
                    borderColor: highlightedFriendId === (friend.id || friend.friend_id) ? accentColor : borderColor,
                    transition: 'all 0.3s ease'
                  }}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p style={{ color: textColor }} className="font-semibold">
                      {friend.displayName}
                    </p>
                    <p style={{ color: mutedColor }} className="text-sm">
                      Friends since {new Date(friend.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend.friend_id || friend.id)}
                    style={{ color: accentColor }}
                    className="px-3 py-1 rounded hover:opacity-75 transition-opacity text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friend Code Section */}
      {activeSection === 'code' && (
        <div>
          <h2 style={{ color: textColor }} className="text-xl font-bold mb-6">
            Your Friend Code
          </h2>

          {/* My Code Section */}
          <div style={{ backgroundColor: cardColor, borderColor }} className="border rounded-lg p-6 mb-8 text-center">
            <p style={{ color: mutedColor }} className="text-sm mb-4">
              Share this code with friends to add them
            </p>

            {myFriendCode ? (
              <>
                {/* Large Bold Code Display */}
                <div className="mb-4">
                  <code
                    style={{
                      backgroundColor: bgColor,
                      color: accentColor,
                      borderColor
                    }}
                    className="border rounded-lg px-6 py-4 font-mono font-bold text-4xl block cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    {codeRevealed ? myFriendCode : myFriendCode.split('').map(() => '•').join('')}
                  </code>
                </div>

                {/* Toggle Reveal */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    onClick={() => setCodeRevealed(!codeRevealed)}
                    style={{ color: accentColor }}
                    className="p-2 rounded hover:opacity-75 transition-opacity"
                    title={codeRevealed ? 'Hide code' : 'Show code'}
                  >
                    {codeRevealed ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopyCode}
                  style={{
                    backgroundColor: accentColor,
                    color: bgColor
                  }}
                  className="w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-3"
                >
                  <Copy className="w-5 h-5" /> Copy Code
                </button>

                {/* Refresh Button */}
                <button
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  style={{
                    borderColor: accentColor,
                    color: accentColor
                  }}
                  className="w-full px-4 py-3 rounded-lg font-semibold border flex items-center justify-center gap-2 hover:opacity-75 transition-opacity disabled:opacity-50"
                >
                  <RefreshCw className="w-5 h-5" /> {generatingCode ? 'Refreshing...' : 'Refresh Code'}
                </button>
              </>
            ) : (
              <>
                <p style={{ color: mutedColor }} className="mb-4">
                  Generate your friend code to get started
                </p>
                <button
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  style={{ backgroundColor: accentColor }}
                  className="w-full px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {generatingCode ? 'Generating...' : '✨ Generate My Code'}
                </button>
              </>
            )}
          </div>

          {/* Redeem Code Section */}
          <div>
            <h3 style={{ color: textColor }} className="text-lg font-semibold mb-4">
              Add Friend
            </h3>

            <div style={{ backgroundColor: cardColor, borderColor }} className="border rounded-lg p-6">
              <p style={{ color: mutedColor }} className="text-sm mb-3">
                Enter a friend's code to add them
              </p>

              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  borderColor,
                  caretColor: accentColor
                }}
                className="w-full border rounded-lg px-4 py-3 mb-4 font-mono text-center text-lg font-semibold focus:outline-none focus:ring-2"
                onFocus={(e) => {
                  e.target.style.borderColor = accentColor;
                  e.target.style.boxShadow = `0 0 0 2px ${accentColor}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = borderColor;
                  e.target.style.boxShadow = 'none';
                }}
                maxLength="6"
              />

              <button
                onClick={handleRedeemCode}
                disabled={redeeming || !redeemCode.trim()}
                style={{ backgroundColor: accentColor }}
                className="w-full px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {redeeming ? 'Adding Friend...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests Section */}
      {activeSection === 'requests' && (
        <div>
          <h2 style={{ color: textColor }} className="text-xl font-bold mb-4">
            Friend Requests
          </h2>

          {/* Incoming Requests */}
          <div className="mb-8">
            <h3 style={{ color: textColor }} className="text-lg font-semibold mb-3">
              Incoming ({pendingRequests.length})
            </h3>

            {pendingRequests.length === 0 ? (
              <div style={{ backgroundColor: cardColor, borderColor }} className="border rounded-lg p-6 text-center">
                <p style={{ color: mutedColor }}>No incoming requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    style={{
                      backgroundColor: cardColor,
                      borderColor: accentColor,
                      borderWidth: '2px'
                    }}
                    className="rounded-lg p-4"
                  >
                    <p style={{ color: textColor }} className="font-semibold mb-3">
                      {req.displayName}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        style={{ backgroundColor: accentColor }}
                        className="flex-1 px-3 py-2 rounded font-medium hover:opacity-90 transition-opacity"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        style={{
                          backgroundColor: bgColor,
                          borderColor,
                          color: textColor
                        }}
                        className="flex-1 px-3 py-2 rounded font-medium border hover:opacity-90 transition-opacity"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div>
            <h3 style={{ color: textColor }} className="text-lg font-semibold mb-3">
              Sent ({sentRequests.length})
            </h3>

            {sentRequests.length === 0 ? (
              <div style={{ backgroundColor: cardColor, borderColor }} className="border rounded-lg p-6 text-center">
                <p style={{ color: mutedColor }}>No sent requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map(req => (
                  <div
                    key={req.id}
                    style={{
                      backgroundColor: cardColor,
                      borderColor,
                      opacity: 0.7
                    }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p style={{ color: textColor }} className="font-semibold">
                          {req.displayName}
                        </p>
                        <p style={{ color: mutedColor }} className="text-sm">
                          Sent {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p style={{ color: mutedColor }} className="text-sm font-medium">
                        Pending...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FriendsTab;
