/**
 * Socket.io client singleton for WebSocket connections.
 * Connects to the backend for real-time shuttle/lost-person events.
 */

import { io, type Socket } from "socket.io-client";
import { config } from "@/config";
import { logger } from "./logger";

let socket: Socket | null = null;

/** Get or create the Socket.io connection */
export function getSocket(): Socket {
  if (!socket) {
    const url = config.api.baseUrl;
    socket = io(url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      logger.info("WebSocket connected", { id: socket?.id });
    });

    socket.on("disconnect", (reason) => {
      logger.info("WebSocket disconnected", { reason });
    });

    socket.on("connect_error", (error) => {
      logger.error("WebSocket connection error", { message: error.message });
    });
  }

  return socket;
}

/** Connect the socket */
export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

/** Disconnect the socket */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

/** Join a room (e.g., "logistics") */
export function joinRoom(roomName: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit("join-room", roomName);
    logger.info("Joined WebSocket room", { roomName });
  } else {
    s.once("connect", () => {
      s.emit("join-room", roomName);
      logger.info("Joined WebSocket room after connect", { roomName });
    });
  }
}

/** Listen for an event */
export function onEvent<T = unknown>(eventName: string, callback: (data: T) => void): void {
  const s = getSocket();
  s.on(eventName, callback as (...args: unknown[]) => void);
}

/** Remove event listener */
export function offEvent<T = any>(eventName: string, callback?: (data: T) => void): void {
  const s = getSocket();
  if (callback) {
    s.off(eventName, callback as (...args: unknown[]) => void);
  } else {
    s.off(eventName);
  }
}

/** Check if socket is connected */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
