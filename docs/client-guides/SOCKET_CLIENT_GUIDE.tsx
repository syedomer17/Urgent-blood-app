/**
 * Socket.io Client Implementation Guide
 * Complete example for integrating live features in React/React-Native
 */

import { io, Socket } from 'socket.io-client';
import { useEffect, useState, useCallback } from 'react';

// ============ SOCKET SERVICE ============

class SocketService {
    private socket: Socket | null = null;
    private userId: string = '';
    private token: string = '';

    /**
     * Initialize socket connection
     */
    connect(userId: string, token: string) {
        this.userId = userId;
        this.token = token;

        this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000', {
            auth: {
                token: `Bearer ${token}`,
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        this.setupConnectionHandlers();
    }

    /**
     * Setup connection event handlers
     */
    private setupConnectionHandlers() {
        this.socket?.on('connect', () => {
            console.log('✅ Socket connected:', this.socket?.id);
        });

        this.socket?.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        this.socket?.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
    }

    /**
     * Disconnect socket
     */
    disconnect() {
        this.socket?.disconnect();
    }

    /**
     * Emit event to server
     */
    emit(event: string, data?: any) {
        this.socket?.emit(event, data);
    }

    /**
     * Listen for server events
     */
    on(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    /**
     * Remove event listener
     */
    off(event: string, callback?: (...args: any[]) => void) {
        this.socket?.off(event, callback);
    }
}

export const socketService = new SocketService();

// ============ REACT HOOKS ============

/**
 * Hook for socket connection lifecycle
 */
export const useSocket = (userId: string, token: string) => {
    useEffect(() => {
        socketService.connect(userId, token);
        return () => socketService.disconnect();
    }, [userId, token]);
};

/**
 * Hook for listening to socket events
 */
export const useSocketEvent = (event: string, callback: (data: any) => void) => {
    useEffect(() => {
        socketService.on(event, callback);
        return () => socketService.off(event, callback);
    }, [event, callback]);
};

/**
 * Hook for real-time location updates
 */
export const useLocationTracking = () => {
    const sendLocationUpdate = useCallback(
        (latitude: number, longitude: number, address?: string) => {
            socketService.emit('update_location', {
                latitude,
                longitude,
                address,
            });
        },
        []
    );

    const handleNearbyDonor = useCallback((data: any) => {
        console.log(`Donor nearby: ${data.donor.name} - ${data.distance}`);
        // Update UI
    }, []);

    useSocketEvent('nearby_donor_found', handleNearbyDonor);

    return { sendLocationUpdate };
};

/**
 * Hook for blood request matching
 */
export const useBloodRequestMatching = () => {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleNewRequest = useCallback((request: any) => {
        console.log('New blood request:', request);
        // Show notification
        showNotification('🩸 Urgent Blood Request', {
            title: `${request.request.bloodGroup} needed for ${request.request.patientName}`,
            message: `Urgency: ${request.request.urgency}`,
            sound: request.sound,
        });
    }, []);

    const handlePerfectMatch = useCallback((match: any) => {
        console.log('Perfect match found:', match);
        showNotification('🎯 Perfect Match!', {
            message: `You're matched with ${match.donor.name}`,
        });
    }, []);

    useSocketEvent('new_blood_request', handleNewRequest);
    useSocketEvent('blood_request_matched', handlePerfectMatch);

    return { matches, loading };
};

/**
 * Hook for real-time leaderboard
 */
export const useLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    const handleLeaderboardUpdate = useCallback((data: any) => {
        setLeaderboard(data.leaderboard);
    }, []);

    useSocketEvent('leaderboard_updated', handleLeaderboardUpdate);

    return { leaderboard };
};

/**
 * Hook for live heatmap
 */
export const useHeatmap = () => {
    const [heatmapData, setHeatmapData] = useState<any[]>([]);

    const handleHeatmapUpdate = useCallback((data: any) => {
        setHeatmapData(data.heatmap);
    }, []);

    useSocketEvent('live_heatmap_update', handleHeatmapUpdate);

    return { heatmapData };
};

/**
 * Hook for live analytics
 */
export const useAnalytics = () => {
    const [analytics, setAnalytics] = useState<any>(null);

    const handleAnalyticsUpdate = useCallback((data: any) => {
        setAnalytics(data);
    }, []);

    useSocketEvent('live_analytics_update', handleAnalyticsUpdate);

    return { analytics };
};

/**
 * Hook for messaging
 */
export const useMessaging = () => {
    const [messages, setMessages] = useState<any[]>([]);

    const sendMessage = useCallback((recipientId: string, message: string, requestId?: string) => {
        socketService.emit('send_message', {
            recipientId,
            message,
            requestId,
        });
    }, []);

    const sendTypingIndicator = useCallback((recipientId: string, isTyping: boolean) => {
        socketService.emit('user_typing', {
            recipientId,
            isTyping,
        });
    }, []);

    const handleReceiveMessage = useCallback((data: any) => {
        setMessages((prev) => [...prev, data]);
        showNotification('💬 New Message', {
            message: `${data.senderName}: ${data.message}`,
        });
    }, []);

    useSocketEvent('receive_message', handleReceiveMessage);

    return {
        messages,
        sendMessage,
        sendTypingIndicator,
    };
};

/**
 * Hook for request management
 */
export const useRequestManagement = (requestId: string) => {
    const [requestStatus, setRequestStatus] = useState<any>(null);
    const [isAccepting, setIsAccepting] = useState(false);

    const watchRequest = useCallback(() => {
        socketService.emit('watch_request', requestId);
    }, [requestId]);

    const unwatchRequest = useCallback(() => {
        socketService.emit('unwatch_request', requestId);
    }, [requestId]);

    const acceptRequest = useCallback(async () => {
        setIsAccepting(true);
        socketService.emit('accept_request', requestId);
    }, [requestId]);

    const rejectRequest = useCallback(() => {
        socketService.emit('reject_request', requestId);
    }, [requestId]);

    const handleStatusChanged = useCallback((data: any) => {
        if (data.requestId === requestId) {
            setRequestStatus(data);
            showNotification('📍 Request Status Updated', {
                message: `Status: ${data.status}`,
            });
        }
    }, [requestId]);

    useSocketEvent('request_status_changed', handleStatusChanged);
    useSocketEvent('accept_success', () => setIsAccepting(false));

    return {
        requestStatus,
        isAccepting,
        watchRequest,
        unwatchRequest,
        acceptRequest,
        rejectRequest,
    };
};

/**
 * Hook for donor availability
 */
export const useDonorAvailability = () => {
    const [isAvailable, setIsAvailable] = useState(true);

    const toggleAvailability = useCallback((available: boolean) => {
        socketService.emit('toggle_availability', { available });
        setIsAvailable(available);
    }, []);

    return { isAvailable, toggleAvailability };
};

/**
 * Hook for achievements
 */
export const useAchievements = () => {
    const [achievements, setAchievements] = useState<string[]>([]);

    const handleAchievementUnlocked = useCallback((data: any) => {
        setAchievements((prev) => [...prev, ...data.achievements]);
        showNotification('🎖️ Achievement Unlocked!', {
            message: data.message,
        });
    }, []);

    useSocketEvent('achievement_unlocked', handleAchievementUnlocked);

    return { achievements };
};

/**
 * Hook for emergency alerts
 */
export const useEmergencyAlerts = () => {
    const [emergencyAlert, setEmergencyAlert] = useState<any>(null);

    const handleEmergencyAlert = useCallback((alert: any) => {
        setEmergencyAlert(alert);

        // Show prominent notification
        showNotification('🚨 EMERGENCY ALERT!', {
            message: alert.message,
            sound: alert.sound,
            vibrate: alert.vibrate,
            priority: 'max',
        });

        // Play alarm sound
        playAlarmSound();
    }, []);

    useSocketEvent('emergency_alert', handleEmergencyAlert);

    return { emergencyAlert };
};

// ============ UTILITY FUNCTIONS ============

/**
 * Show native notification
 */
function showNotification(title: string, options: any = {}) {
    // React-Toastify
    if (window.innerWidth < 768) {
        // Mobile: Use native notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, options);
        }
    } else {
        // Web: Use toast
        import('react-toastify').then(({ toast }) => {
            toast.info(title, {
                position: 'top-right',
                autoClose: 5000,
                ...options,
            });
        });
    }
}

