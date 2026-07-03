import { ref } from 'vue';
import { useChatDB } from './useChatDB';

const { saveMessage } = useChatDB();

// 全局单例状态
const isConnected = ref(false);
const contacts = ref<Contact[]>([]);
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const messageHandlers: Array<(msg: { from: string; content: string; time: string }) => void> = [];

function connect() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${location.hostname}:9527?token=${token}`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    isConnected.value = true;
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        // 存 IndexedDB
        saveMessage({
          contact: data.from,
          content: data.content,
          time: data.time,
          isSelf: false,
        });
        // 通知所有注册的 handler
        for (const handler of messageHandlers) {
          handler({ from: data.from, content: data.content, time: data.time });
        }
      } else if (data.type === 'online') {
        if (!contacts.value.find(c => c.username === data.username)) {
          contacts.value.push({ username: data.username, online: true });
        }
      } else if (data.type === 'offline') {
        contacts.value = contacts.value.filter(c => {
          return c.username !== data.username;
        });
      } else if (data.type === 'online_list') {
        contacts.value = (data.users as string[]).map(u => ({ username: u, online: true }));
      }
    } catch { /* ignore */ }
  };

  ws.onclose = (event) => {
    isConnected.value = false;
    // Don't reconnect on auth failures (4001 = invalid token)
    if (event.code === 4001) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 1000 + Math.random() * 4000);
  };

  ws.onerror = () => {
    ws?.close();
  };
}

export function useWebSocket() {
  // 首次调用时连接
  if (!ws) connect();

  function sendMessage(to: string, content: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'message', to, content }));
  }

  function onMessage(handler: (msg: { from: string; content: string; time: string }) => void) {
    messageHandlers.push(handler);
  }

  return { sendMessage, onMessage, isConnected, contacts };
}
