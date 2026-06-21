import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";

let io: Server | null = null;

export function initializeWebSocket(server: HTTPServer, corsOrigin: string): Server {
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on("join-room", (roomName: string) => {
      socket.join(roomName);
      console.log(`👤 Client ${socket.id} joined room: ${roomName}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitEvent(eventName: string, data: any, roomName?: string) {
  if (!io) {
    console.warn("⚠️ Cannot emit event. Socket.io is not initialized.");
    return;
  }
  
  if (roomName) {
    io.to(roomName).emit(eventName, data);
  } else {
    io.emit(eventName, data);
  }
}
