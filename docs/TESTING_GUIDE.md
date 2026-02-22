# 🧪 Testing Guide - Live Socket Features

## Quick Local Testing

### Prerequisites

```bash
# Server running
npm run dev

# MongoDB running locally
mongod

# Backend API listening on port 3000
```

---

## 1. Manual Socket Testing

### Using Socket.io Testing Client

```bash
# Install socket.io testing CLI
npm install -g socket.io-client

# Or use online tool: https://www.gstackoverflow.com/socket-io-client
```

### Test Connection

```javascript
const io = require('socket.io-client');

// Get JWT token from login first
const token = 'your_jwt_token_here';

const socket = io('http://localhost:3000', {
    auth: { token }
});

socket.on('connect', () => {
    console.log('✅ Connected:', socket.id);
});

socket.on('error', (error) => {
    console.error('❌ Error:', error);
});
```

---

## 2. Testing Individual Features

### Feature 1: Location Updates

```javascript
// Client: Send location
socket.emit('update_location', {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Main St, New York, NY',
    city: 'New York',
    state: 'New York'
});

// Server: Listen for success
socket.on('location_update_success', (data) => {
    console.log('✅ Location updated:', data);
});

// Server: Listen for nearby donors
socket.on('nearby_donor_found', (data) => {
    console.log('📍 Nearby donor:', data.donor.name, data.distance, 'km away');
});
```

### Feature 2: Blood Request Matching

```javascript
// Create a blood request via HTTP first
POST /api/v1/requests
{
    "patientName": "John Doe",
    "bloodGroup": "O+",
    "unitsRequired": 2,
    "urgency": "critical",
    "contactNumber": "+1234567890",
    "location": {
        "address": "Central Hospital, NY"
    }
}

// All nearby donors receive:
socket.on('new_blood_request', (data) => {
    console.log('🩸 New request:', data.request);
    console.log('Sound:', data.sound);
});

// Perfect matches receive:
socket.on('blood_request_matched', (data) => {
    console.log('🎯 Perfect match:', data.donor.name);
});
```

### Feature 3: Accept Request

```javascript
// Donor accepts request
socket.emit('accept_request', 'request_id_123');

// Donor receives confirmation
socket.on('accept_success', (data) => {
    console.log('✅ Accepted:', data);
});

// Requester receives notification
socket.on('request_accepted', (data) => {
    console.log('✅ Your request accepted by:', data.donor.name);
});
```

### Feature 4: Watch Request Updates

```javascript
// Start watching request
socket.emit('watch_request', 'request_id_123');

socket.on('watching_request', (data) => {
    console.log('👁️ Watching:', data.requestId);
});

// Receive real-time updates
socket.on('request_status_changed', (data) => {
    console.log('📝 Status changed:', data.status);
});

socket.on('request_updated', (data) => {
    console.log('🔄 Updated:', data.updates);
});

// Stop watching
socket.emit('unwatch_request', 'request_id_123');
```

### Feature 5: Direct Messaging

```javascript
// Send message
socket.emit('send_message', {
    recipientId: 'donor_id_123',
    message: 'Are you available today?',
    requestId: 'request_id_456'
});

socket.on('message_sent', (data) => {
    console.log('💬 Message sent');
});

// Receive message
socket.on('receive_message', (data) => {
    console.log(`📩 From ${data.senderName}: ${data.message}`);
});

// Typing indicator
socket.emit('user_typing', {
    recipientId: 'donor_id_123',
    isTyping: true
});

socket.on('user_typing_indicator', (data) => {
    if (data.isTyping) {
        console.log(`${data.from} is typing...`);
    }
});
```

### Feature 6: Donor Availability

```javascript
// Toggle availability
socket.emit('toggle_availability', { available: true });

socket.on('availability_updated', (data) => {
    console.log('Status:', data.available ? '✅ Available' : '❌ Unavailable');
});

// Requesters are notified
socket.on('donor_availability_changed', (data) => {
    console.log(`${data.donorId} is now ${data.available ? 'available' : 'unavailable'}`);
});
```

### Feature 7: Leaderboard Updates (Automatic)

```javascript
// Automatically emitted every 5 minutes
socket.on('leaderboard_updated', (data) => {
    console.log('🏆 Leaderboard:', data.leaderboard);
    data.leaderboard.forEach(donor => {
        console.log(`#${donor.rank} ${donor.badge} ${donor.name} - ${donor.totalDonations} units`);
    });
});

