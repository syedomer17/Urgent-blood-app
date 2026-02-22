# 🩸 Live Socket Features & Real-Time System

## Overview
This is a production-grade real-time communication system powered by Socket.io with innovative features that make the blood donation platform unique and engaging.

---

## 🚀 Key Features

### 1. **Real-Time Location Updates**
- Donors update their location in real-time
- Live tracking shows nearby blood requests
- Automatic proximity alerts when donors enter request zones
- Location-based geolocation data extraction (state, city, zip, area)

```typescript
// Client emits location update
socket.emit('update_location', {
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'Times Square, NY',
    city: 'New York',
    state: 'New York'
});

// Server broadcasts heatmap of nearby donors
socket.on('nearby_donor_found', (donor) => {
    console.log(`Donor ${donor.name} is ${donor.distance} away`);
});
```

### 2. **Emergency Broadcast System 🚨**
- Admins send emergency alerts to compatible donors
- Critical priority indicators
- Sound + vibration notifications
- 15km search radius for critical cases

```typescript
// Admin triggers emergency
socket.emit('broadcast_emergency', {
    bloodGroup: 'O-',
    unitsRequired: 5,
    message: 'Critical emergency at Central Hospital',
    urgency: 'critical',
    location: { coordinates: [lat, lon] }
});

// All compatible online donors receive
socket.on('emergency_alert', (alert) => {
    playAlertSound();
    vibrate([500, 200, 500]);
});
```

### 3. **Smart Donor Matching Algorithm 🎯**
- AI-powered matching based on:
  - Location proximity (40% weight)
  - Trust rating (40% weight)
  - Donation history/experience (20% weight)
- Perfectly matched donors get matched notifications
- Auto-ranking of best matches

```typescript
// Perfect matches are calculated and notified
socket.on('blood_request_matched', (match) => {
    // Donor with highest matching score
    // Gets notified first
});
```

### 4. **Live Donor Leaderboard 🏆**
- Real-time ranking updated every 5 minutes
- Badges: 🥇 🥈 🥉 ⭐
- Top 100 donors tracked
- Metrics:
  - Total units donated
  - Donation frequency
  - Trust rating
  - Response time

```typescript
socket.on('leaderboard_updated', (data) => {
    data.leaderboard.forEach(donor => {
        console.log(`#${donor.rank} ${donor.badge} ${donor.name}`);
    });
});
```

### 5. **Live Heatmap System 🌍**
- Real-time distribution of available donors
- Grouped by city and blood type
- Updated every 2 minutes
- Shows exact coordinates on map

```typescript
socket.on('live_heatmap_update', (heatmap) => {
    // { city: 'New York', bloodGroup: 'O+', count: 24 }
    // Display on interactive map
});
```

### 6. **Community Trust Rating System ⭐**
- Recipients rate donors on:
  - Professionalism
  - Reliability
  - Responsiveness
  - Communication
- Weighted average calculation
- Public profiles with reviews

```typescript
// Donor notified when rated
socket.on('trust_rating_updated', {
    newRating: 4.8,
    totalReviews: 12,
    badges: ['Trusted Hero', 'Excellent Donor']
});
```

### 7. **Real-Time Chat/Messaging 💬**
- Direct message between donors and requesters
- Typing indicators
- Read receipts
- Request-specific conversations

```typescript
// Send message
socket.emit('send_message', {
    recipientId: 'userId123',
    message: 'Hi, I can donate today!',
    requestId: 'req456'
});

// Receive message
socket.on('receive_message', (msg) => {
    console.log(`${msg.senderName}: ${msg.message}`);
});