/**
 * Play alarm sound
 */
function playAlarmSound() {
    const audio = new Audio('/sounds/alarm.mp3');
    audio.play().catch((err) => console.error('Audio play failed:', err));
}

// ============ REACT COMPONENT EXAMPLES ============

/**
 * Donor Profile Component with Socket Integration
 */
export function DonorProfile({ userId, token }: { userId: string; token: string }) {
    useSocket(userId, token);

    const { isAvailable, toggleAvailability } = useDonorAvailability();
    const { sendLocationUpdate } = useLocationTracking();
    const { achievements } = useAchievements();
    const { leaderboard } = useLeaderboard();

    const handleLocationPermission = async () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                sendLocationUpdate(latitude, longitude, 'Current Location');
            },
            (error) => console.error('Location error:', error)
        );
    };

    return (
        <div className="donor-profile">
            <h1>Donor Profile</h1>

            {/* Availability Toggle */}
            <div className="availability-section">
                <button onClick={() => toggleAvailability(!isAvailable)}>
                    {isAvailable ? '✅ Available' : '❌ Unavailable'}
                </button>
            </div>

            {/* Location */}
            <div className="location-section">
                <button onClick={handleLocationPermission}>📍 Share Location</button>
            </div>

            {/* Achievements */}
            <div className="achievements-section">
                <h2>Achievements</h2>
                <div className="achievements-list">
                    {achievements.map((badge) => (
                        <span key={badge} className="badge">
                            {getBadgeEmoji(badge)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Leaderboard */}
            <div className="leaderboard-section">
                <h2>Top Donors</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Units</th>
                            <th>Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.slice(0, 10).map((donor) => (
                            <tr key={donor._id}>
                                <td>{donor.rank} {donor.badge}</td>
                                <td>{donor.name}</td>
                                <td>{donor.totalDonations}</td>
                                <td>{'⭐'.repeat(Math.floor(donor.averageRating))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Blood Request Card with Socket Integration
 */
export function BloodRequestCard({ request }: { request: any }) {
    const { requestStatus, isAccepting, acceptRequest } = useRequestManagement(
        request._id
    );

    return (
        <div className="blood-request-card">
            <h3>{request.patientName} - {request.bloodGroup}</h3>
            <p>Units Needed: {request.unitsRequired}</p>
            <p>Urgency: {request.urgency}</p>
            <p>Location: {request.location.address}</p>

            <button
                onClick={acceptRequest}
                disabled={isAccepting}
                className="accept-btn"
            >
                {isAccepting ? 'Accepting...' : '✅ Accept Request'}
            </button>

            {requestStatus && (
                <p className="status-badge">
                    Status: {requestStatus.status}
                </p>
            )}
        </div>
    );
}

/**
 * Chat Component
 */
export function ChatComponent({ donorId }: { donorId: string }) {
    const { messages, sendMessage, sendTypingIndicator } = useMessaging();
    const [inputText, setInputText] = useState('');

    const handleSend = () => {
        if (inputText.trim()) {
            sendMessage(donorId, inputText);
            setInputText('');
        }
    };

    return (
        <div className="chat-component">
            <div className="messages-list">
                {messages.map((msg, idx) => (
                    <div key={idx} className="message">
                        <span className="sender">{msg.senderName}:</span>
                        <span className="text">{msg.message}</span>
                    </div>
                ))}
            </div>

            <div className="message-input">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                        setInputText(e.target.value);
                        sendTypingIndicator(donorId, e.target.value.length > 0);
                    }}
                    placeholder="Type a message..."
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
}

// ============ UTILITY ============

function getBadgeEmoji(badge: string): string {
    const badgeMap: { [key: string]: string } = {
        first_donation: '🎉',
        dedication_5: '⭐',
        dedication_10: '⭐⭐',
        platinum_donor: '💎',
        trusted_hero: '🦸',
        excellent_donor: '✨',
    };
    return badgeMap[badge] || '🏅';
}

export default socketService;
