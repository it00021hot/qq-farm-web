import { onUnmounted, ref } from 'vue';
import { getToken } from '@/store/modules/auth/shared';
import { localStg } from '@/utils/storage';

export type FarmWsHandler = (type: string, payload: unknown, raw?: Api.Farm.WsMessage) => void;

export interface UseFarmWsOptions {
  /** WebSocket path, default `/farm/ws` */
  path?: string;
  /** Auto reconnect, default true */
  reconnect?: boolean;
  /** Reconnect base delay ms, default 2000 */
  reconnectDelay?: number;
  /** Max reconnect delay ms, default 30000 */
  maxReconnectDelay?: number;
  onMessage?: FarmWsHandler;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
}

function resolveWsUrl(path: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const token = getToken();
  const tenantId = localStg.get('tenantId');

  const query = new URLSearchParams();
  if (token) query.set('token', token);
  if (tenantId) query.set('tenantId', String(tenantId));

  // Dev HTTP goes through Vite `/proxy-default`; WS must use the same prefix
  // so upgrade is forwarded to the Go backend (not served by Vite itself).
  const isDevProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const wsPath = isDevProxy ? `/proxy-default${path.startsWith('/') ? path : `/${path}`}` : path;

  const qs = query.toString();
  return `${protocol}//${host}${wsPath}${qs ? `?${qs}` : ''}`;
}

export function useFarmWs(options: UseFarmWsOptions = {}) {
  const path = options.path || '/farm/ws';
  const shouldReconnect = options.reconnect !== false;
  const reconnectDelay = options.reconnectDelay ?? 2000;
  const maxReconnectDelay = options.maxReconnectDelay ?? 30000;

  let socket: WebSocket | null = null;
  let destroyed = false;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let manualClose = false;

  const connected = ref(false);
  const lastType = ref<string>('');
  const lastPayload = ref<unknown>(null);

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function parseMessage(raw: string): Api.Farm.WsMessage | null {
    try {
      const data = JSON.parse(raw) as Record<string, unknown>;
      const type = String(data.type || data.event || '');
      if (!type) return null;
      const payload = data.payload !== undefined ? data.payload : data.data !== undefined ? data.data : data;
      const accountId = Number(data.accountId || 0) || undefined;
      // Ensure payload objects also carry accountId for UI filters.
      let nextPayload = payload;
      if (payload && typeof payload === 'object' && !Array.isArray(payload) && accountId) {
        nextPayload = { ...(payload as Record<string, unknown>), accountId };
      }
      return { type, payload: nextPayload, accountId };
    } catch {
      return null;
    }
  }

  function scheduleReconnect() {
    if (destroyed || manualClose || !shouldReconnect) return;
    clearReconnectTimer();
    const delay = Math.min(reconnectDelay * 2 ** attempt, maxReconnectDelay);
    attempt += 1;
    reconnectTimer = setTimeout(() => {
      connect();
    }, delay);
  }

  function handleOpen() {
    connected.value = true;
    attempt = 0;
    options.onOpen?.();
  }

  function handleMessage(event: MessageEvent) {
    const text = typeof event.data === 'string' ? event.data : '';
    if (!text) return;
    const msg = parseMessage(text);
    if (!msg) return;
    lastType.value = msg.type;
    lastPayload.value = msg.payload;
    options.onMessage?.(msg.type, msg.payload, msg);
  }

  function handleError(event: Event) {
    options.onError?.(event);
  }

  function handleClose() {
    connected.value = false;
    socket = null;
    options.onClose?.();
    scheduleReconnect();
  }

  function bindSocket(ws: WebSocket) {
    ws.addEventListener('open', handleOpen);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('error', handleError);
    ws.addEventListener('close', handleClose);
  }

  function unbindSocket(ws: WebSocket) {
    ws.removeEventListener('open', handleOpen);
    ws.removeEventListener('message', handleMessage);
    ws.removeEventListener('error', handleError);
    ws.removeEventListener('close', handleClose);
  }

  function connect() {
    if (destroyed) return;
    manualClose = false;
    clearReconnectTimer();

    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      socket = new WebSocket(resolveWsUrl(path));
    } catch {
      scheduleReconnect();
      return;
    }

    bindSocket(socket);
  }

  function disconnect() {
    manualClose = true;
    clearReconnectTimer();
    if (socket) {
      unbindSocket(socket);
      socket.close();
      socket = null;
    }
    connected.value = false;
  }

  function send(type: string, payload?: unknown) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type, payload }));
    return true;
  }

  function destroy() {
    destroyed = true;
    disconnect();
  }

  onUnmounted(() => {
    destroy();
  });

  return {
    connected,
    lastType,
    lastPayload,
    connect,
    disconnect,
    send,
    destroy
  };
}
