import { WSEvent, WSEventType } from '@/types';

type EventHandler<T = any> = (payload: T) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<WSEventType, Set<EventHandler>> = new Map();
  private reconnectInterval = 5000;
  private isConnecting = false;
  private mockMode = true;

  constructor() {
    this.mockMode = import.meta.env.VITE_USE_MOCK !== 'false';
  }

  public connect(url: string = import.meta.env.VITE_WS_URL || 'wss://api.agenthub.dev/ws') {
    if (this.mockMode) {
      // In mock mode, we do not attempt raw TCP connection
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.info('[AgentHub WS] Conectado al stream de eventos en tiempo real.');
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed: WSEvent = JSON.parse(event.data);
          this.emit(parsed.type, parsed.payload);
        } catch (err) {
          console.warn('[AgentHub WS] Mensaje no parseable:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        setTimeout(() => this.connect(url), this.reconnectInterval);
      };

      this.ws.onerror = (err) => {
        console.error('[AgentHub WS Error]', err);
        this.ws?.close();
      };
    } catch (e) {
      this.isConnecting = false;
      console.warn('[AgentHub WS] No se pudo inicializar WebSocket:', e);
    }
  }

  public on<T = any>(eventType: WSEventType, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  public emit<T = any>(eventType: WSEventType, payload: T) {
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
      console.info('[AgentHub WS Mock Send]', event);
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

export const wsService = new WebSocketService();
