// Lightweight no-op socket manager used when websockets have been disabled.
// This preserves the public API so existing code paths can call into it
// without throwing runtime errors, while preventing any websocket
// initialization or network activity.

class SocketManager {
    public init(_httpServer: any) {
        // intentionally no-op
    }

    public getIO() {
        throw new Error('Websockets are disabled in this deployment');
    }

    public emitToUser(_userId: string, _event: string, _data: any) {
        // no-op
    }

    public emitToRoom(_room: string, _event: string, _data: any) {
        // no-op
    }

    public broadcast(_event: string, _data: any) {
        // no-op
    }

    public getConnectedUsersCount(): number {
        return 0;
    }

    public getOnlineDonors() {
        return [] as any[];
    }

    public getOnlineRequesters() {
        return [] as any[];
    }

    public notifyLiveRequestCreated(_request: any) {
        // no-op
    }

    public notifyRequestUpdated(_requestId: string, _updates: any) {
        // no-op
    }

    public notifyDonorMatched(_requestId: string, _donorId: string, _donor: any) {
        // no-op
    }

    public notifyNotification(_userId: string, _notification: any) {
        // no-op
    }
}

export const socketManager = new SocketManager();
