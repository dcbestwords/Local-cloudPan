const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const config = require('../config');

let onlineUsers = [];

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  const clients = new Map(); // username -> WebSocket

  // 共享在线列表给 auth REST 端点
  onlineUsers = [];

  function broadcast(data) {
    const msg = JSON.stringify(data);
    for (const ws of clients.values()) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  wss.on('connection', (ws, req) => {
    // token 校验
    const params = new url.URL(req.url, `http://${req.headers.host}`).searchParams;
    const token = params.get('token');
    let username;
    try {
      const decoded = jwt.verify(token, config.global.jwtSecret);
      username = decoded.username;
    } catch {
      ws.close(4001, 'invalid token');
      return;
    }

    // Remove old entry before adding new
    onlineUsers = onlineUsers.filter(u => u !== username);
    clients.set(username, ws);
    onlineUsers.push(username);
    broadcast({ type: 'online', username });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'message' && msg.to) {
          const target = clients.get(msg.to);
          if (target && target.readyState === WebSocket.OPEN) {
            target.send(JSON.stringify({
              type: 'message',
              from: username,
              content: msg.content,
              time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            }));
          } else if (msg.msgId != null) {
            // 对方不在线，通知发送方
            ws.send(JSON.stringify({
              type: 'message_status',
              msgId: msg.msgId,
              status: 'failed',
            }));
          }
        }
      } catch { /* 忽略格式错误 */ }
    });

    ws.on('close', () => {
      clients.delete(username);
      onlineUsers = onlineUsers.filter(u => u !== username);
      broadcast({ type: 'offline', username });
    });

    // 发送当前在线用户列表给新连接的客户端
    ws.send(JSON.stringify({
      type: 'online_list',
      users: onlineUsers.filter(u => u !== username),
    }));
  });

  console.log('WebSocket server ready');
}

setupWebSocket.onlineUsers = () => onlineUsers;
module.exports = setupWebSocket;