// Typing indicator
socket.emit('user_typing', { recipientId, isTyping: true });
socket.on('user_typing_indicator', { from, isTyping });
```

### 8. **Live Analytics Dashboard 📊**
- Admin dashboard with real-time metrics
- Updated every 3 minutes
- Metrics tracked:
  - Active pending requests
  - Available donors
  - Total units donated today
  - Success rate
  - Average response time

```typescript
socket.on('live_analytics_update', {
    activeRequests: 42,
    availableDonors: 156,
    totalUnitsToday: 250,
    successRate: '87.5%',
    avgResponseTimeMinutes: 12
});
```

### 9. **Achievement & Badge System 🎖️**
- Automatic achievement unlocking:
  - First Donation 🎉
  - Dedication (5, 10 donations)
  - Platinum Donor (25 donations)
  - Trusted Hero (4.8+ rating)
  - Excellent Donor (4.5+ rating)

```typescript
socket.on('achievement_unlocked', {
    achievements: ['first_donation', 'trusted_hero'],
    message: "You've unlocked new achievements!"
});
```

### 10. **Notification Preferences 🔔**
- Users customize notification settings:
  - Urgent requests only
  - Nearby requests
  - Messages
  - Donations
  - Leaderboard updates
- Sound/vibration toggle
- Quiet hours setting

```typescript
socket.emit('set_notification_preferences', {
    urgentRequests: true,
    nearbyRequests: true,
    soundEnabled: true,
    quietHours: { start: '22:00', end: '08:00' }
});
```

### 11. **Request Status Tracking 📍**
- Live updates on request status changes
- Real-time progress tracking
- Donor acceptance/rejection
- Request fulfillment notifications
- All watchers notified simultaneously

```typescript
// Watch specific request
socket.emit('watch_request', 'requestId123');

// Get live updates
socket.on('request_status_changed', {
    requestId: 'requestId123',
    status: 'accepted',
    acceptedBy: 'donorId456',
    timestamp: new Date()
});
```

### 12. **Donor Availability Toggle**
- Donors toggle availability status
- Real-time broadcast to requesters
- Affects matching algorithm
- Tracked per socket connection

```typescript
socket.emit('toggle_availability', { available: true });

// Emitted to all requesters
socket.on('donor_availability_changed', {
    donorId: 'donor123',
    available: true,
    timestamp: new Date()
});
```

---

## 📡 Socket Events Reference

### Client -> Server (Emit)

| Event | Payload | Description |
|-------|---------|-------------|
| `update_location` | `{lat, lon, address, city, state}` | Update donor location |
| `watch_request` | `requestId` | Watch request updates |
| `unwatch_request` | `requestId` | Stop watching request |
| `accept_request` | `requestId` | Accept blood request |
| `reject_request` | `requestId` | Reject blood request |
| `toggle_availability` | `{available: bool}` | Toggle donor availability |
| `send_message` | `{recipientId, message, requestId?}` | Send direct message |
| `user_typing` | `{recipientId, isTyping}` | Typing indicator |
| `poll_request_status` | `requestId` | Get current status |
| `get_online_donors` | - | Get list of online donors |
| `broadcast_emergency` | `{bloodGroup, units, message, urgency}` | Send emergency (Admin only) |
| `request_update` | `{requestId, updateData}` | Update request details |
| `set_notification_preferences` | `{...preferences}` | Customize notifications |

### Server -> Client (On)

| Event | Payload | Description |
|--------|---------|-------------|
| `connection_success` | - | Connection established |
| `active_users_count` | `{count, timestamp}` | Current online users |
| `location_update_success` | - | Location saved |
| `nearby_donor_found` | `{donor, distance}` | New donor nearby |
| `new_blood_request` | `{request}` | New request created |
| `blood_request_matched` | `{donor, request}` | Perfect match found |
| `request_status_changed` | `{status, acceptedBy}` | Status updated |
| `request_accepted` | `{donor, message}` | Request accepted |
| `request_updated` | `{updates, fullRequest}` | Request modified |
| `live_update` | `{updates}` | Real-time update |
| `emergency_alert` | `{message, urgency}` | Emergency broadcast |
| `receive_message` | `{from, message, timestamp}` | Direct message |
| `user_typing_indicator` | `{from, isTyping}` | Typing indicator |
| `leaderboard_updated` | `{leaderboard}` | Leaderboard refresh |
| `live_heatmap_update` | `{heatmap}` | Donor distribution |
| `live_analytics_update` | `{analytics}` | Dashboard metrics |
| `achievement_unlocked` | `{achievements}` | New badges earned |
| `trust_rating_updated` | `{rating, reviews}` | Rating changed |
| `donor_availability_changed` | `{donorId, available}` | Donor status changed |
| `new_notification` | `{notification}` | New notification |
| `error` | `{message}` | Error occurred |

---

## 🔐 Authentication

All socket connections require JWT token in handshake:

```typescript
// Client
const socket = io('http://server:3000', {
    auth: {
        token: 'Bearer eyJhbGc...'
    }
});

