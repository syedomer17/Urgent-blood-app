import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Singleton socket shared across the entire app session
let globalSocket: Socket | null = null;

function getOrCreateSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io("/", {
      withCredentials: true, // send httpOnly accessToken cookie automatically
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });
  }
  return globalSocket;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getOrCreateSocket();
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // If already connected when this hook mounts
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket: socketRef.current ?? globalSocket, connected };
}
