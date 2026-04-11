import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
const logger = console;

class WsHub {
  constructor() {
    // Map of wardId (string) → Set<WebSocket>
    this.rooms = new Map();
    // Map of ws → { wardId, userId, role }
    this.meta = new WeakMap();
    this.wss = null;
  }

  init(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `ws://localhost`);
      const token  = url.searchParams.get('token');
      const wardId = url.searchParams.get('wardId');

      // Authenticate on upgrade
      let user;
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        ws.close(4001, 'Unauthorized');
        return;
      }

      if (!wardId) {
        ws.close(4002, 'wardId required');
        return;
      }

      this._register(wardId, ws, user);

      // Send initial snapshot confirmation
      this._send(ws, { type: 'CONNECTED', wardId, userId: user._id });

      ws.on('close', () => this._deregister(wardId, ws));
      ws.on('error', (err) => {
        logger.warn('WS client error', { err: err.message });
        this._deregister(wardId, ws);
      });

      // Heartbeat pong
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          if (msg.type === 'PING') this._send(ws, { type: 'PONG' });
        } catch { /* ignore malformed messages */ }
      });

      logger.debug('WS client connected', { wardId, userId: user._id, role: user.role });
    });

    this._startHeartbeat();
    logger.info('WebSocket server ready on /ws');
  }

  // Broadcast a payload to every connected client in a ward
  broadcast(wardId, payload) {
    const room = this.rooms.get(String(wardId));
    if (!room?.size) return;

    const msg = JSON.stringify(payload);
    let sent = 0;
    room.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
        sent++;
      }
    });
    logger.debug('WS broadcast', { wardId, type: payload.type, recipients: sent });
  }

  // Broadcast to ALL wards (used by admin-level events)
  broadcastAll(payload) {
    this.rooms.forEach((_, wardId) => this.broadcast(wardId, payload));
  }

  _register(wardId, ws, user) {
    if (!this.rooms.has(wardId)) this.rooms.set(wardId, new Set());
    this.rooms.get(wardId).add(ws);
    this.meta.set(ws, { wardId, userId: user._id, role: user.role });
  }

  _deregister(wardId, ws) {
    this.rooms.get(wardId)?.delete(ws);
    if (this.rooms.get(wardId)?.size === 0) this.rooms.delete(wardId);
    logger.debug('WS client disconnected', { wardId });
  }

  _send(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  }

  // Ping all clients every 30s; terminate dead ones
  _startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          const meta = this.meta.get(ws);
          if (meta) this._deregister(meta.wardId, ws);
          ws.terminate();
        }
      });
    }, 30_000);
  }

  get clientCount() {
    let total = 0;
    this.rooms.forEach((room) => (total += room.size));
    return total;
  }
}

// Singleton — imported by changeStreamWatcher and routes
export const wsHub = new WsHub();
