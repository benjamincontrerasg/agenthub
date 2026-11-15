import { WebSocket } from 'ws';
import { WSEvent, WSEventType } from '../types.js';

class WebSocketManager {
  private clients: Set<WebSocket> = new Set();

  public registerClient(ws: WebSocket) {
    this.clients.add(ws);
    console.log(`[WS] Client connected. Total active connections: ${this.clients.size}`);

    ws.on('close', () => {
      this.clients.delete(ws);
      console.log(`[WS] Client disconnected. Total active connections: ${this.clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WS Error]', err);
      this.clients.delete(ws);
    });

    // Send initial welcome/ready event
    this.sendTo(ws, {
      type: 'agent.message',
      payload: {
        id: `sys-${Date.now()}`,
        senderType: 'system',
        senderName: 'NEXORA Gateway',
        content: 'Conexión WebSocket en tiempo real establecida.',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public removeClient(ws: WebSocket) {
    this.clients.delete(ws);
  }

  public broadcast<T = any>(type: WSEventType, payload: T) {
    const event: WSEvent<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    const data = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch (err) {
          console.error('[WS Broadcast Error]', err);
        }
      }
    }
  }

  private sendTo(ws: WebSocket, event: WSEvent) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(event));
      } catch (err) {
        console.error('[WS Send Error]', err);
      }
    }
  }
}

export const wsManager = new WebSocketManager();
