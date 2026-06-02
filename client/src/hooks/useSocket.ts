import type { Socket } from "socket.io-client";

export function useSocket(): { socket: Socket | null; connected: boolean } {
  // Websockets disabled — return a typed stub to avoid runtime and type errors.
  return { socket: null, connected: false };
}
