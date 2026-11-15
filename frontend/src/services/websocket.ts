import { z } from 'zod';
import { WSEvent, WSEventType } from '@/types';

export const wsEventSchema = z.object({
  type: z.string(),
  payload: z.any(),
  timestamp: z.string().optional(),
});

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

type EventHandler<T = any> = (payload: T) => void;
type StatusHandler = (status: ConnectionStatus) => void;
type ResyncHandler = () => Promise<void> | void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private statusListeners: Set<StatusHandler> = new Set();
  private resyncHandlers: Set<ResyncHandler> = new Set();
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private url: string = '';
  private mockMode = false;

  constructor() {
    this.mockMode = import.meta.env.VITE_USE_MOCKS === 'true' || import.meta.env.VITE_USE_MOCK === 'true';
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((fn) => {
        try {
          fn(newStatus);
        } catch (e) {
          console.error('[WS Status Listener Error]', e);
        }
      });
    }
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusListeners.add(handler);
    handler(this.status);
    return () => this.statusListeners.delete(handler);
  }

  public onResync(handler: ResyncHandler): () => void {
    this.resyncHandlers.add(handler);
    return () => this.resyncHandlers.delete(handler);
  }

  public connect(url: string = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws') {
    this.url = url;

    if (this.mockMode) {
      this.setStatus('connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.cleanupHeartbeat();
    clearTimeout(this.reconnectTimer);
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = async () => {
        const wasReconnecting = this.reconnectAttempts > 0;
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.startHeartbeat();

        // Si se reconectó tras una caída, ejecutar resincronización por HTTP
        if (wasReconnecting) {
          console.info('[NEXORA WS] Conexión restablecida. Ejecutando resincronización de estado HTTP...');
          for (const resync of this.resyncHandlers) {
            try {
              await resync();
            } catch (err) {
              console.warn('[WS Resync Warning]', err);
            }
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const validated = wsEventSchema.safeParse(raw);
          if (!validated.success) {
            console.warn('[NEXORA WS] Mensaje descartado por fallo de validación Zod:', validated.error);
            return;
          }

          if (validated.data.type === 'pong') {
            return;
          }

          this.emit(validated.data.type as WSEventType, validated.data.payload);
        } catch (err) {
          console.warn('[NEXORA WS] Error deserializando evento WebSocket:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.cleanupHeartbeat();
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[NEXORA WS Error]', err);
        this.ws?.close();
      };
    } catch (e) {
      console.warn('[NEXORA WS] Error al instanciar socket:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.setStatus('reconnecting');
    this.reconnectAttempts++;
    // Backoff exponencial: 1s, 1.5s, 2.25s ... hasta máx 30s
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.url);
    }, delay);
  }

  private startHeartbeat() {
    this.cleanupHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'ping', timestamp: new Date().toISOString() }));
      }
    }, 30000); // Heartbeat cada 30 segundos
  }

  private cleanupHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public on<T = any>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  public emit<T = any>(eventType: string, payload: T) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          console.error(`Error in event listener for ${eventType}:`, err);
        }
      });
    }
  }

  public send(event: { action: string; [key: string]: any }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else if (this.mockMode) {
      console.info('[NEXORA WS Mock Send]', event);
    }
  }

  public disconnect() {
    clearTimeout(this.reconnectTimer);
    this.cleanupHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
    this.listeners.clear();
  }
}

export const wsService = new WebSocketService();
