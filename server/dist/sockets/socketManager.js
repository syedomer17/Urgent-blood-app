"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketManager = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/** Parse a single cookie value from the raw Cookie header string */
function extractCookie(cookieHeader, name) {
    if (!cookieHeader)
        return undefined;
    for (const part of cookieHeader.split(';')) {
        const [k, ...rest] = part.trim().split('=');
        if (k.trim() === name)
            return rest.join('=');
    }
    return undefined;
}
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../config/logger"));
const user_model_1 = require("../modules/users/user.model");
const request_model_1 = require("../modules/requests/request.model");
class SocketManager {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> SocketUser
        this.activeRequests = new Map(); // requestId -> request data
        this.userSockets = new Map(); // userId -> [socketIds]
    }
    init(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: env_1.config.cors.origin,
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
            pingInterval: 25000,
            pingTimeout: 60000,
        });
        // Authentication Middleware — accepts token from auth handshake OR accessToken cookie
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token ||
                extractCookie(socket.handshake.headers.cookie, 'accessToken');
            if (!token) {
                return next(new Error('Authentication error'));
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
                socket.data.userId = decoded.sub;
                socket.data.role = decoded.role;
                next();
            }
            catch (err) {
                next(new Error('Authentication error'));
            }
        });
        // Connection Handler
        this.io.on('connection', (socket) => {
            const userId = socket.data.userId;
            // Join user-specific room
            socket.join(userId);
            socket.join(`${socket.data.role}:room`);
            // Track connected users
            this.addConnectedUser(userId, socket.id, socket.data.role);
            this.broadcast('active_users_count', {
                count: this.connectedUsers.size,
                timestamp: new Date(),
            });
            // Listen for socket events
            this.setupEventListeners(socket);
            // Handle disconnection
            socket.on('disconnect', () => {
                this.removeConnectedUser(userId, socket.id);
                this.broadcast('active_users_count', {
                    count: this.connectedUsers.size,
                });
            });
            // Handle errors
            socket.on('error', (error) => {
                logger_1.default.error(`Socket error:`, error?.message || error);
            });
        });
        logger_1.default.info('Socket.io ready');
    }
    setupEventListeners(socket) {
        const userId = socket.data.userId;
        const role = socket.data.role;
        // User Location Update (for live tracking)
        socket.on('update_location', async (data) => {
            try {
                const { latitude, longitude, address, city, state } = data;
                // Update in connected users
                const user = this.connectedUsers.get(userId);
                if (user) {
                    user.location = {
                        coordinates: [longitude, latitude],
                        city,
                        state,
                    };
                    user.lastActivity = new Date();
                }
                // Update in database
                if (role === 'donor') {
                    await user_model_1.User.findByIdAndUpdate(userId, {
                        location: {
                            type: 'Point',
                            coordinates: [longitude, latitude],
                            address,
                            city,
                            state,
                        },
                    });
                    // Notify about new nearby donors
                    this.notifyNearbyRequesters(userId, {
                        latitude,
                        longitude,
                        city,
                        state,
                    });
                }
                socket.emit('location_update_success', {
                    message: 'Location updated successfully',
                    timestamp: new Date(),
                });
            }
            catch (error) {
                logger_1.default.error('Location update error:', error);
                socket.emit('error', { message: 'Failed to update location' });
            }
        });
        // Real-time Request Updates
        socket.on('watch_request', (requestId) => {
            socket.join(`request:${requestId}`);
            socket.emit('watching_request', {
                requestId,
                message: 'Now watching real-time updates for this request',
            });
        });
        socket.on('unwatch_request', (requestId) => {
            socket.leave(`request:${requestId}`);
        });
        // Donor Availability Toggle
        socket.on('toggle_availability', async (data) => {
            try {
                const { available } = data;
                await user_model_1.User.findByIdAndUpdate(userId, { availability: available });
                this.connectedUsers.get(userId).isActive = available;
                socket.emit('availability_updated', {
                    available,
                    message: available ? 'You are now available' : 'You are now unavailable',
                });
                // Broadcast to requesters
                this.io?.to('requester:room').emit('donor_availability_changed', {
                    donorId: userId,
                    available,
                    timestamp: new Date(),
                });
            }
            catch (error) {
                logger_1.default.error('Availability toggle error:', error);
                socket.emit('error', { message: 'Failed to update availability' });
            }
        });
        // Accept/Reject Blood Request
        socket.on('accept_request', async (requestId) => {
            try {
                const request = await request_model_1.BloodRequest.findById(requestId);
                if (!request) {
                    socket.emit('error', { message: 'Request not found' });
                    return;
                }
                // Update request status
                request.status = 'accepted';
                await request.save();
                // Notify requester
                this.io?.to(request.requesterid.toString()).emit('request_accepted', {
                    requestId,
                    donorId: userId,
                    donor: await user_model_1.User.findById(userId),
                    message: 'Your blood request has been accepted!',
                    timestamp: new Date(),
                });
                // Notify all watching this request
                this.io?.to(`request:${requestId}`).emit('request_status_changed', {
                    requestId,
                    status: 'accepted',
                    acceptedBy: userId,
                    timestamp: new Date(),
                });
                socket.emit('accept_success', {
                    requestId,
                    message: 'Request accepted successfully',
                });
            }
            catch (error) {
                logger_1.default.error('Accept request error:', error);
                socket.emit('error', { message: 'Failed to accept request' });
            }
        });
        // Reject Blood Request
        socket.on('reject_request', async (requestId) => {
            try {
                this.io?.to(`request:${requestId}`).emit('donor_rejected', {
                    requestId,
                    donorId: userId,
                    timestamp: new Date(),
                });
                socket.emit('reject_success', {
                    requestId,
                    message: 'Request rejected',
                });
            }
            catch (error) {
                logger_1.default.error('Reject request error:', error);
            }
        });
        // Emergency Broadcast (Admins only)
        socket.on('broadcast_emergency', async (data) => {
            if (role !== 'admin') {
                socket.emit('error', { message: 'Unauthorized' });
                return;
            }
            try {
                const { message, bloodGroup, urgency, location } = data;
                this.io?.emit('emergency_alert', {
                    message,
                    bloodGroup,
                    urgency,
                    location,
                    timestamp: new Date(),
                    sound: true, // Client should play sound
                });
                logger_1.default.info('🚨 Emergency broadcast sent');
            }
            catch (error) {
                logger_1.default.error('Emergency broadcast error:', error);
            }
        });
        // Chat/Messaging — persists to DB then broadcasts
        socket.on('send_message', async (data) => {
            try {
                const { recipientId, message } = data;
                const sender = await user_model_1.User.findById(userId).select('name');
                // Persist to MongoDB
                const { saveMessage } = await Promise.resolve().then(() => __importStar(require('../modules/chat/chat.service')));
                const saved = await saveMessage(userId, recipientId, message);
                const payload = {
                    _id: saved._id.toString(),
                    from: userId,
                    senderName: sender?.name ?? 'Unknown',
                    message,
                    timestamp: saved.createdAt,
                };
                this.io?.to(recipientId).emit('receive_message', payload);
                socket.emit('message_sent', payload);
            }
            catch (error) {
                logger_1.default.error('Message send error:', error);
            }
        });
        // Typing Indicator
        socket.on('user_typing', (data) => {
            const { recipientId, isTyping } = data;
            this.io?.to(recipientId).emit('user_typing_indicator', {
                from: userId,
                isTyping,
            });
        });
        // Ping a donor — requester alerts a specific donor about their blood request
        socket.on('ping_donor', async (data) => {
            try {
                const { donorId, requestId, bloodGroup, patientName, urgency, location } = data;
                const requester = await user_model_1.User.findById(userId).select('name');
                this.io?.to(donorId).emit('donor_pinged', {
                    from: userId,
                    requesterName: requester?.name ?? 'A requester',
                    requestId,
                    bloodGroup,
                    patientName,
                    urgency,
                    location,
                    timestamp: new Date(),
                });
                socket.emit('ping_sent', { donorId, timestamp: new Date() });
            }
            catch (error) {
                logger_1.default.error('Ping donor error:', error);
            }
        });
        // Request Priority Level Change
        socket.on('request_update', async (data) => {
            try {
                const { requestId, updateData } = data;
                const request = await request_model_1.BloodRequest.findByIdAndUpdate(requestId, updateData, { new: true });
                // Notify all watchers
                this.io?.to(`request:${requestId}`).emit('request_updated', {
                    requestId,
                    updates: updateData,
                    fullRequest: request,
                    timestamp: new Date(),
                });
            }
            catch (error) {
                logger_1.default.error('Request update error:', error);
            }
        });
        // Get Online Donors
        socket.on('get_online_donors', () => {
            const onlineDonors = Array.from(this.connectedUsers.values())
                .filter(u => u.role === 'donor' && u.isActive)
                .map(u => ({
                userId: u.userId,
                location: u.location,
                lastActivity: u.lastActivity,
            }));
            socket.emit('online_donors_list', {
                donors: onlineDonors,
                count: onlineDonors.length,
            });
        });
        // Request Status Poll (for live tracking)
        socket.on('poll_request_status', async (requestId) => {
            try {
                const request = await request_model_1.BloodRequest.findById(requestId);
                socket.emit('request_status', {
                    requestId,
                    status: request?.status,
                    updatedAt: request?.updatedAt,
                });
            }
            catch (error) {
                logger_1.default.error('Poll error:', error);
            }
        });
    }
    // Helper Methods
    addConnectedUser(userId, socketId, role) {
        let sockets = this.userSockets.get(userId) || [];
        sockets.push(socketId);
        this.userSockets.set(userId, sockets);
        let user = this.connectedUsers.get(userId);
        if (!user) {
            user = {
                userId,
                socketId,
                role,
                isActive: true,
                lastActivity: new Date(),
            };
        }
        this.connectedUsers.set(userId, user);
    }
    removeConnectedUser(userId, socketId) {
        let sockets = this.userSockets.get(userId) || [];
        sockets = sockets.filter(s => s !== socketId);
        if (sockets.length === 0) {
            this.userSockets.delete(userId);
            this.connectedUsers.delete(userId);
        }
        else {
            this.userSockets.set(userId, sockets);
        }
    }
    async notifyNearbyRequesters(donorId, location) {
        try {
            const donor = await user_model_1.User.findById(donorId);
            if (!donor || !donor.bloodGroup)
                return;
            // Find active requests within 10km
            const nearbyRequests = await request_model_1.BloodRequest.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: location.coordinates || [0, 0],
                        },
                        distanceField: 'distance',
                        maxDistance: 10000, // 10km
                        spherical: true,
                    },
                },
                {
                    $match: {
                        status: 'pending',
                    },
                },
            ]);
            for (const request of nearbyRequests) {
                this.io?.to(request.requesterid.toString()).emit('nearby_donor_found', {
                    donor: {
                        id: donorId,
                        name: donor.name,
                        bloodGroup: donor.bloodGroup,
                        distance: (request.distance / 1000).toFixed(2) + ' km',
                    },
                    requestId: request._id,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Notify nearby requesters error:', error);
        }
    }
    // Public Methods
    getIO() {
        if (!this.io) {
            throw new Error('Socket.io not initialized!');
        }
        return this.io;
    }
    emitToUser(userId, event, data) {
        if (this.io) {
            this.io.to(userId).emit(event, data);
            logger_1.default.debug(`📤 Emitting ${event} to user ${userId}`);
        }
    }
    emitToRoom(room, event, data) {
        if (this.io) {
            this.io.to(room).emit(event, data);
        }
    }
    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    getOnlineDonors() {
        return Array.from(this.connectedUsers.values()).filter(u => u.role === 'donor' && u.isActive);
    }
    getOnlineRequesters() {
        return Array.from(this.connectedUsers.values()).filter(u => u.role === 'requester');
    }
    notifyLiveRequestCreated(request) {
        this.io?.to('donor:room').emit('new_blood_request', {
            request,
            timestamp: new Date(),
            sound: true,
        });
    }
    notifyRequestUpdated(requestId, updates) {
        this.io?.to(`request:${requestId}`).emit('live_update', {
            requestId,
            updates,
            timestamp: new Date(),
        });
    }
    notifyDonorMatched(requestId, donorId, donor) {
        this.io?.to(donorId).emit('blood_request_matched', {
            request: requestId,
            donor,
            message: 'You are matched with a blood request!',
            urgency: 'high',
            sound: true,
        });
    }
    notifyNotification(userId, notification) {
        this.io?.to(userId).emit('new_notification', {
            notification,
            timestamp: new Date(),
        });
    }
}
exports.socketManager = new SocketManager();