// Test manually
socket.emit('get_online_donors', {});
socket.on('online_donors_list', (data) => {
    console.log(`${data.count} donors online`);
});
```

### Feature 8: Live Heatmap (Automatic)

```javascript
// Automatically emitted every 2 minutes
socket.on('live_heatmap_update', (data) => {
    console.log('🌍 Heatmap:', data.heatmap);
    data.heatmap.forEach(cell => {
        console.log(`${cell._id.city} (${cell._id.bloodGroup}): ${cell.count} donors`);
    });
});
```

### Feature 9: Emergency Broadcast (Admin Only)

```javascript
// Admin sends emergency
socket.emit('broadcast_emergency', {
    bloodGroup: 'O-',
    unitsRequired: 5,
    message: 'Critical emergency at Central Hospital',
    urgency: 'critical',
    location: {
        coordinates: [-74.0060, 40.7128],
        city: 'New York'
    }
});

// All compatible donors receive
socket.on('emergency_alert', (data) => {
    console.log('🚨 EMERGENCY:', data.message);
    console.log('Blood Group:', data.bloodGroup);
    console.log('Urgency:', data.urgency);
    if (data.sound) {
        console.log('Sound should play');
    }
});
```

### Feature 10: Analytics (Admin Only)

```javascript
// Automatically emitted every 3 minutes
socket.on('live_analytics_update', (data) => {
    console.log('📊 Analytics Dashboard:');
    console.log('Active Requests:', data.activeRequests);
    console.log('Available Donors:', data.availableDonors);
    console.log('Units Today:', data.totalUnitsToday);
    console.log('Success Rate:', data.successRate);
    console.log('Avg Response Time:', data.avgResponseTimeMinutes, 'min');
});
```

### Feature 11: Achievements

```javascript
// Automatically sent when unlocked
socket.on('achievement_unlocked', (data) => {
    console.log('🎖️ Achievements Unlocked!', data.message);
    data.achievements.forEach(badge => {
        console.log(`✨ ${badge}`);
    });
});

// Make a donation to trigger
POST /api/v1/donations/accept
{
    "requestId": "request_id_123"
}
```

### Feature 12: Trust Rating

```javascript
// Rate a donor
POST /api/v1/donations/rate
{
    "donorId": "donor_id_123",
    "rating": 5,
    "review": "Excellent professional!"
}

// Donor receives notification
socket.on('trust_rating_updated', (data) => {
    console.log('⭐ Rating updated:', data.newRating);
    console.log('Total reviews:', data.totalReviews);
});
```

---

## 3. Automated Testing Script

```javascript
// test-socket.js - Run with: node test-socket.js

const io = require('socket.io-client');

const testSocket = (token, userId) => {
    const socket = io('http://localhost:3000', {
        auth: { token }
    });

    let testsPassed = 0;
    let testsFailed = 0;

    const test = (name, condition) => {
        if (condition) {
            console.log(`✅ ${name}`);
            testsPassed++;
        } else {
            console.log(`❌ ${name}`);
            testsFailed++;
        }
    };

    socket.on('connect', () => {
        test('Socket connection', true);

        // Test 1: Location Update
        socket.emit('update_location', {
            latitude: 40.7128,
            longitude: -74.0060,
            address: 'Test St'
        });

        socket.on('location_update_success', () => {
            test('Location update', true);
        });

        // Test 2: Availability Toggle
        socket.emit('toggle_availability', { available: true });

        socket.on('availability_updated', (data) => {
            test('Availability toggle', data.available === true);
        });

        // Test 3: Online Donors
        socket.emit('get_online_donors', {});

        socket.on('online_donors_list', (data) => {
            test('Get online donors', Array.isArray(data.donors));
        });

        // Test 4: Error Handling
        socket.emit('accept_request', 'invalid-id');

        socket.on('error', (error) => {
            test('Error handling', error !== undefined);
        });

        // Print summary after 5 seconds
        setTimeout(() => {
            console.log('\n=== Test Summary ===');
            console.log(`✅ Passed: ${testsPassed}`);
            console.log(`❌ Failed: ${testsFailed}`);
            socket.disconnect();
        }, 5000);
    });

    socket.on('error', (error) => {
        console.error('Connection error:', error);
    });
};

// Run test
testSocket('your_jwt_token', 'user_id_123');
```

---

## 4. Load Testing

### Using Artillery

```bash
# Install
npm install -g artillery

