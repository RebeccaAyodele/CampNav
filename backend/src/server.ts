import { createServer } from "http";
import { config } from "./config/env.js";
import { createApp } from "./app.js";
import { initializeWebSocket } from "./services/websocket.service.js";

const app = createApp();
const httpServer = createServer(app);

// Initialize Socket.io
initializeWebSocket(httpServer, config.corsOrigin);

httpServer.listen(config.port, () => {
  console.log(`CampNav backend listening on http://localhost:${config.port}`);
});

