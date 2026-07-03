const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const config = require('../config');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  const clients = new Map(); // username -> WebSocket

  // 共享在线列表给 auth REST 端点
  server._onlineUsers = [];

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

    // 踢掉同一用户的旧连接
    if (clients.has(username)) {
      clients.get(username).close();
    }

    clients.set(username, ws);
    server._onlineUsers.push(username);
    broadcast({ type: 'online', username });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'message' && msg.to) {
          const target = clients.get(msg.to);
          const payload = JSON.stringify({
            type: 'message',
            from: username,
            content: msg.content,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          });
          if (target && target.readyState === WebSocket.OPEN) {
            target.send(payload);
          }
          // 不在线则静默丢弃
        }
      } catch { /* 忽略格式错误 */ }
    });

    ws.on('close', () => {
      clients.delete(username);
      server._onlineUsers = server._onlineUsers.filter(u => u !== username);
      broadcast({ type: 'offline', username });
    });

    // 发送当前在线用户列表给新连接的客户端
    ws.send(JSON.stringify({
      type: 'online_list',
      users: server._onlineUsers.filter(u => u !== username),
    }));
  });

  console.log('WebSocket server ready');
}

module.exports = setupWebSocket;