# Create config: load-test.yml
```

```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 users/sec
      name: "Ramp up"
    - duration: 120
      arrivalRate: 50  # 50 users/sec
      name: "Sustained load"

scenarios:
  - name: "Socket Load Test"
    flow:
      - connect:
          target: "localhost:3000"
          query:
            token: "{{ jwtToken }}"
      - emit:
          channel: "update_location"
          data:
            latitude: "{{ randomNumber(40, 41) }}"
            longitude: "{{ randomNumber(-75, -73) }}"
      - emit:
          channel: "get_online_donors"
      - wait: 5000
```

```bash
# Run load test
artillery run load-test.yml
```

---

## 5. Live Testing Checklist

```
Connection & Authentication
├─ ✅ Socket connects without errors
├─ ✅ JWT token is validated
└─ ✅ Unauthorized connections rejected

Location Features
├─ ✅ Location updates are saved
├─ ✅ Nearby donors are found
├─ ✅ Multiple locations work
└─ ✅ Geocoding extracts all fields

Request Management
├─ ✅ New requests are broadcast
├─ ✅ Requests are matched to donors
├─ ✅ Accept request updates DB
├─ ✅ Rejectrequest sends confirmation
└─ ✅ Request watchers get updates

Messaging
├─ ✅ Messages are delivered
├─ ✅ Typing indicators work
├─ ✅ Message history is available
└─ ✅ Notifications are sent

Live Features
├─ ✅ Leaderboard updates every 5 min
├─ ✅ Heatmap updates every 2 min
├─ ✅ Analytics updates every 3 min
├─ ✅ Emergency alerts broadcast
└─ ✅ Achievements unlock correctly

Performance
├─ ✅ No memory leaks
├─ ✅ <50ms message latency
├─ ✅ Handles 1000+ connections
└─ ✅ Auto-reconnects on disconnect

Error Handling
├─ ✅ Invalid tokens rejected
├─ ✅ Invalid requests handled
├─ ✅ Database errors caught
└─ ✅ Graceful disconnection
```

---

## 6. Debugging Tips

### Enable Debug Logs

```javascript
// Client
socket.onAny((event, ...args) => {
    console.log('EVENT:', event, args);
});

// Server
logger.debug() calls are already in place
```

### Monitor Socket Connections

```bash
# View socket.io connections in browser DevTools
# Go to: Application > Cookies > socket.io cookie
# Shows all active connections and rooms
```

### Test with Multiple Clients

```javascript
// Terminal 1: Run server
npm run dev

// Terminal 2: Connect as donor
node -e "
const io = require('socket.io-client');
const s1 = io('http://localhost:3000', {
  auth: { token: 'donor_token' }
});
s1.on('new_blood_request', (d) => console.log('Donor received:', d));
"

// Terminal 3: Connect as requester
node -e "
const io = require('socket.io-client');
const s2 = io('http://localhost:3000', {
  auth: { token: 'requester_token' }
});
s2.on('request_accepted', (d) => console.log('Requester received:', d));
"
```

---

## 7. Production Testing

```bash
# Test with SSL/TLS
const socket = io('https://yourdomain.com', {
    auth: { token },
    secure: true
});

# Test reconnection
const socket = io(url, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});

# Monitor with: pm2 monit
```

---

## 8. Troubleshooting

### Issue: "Connection refused"
```javascript
// Check server is running
// Check port 3000 is not blocked
// Check CORS configuration
```

### Issue: "Authentication error"
```javascript
// Verify JWT token is valid
// Check token hasn't expired
// Ensure token format is correct
```

### Issue: "Messages not delivered"
```javascript
// Check user is in correct room
// Verify socket is still connected
// Check recipient exists
```

### Issue: "High latency"
```javascript
// Check network connection
// Monitor server CPU/memory
// Check database query performance
// Consider Redis adapter for scaling
```

---

## Success Criteria

All tests pass when:

✅ Connections established <100ms
✅ Messages delivered <50ms  
✅ All 12 features working  
✅ Leaderboard updates on schedule
✅ No memory leaks
✅ 1000+ concurrent users supported
✅ Error handling working
✅ Real-time updates instant

---

## Next Steps

1. Run basic connectivity tests
2. Test each feature individually
3. Perform load testing
4. Deploy to staging
5. Monitor in production
6. Gather user feedback
7. Optimize based on metrics
