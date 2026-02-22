/**
 * Socket.io Events Documentation
 * Real-time Communication for Blood Donation Platform
 */

// ==================== CLIENT -> SERVER EVENTS ====================

export const socketEvents = {
    // Location & Tracking
    UPDATE_LOCATION: 'update_location',
    // Payload: { latitude, longitude, address, city, state }

    // Request Management
    WATCH_REQUEST: 'watch_request',
    // Payload: requestId (string)

    UNWATCH_REQUEST: 'unwatch_request',
    // Payload: requestId (string)

    ACCEPT_REQUEST: 'accept_request',
    // Payload: requestId (string)

    REJECT_REQUEST: 'reject_request',
    // Payload: requestId (string)

    REQUEST_UPDATE: 'request_update',
    // Payload: { requestId, updateData }

    // Donor Availability
    TOGGLE_AVAILABILITY: 'toggle_availability',
    // Payload: { available: boolean }

    // Messaging
    SEND_MESSAGE: 'send_message',
    // Payload: { recipientId, message, requestId }

    USER_TYPING: 'user_typing',
    // Payload: { recipientId, isTyping: boolean }

    // Real-time Status
    POLL_REQUEST_STATUS: 'poll_request_status',
    // Payload: requestId (string)

    GET_ONLINE_DONORS: 'get_online_donors',
    // Payload: none

    // Admin Features
    BROADCAST_EMERGENCY: 'broadcast_emergency',
    // Payload: { message, bloodGroup, urgency, location }
};

// ==================== SERVER -> CLIENT EVENTS ====================

export const serverEvents = {
    // Connection Status
    CONNECTION_SUCCESS: 'connection_success',
    ACTIVE_USERS_COUNT: 'active_users_count',
    // Payload: { count, timestamp }

    // Location Updates
    LOCATION_UPDATE_SUCCESS: 'location_update_success',
    NEARBY_DONOR_FOUND: 'nearby_donor_found',
    // Payload: { donor, requestId }

    // Request Status
    REQUEST_STATUS_CHANGED: 'request_status_changed',
    // Payload: { requestId, status, acceptedBy, timestamp }

    REQUEST_ACCEPTED: 'request_accepted',
    // Payload: { requestId, donorId, donor, message, timestamp }

    REQUEST_UPDATED: 'request_updated',
    // Payload: { requestId, updates, fullRequest, timestamp }

    REQUEST_STATUS: 'request_status',
    // Payload: { requestId, status, updatedAt }

    LIVE_UPDATE: 'live_update',
    // Payload: { requestId, updates, timestamp }

    DONOR_REJECTED: 'donor_rejected',
    // Payload: { requestId, donorId, timestamp }

    // Donor Matching
    BLOOD_REQUEST_MATCHED: 'blood_request_matched',
    // Payload: { request, donor, message, urgency, sound }

    NEW_BLOOD_REQUEST: 'new_blood_request',
    // Payload: { request, timestamp, sound }

    ONLINE_DONORS_LIST: 'online_donors_list',
    // Payload: { donors: [], count }

    DONOR_AVAILABILITY_CHANGED: 'donor_availability_changed',
    // Payload: { donorId, available, timestamp }

    // Notifications
    NEW_NOTIFICATION: 'new_notification',
    // Payload: { notification, timestamp }

    // Messaging
    RECEIVE_MESSAGE: 'receive_message',
    // Payload: { from, senderName, message, requestId, timestamp }

    USER_TYPING_INDICATOR: 'user_typing_indicator',
    // Payload: { from, isTyping }

    MESSAGE_SENT: 'message_sent',
    // Payload: { timestamp }

    // Emergency
    EMERGENCY_ALERT: 'emergency_alert',
    // Payload: { message, bloodGroup, urgency, location, timestamp, sound }

    // Watching
    WATCHING_REQUEST: 'watching_request',
    // Payload: { requestId, message }

    // Success/Error
    ACCEPT_SUCCESS: 'accept_success',
    // Payload: { requestId, message }

    REJECT_SUCCESS: 'reject_success',
    // Payload: { requestId, message }

    AVAILABILITY_UPDATED: 'availability_updated',
    // Payload: { available, message }

    ERROR: 'error',
    // Payload: { message }
};

// ==================== ROOM STRUCTURES ====================

export const socketRooms = {
    // User-specific rooms
    USER: (userId: string) => userId,

    // Role-based rooms
    DONOR_ROOM: 'donor:room',
    REQUESTER_ROOM: 'requester:room',
    ADMIN_ROOM: 'admin:room',

    // Request-specific rooms
    REQUEST: (requestId: string) => `request:${requestId}`,

    // Location-based rooms (future)
    CITY: (city: string) => `city:${city}`,
    AREA: (area: string) => `area:${area}`,

    // Emergency room
    EMERGENCY: 'emergency:broadcast',
};

// ==================== EVENT PAYLOADS ====================

export interface LocationUpdatePayload {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
}

export interface MessagePayload {
    recipientId: string;
    message: string;
    requestId?: string;
}

export interface RequestAcceptPayload {
    requestId: string;
    donorId: string;
    donor: any;
    message: string;
    timestamp: Date;
}

export interface DonorMatchPayload {
    request: string;
    donor: any;
    message: string;
    urgency: string;
    sound: boolean;
}

export interface EmergencyAlertPayload {
    message: string;
    bloodGroup: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    location?: any;
    timestamp: Date;
    sound: boolean;
}
