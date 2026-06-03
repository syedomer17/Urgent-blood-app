"use strict";
// Lightweight no-op socket manager used when websockets have been disabled.
// This preserves the public API so existing code paths can call into it
// without throwing runtime errors, while preventing any websocket
// initialization or network activity.
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketManager = void 0;
class SocketManager {
    init(_httpServer) {
        // intentionally no-op
    }
    getIO() {
        throw new Error('Websockets are disabled in this deployment');
    }
    emitToUser(_userId, _event, _data) {
        // no-op
    }
    emitToRoom(_room, _event, _data) {
        // no-op
    }
    broadcast(_event, _data) {
        // no-op
    }
    getConnectedUsersCount() {
        return 0;
    }
    getOnlineDonors() {
        return [];
    }
    getOnlineRequesters() {
        return [];
    }
    notifyLiveRequestCreated(_request) {
        // no-op
    }
    notifyRequestUpdated(_requestId, _updates) {
        // no-op
    }
    notifyDonorMatched(_requestId, _donorId, _donor) {
        // no-op
    }
    notifyNotification(_userId, _notification) {
        // no-op
    }
}
exports.socketManager = new SocketManager();