// Automatically extracts userId and role from token
```

---

## 🌐 Rooms & Broadcasting

### Room Structure
- **User Rooms**: `userId` - Private messages
- **Role Rooms**: `donor:room`, `requester:room`, `admin:room`
- **Request Rooms**: `request:requestId` - Request watchers
- **Location Rooms**: `city:cityName`, `area:areaName` (future)
- **Emergency Room**: `emergency:broadcast`

---

## 📊 Scheduled Tasks

| Task | Interval | Function |
|------|----------|----------|
| Leaderboard Update | 5 min | `generateDonorLeaderboard()` |
| Heatmap Update | 2 min | `generateLiveHeatmap()` |
| Analytics Update | 3 min | `generateLiveAnalytics()` |
| Auto-Escalation | 5 min | `escalateAllPendingRequests()` |
| Connection Cleanup | 1 hour | Inactive connection cleanup |

---

## 💡 Client Integration Example

```typescript
import { io } from 'socket.io-client';

// Connect with auth
const socket = io('http://localhost:3000', {
    auth: {
        token: localStorage.getItem('accessToken')
    }
});

// Listen for connection
socket.on('connection_success', () => {
    console.log('Connected!');
});

// Send location
socket.emit('update_location', {
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'New York, NY'
});

// Listen for nearby donors
socket.on('nearby_donor_found', (data) => {
    console.log(`${data.donor.name} is ${data.distance} km away`);
});

// Listen for new blood requests
socket.on('new_blood_request', (request) => {
    showNotification(request.patientName + ' needs ' + request.bloodGroup);
    playSound();
});

// Accept request
socket.emit('accept_request', requestId);

// Send message
socket.emit('send_message', {
    recipientId: donorId,
    message: 'Hi! I can help',
    requestId: requestId
});

// Watch request updates
socket.emit('watch_request', requestId);
socket.on('request_status_changed', (status) => {
    updateUI(status);
});
```

---

## 🎯 What Sets This Apart

1. **Live Heatmap** - See real-time donor distribution
2. **AI-Powered Matching** - Intelligent donor-request pairing
3. **Community Leaderboard** - Gamification for engagement
4. **Trust Rating System** - Transparency & reliability
5. **Emergency Fast-Track** - 15km instant broadcast
6. **Real-Time Chat** - Seamless communication
7. **Achievement Badges** - Motivation system
8. **Smart Notifications** - Customizable alerts
9. **Live Analytics** - Admin insights
10. **Proximity Alerts** - Auto-notifications when nearby

---

## 🚀 Performance Considerations

- **Compression**: Socket.io messages auto-compressed
- **Reconnection**: Auto-retry with exponential backoff
- **Polling Fallback**: Works even without WebSocket
- **Connection Pooling**: Multiple socket instances managed
- **Rate Limiting**: Prevents spam/abuse
- **Memory Efficient**: Disconnected user data cleaned up
- **Scalable**: Rooms-based broadcasting for efficiency

---

## 🔗 Integration Points

- **Database**: MongoDB aggregation for leaderboard/analytics
- **Geolocation**: OpenStreetMap geocoding
- **Notifications**: Firebase/Expo integration ready
- **Payment**: Ready for donor incentive system
- **Push Notifications**: FCM/APNs integration points

---

## 📝 Future Enhancements

- [ ] Video call support for donor-requester
- [ ] Donation confirmation with photo verification
- [ ] Donor-recipient matching ML model
- [ ] Blood inventory management per hospital
- [ ] Multi-language support in notifications
- [ ] Integration with hospital management systems
