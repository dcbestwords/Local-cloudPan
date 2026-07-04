# 登录 + 局域网聊天 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有项目上添加 JWT 登录/注册和基于 WebSocket 的局域网一对一私聊。

**Architecture:** 后端 Koa + `ws` 共用 9527 端口，REST 处理登录注册，WebSocket 做实时消息转发和在线状态广播。前端 Dexie 持久化聊天记录到 IndexedDB，全局单例 WebSocket composable。

**Tech Stack:** Koa, ws, jsonwebtoken, bcryptjs, Vue 3 + TS, Dexie, Element Plus

## 全局约束

- 用户数据存 JSON 文件，不引入数据库
- 离线消息丢弃，不做服务端暂存
- 只做纯文本一对一私聊
- 所有新依赖必须是纯 JS（无需原生编译），适配 Windows

---

## 文件结构

```
新增:
  server/controller/auth.js       — REST: register, login, online users
  server/controller/chat.js        — WebSocket: 连接管理 + 消息转发
  server/data/                     — 用户 JSON 存储目录
  admin/src/composables/useWebSocket.ts  — WebSocket 全局单例
  admin/src/composables/useChatDB.ts     — Dexie 读写封装
  admin/src/typings/chat.d.ts           — 聊天相关类型

修改:
  server/index.js                  — 挂载 auth 路由 + WebSocket server
  server/config.js                 — 添加 jwtSecret 字段
  admin/src/pages/login/index.vue  — 从空壳改为登录/注册表单
  admin/src/pages/chat/index.vue   — 移除 mock 数据，接入真实通信
  admin/src/router/index.ts        — 添加路由守卫
  admin/src/router/routes.ts       — /login 路由不加 Layout
  admin/src/utils/request.ts       — 请求拦截器注入 token
```

---

### Task 1: 安装后端新依赖

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: 安装依赖**

```bash
cd server && npm install ws jsonwebtoken bcryptjs
```

- [ ] **Step 2: 验证安装**

```bash
node -e "require('ws'); require('jsonwebtoken'); require('bcryptjs'); console.log('OK')"
```

预期输出: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore: add ws, jsonwebtoken, bcryptjs deps"
```

---

### Task 2: 扩展 server 配置 + 创建用户数据目录

**Files:**
- Modify: `server/config.js`
- Create: `server/data/` (目录)

- [ ] **Step 1: 修改 config.js，添加 jwtSecret**

在 `server/config.js` 的 `exports.global` 对象中添加:

```js
exports.global = {
  port: 9527,
  publicPath: 'D://',
  jwtSecret: 'local-cloudpan-secret-key-2024',  // 新增
};
```

- [ ] **Step 2: 创建 data 目录**

```bash
mkdir -p server/data
echo "[]" > server/data/users.json
```

- [ ] **Step 3: Commit**

```bash
git add server/config.js server/data/
git commit -m "feat: add jwtSecret + user data directory"
```

---

### Task 3: 创建 auth controller（注册/登录/在线用户）

**Files:**
- Create: `server/controller/auth.js`

**Interfaces:**
- Produces: Koa Router 实例，暴露 `/register`、`/login`、`/users` 三个端点
- 中间件: `authMiddleware` 函数（JWT 校验，从 `Authorization: Bearer <token>` 提取 username，存入 `ctx.state.user`）

- [ ] **Step 1: 创建 auth controller**

```js
const fs = require('fs');
const path = require('path');
const Router = require('@koa/router');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');

const router = new Router({ prefix: '/api/auth' });
const DATA_FILE = path.join(__dirname, '../data/users.json');

// 读写用户文件
function readUsers() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return []; }
}
function writeUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// 注册
router.post('/register', async (ctx) => {
  const { username, password } = ctx.request.body;
  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { msg: '用户名和密码不能为空' };
    return;
  }
  const users = readUsers();
  if (users.find(u => u.username === username)) {
    ctx.status = 409;
    ctx.body = { msg: '用户名已存在' };
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  users.push({ username, password: hash });
  writeUsers(users);
  const token = jwt.sign({ username }, config.global.jwtSecret, { expiresIn: '7d' });
  ctx.body = { token, username };
});

// 登录
router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    ctx.status = 401;
    ctx.body = { msg: '用户名或密码错误' };
    return;
  }
  const token = jwt.sign({ username }, config.global.jwtSecret, { expiresIn: '7d' });
  ctx.body = { token, username };
});

// JWT 校验中间件
function authMiddleware(ctx, next) {
  const auth = ctx.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { msg: '未登录' };
    return;
  }
  try {
    const decoded = jwt.verify(auth.slice(7), config.global.jwtSecret);
    ctx.state.user = decoded;
    return next();
  } catch {
    ctx.status = 401;
    ctx.body = { msg: 'TOKEN过期' };
  }
}

// 获取在线用户列表（需要登录，从 chat 模块的在线列表读取）
// 通过 app.context 共享在线用户状态
router.get('/users', authMiddleware, (ctx) => {
  const onlineUsers = ctx.app._onlineUsers || [];
  ctx.body = onlineUsers.filter(u => u !== ctx.state.user.username);
});

module.exports = { router, authMiddleware };
```

- [ ] **Step 2: 验证语法**

```bash
node -c server/controller/auth.js
```

- [ ] **Step 3: Commit**

```bash
git add server/controller/auth.js
git commit -m "feat: add auth controller (register/login/online users)"
```

---

### Task 4: 创建 WebSocket chat controller

**Files:**
- Create: `server/controller/chat.js`

**Interfaces:**
- Consumes: `config.global.jwtSecret`, `authMiddleware` 的 JWT 逻辑
- Produces: `setupWebSocket(server)` 函数，接收 http.Server 实例，挂载 WebSocket
- 副作用: 在 `server` 上设置 `_onlineUsers` 数组供 auth controller 读取

- [ ] **Step 1: 创建 chat controller**

```js
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
```

- [ ] **Step 2: 验证语法**

```bash
node -c server/controller/chat.js
```

- [ ] **Step 3: Commit**

```bash
git add server/controller/chat.js
git commit -m "feat: add WebSocket chat controller"
```

---

### Task 5: 修改 server/index.js 挂载新功能

**Files:**
- Modify: `server/index.js`

**Interfaces:**
- Consumes: `auth.js` 导出的 `{ router, authMiddleware }`，`chat.js` 导出的 `setupWebSocket`
- 将 `app.listen()` 改为显式创建 `http.Server` 以便 `ws` 共用端口

- [ ] **Step 1: 修改 index.js**

将 `server/index.js` 替换为:

```js
const http = require('http');
const Koa = require('koa');
const logger = require('koa-logger');
const cors = require('@koa/cors');
const { bodyParser } = require('@koa/bodyparser');
const static = require('koa-static');
const etag = require('koa-etag');
const compress = require('koa-compress');
const config = require('./config');
const { router: authRouter } = require('./controller/auth');
const setupWebSocket = require('./controller/chat');

const app = new Koa();
app.use(logger());
app.use(cors({ maxAge: 7200 }));
app.use(bodyParser({ jsonLimit: '50mb' }));
app.use(async (ctx, next) => {
  await next();
  if (ctx.fresh) {
    ctx.status = 304;
    ctx.body = null;
  }
});
app.use(etag());
app.use(compress({ threshold: 2048, br: false }));
app.use(static(config.global.publicPath));
app.use(require('./controller/file').routes());
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

// 处理错误
app.on('error', (err, ctx) => {
  const { UploadError } = require('./controller/errorTypes');
  if (err instanceof UploadError) {
    ctx.body = {
      errCode: err.code,
      errMsg: err.message,
    };
    ctx.status = 500;
  }
  if (err.code === 'ECONNRESET' || ctx.url.startsWith('/download')) {
    console.log('  <-- 下载中断');
  } else if (err.code === 'Parse Error' || ctx.url.startsWith('/upload')) {
    console.log('  <-- 上传中断');
  } else {
    console.error('Request error:', err);
  }
});

const server = http.createServer(app.callback());
setupWebSocket(server);
server.listen(config.global.port, () => {
  console.log(`Server start on port ${config.global.port}`);
});
```

- [ ] **Step 2: 验证语法**

```bash
node -c server/index.js
```

- [ ] **Step 3: 启动服务验证无报错**

```bash
cd server && timeout 3 node index.js || true
```

预期: 看到 `WebSocket server ready` + `Server start on port 9527`

- [ ] **Step 4: Commit**

```bash
git add server/index.js
git commit -m "feat: mount auth routes + WebSocket server"
```

---

### Task 6: 安装前端新依赖 + 修改 request 拦截器注入 token

**Files:**
- Modify: `admin/package.json`
- Modify: `admin/src/utils/request.ts`

- [ ] **Step 1: 安装 dexie**

```bash
cd admin && npm install dexie
```

- [ ] **Step 2: 修改 request.ts 注入 token**

在 `admin/src/utils/request.ts` 的请求拦截器中取消注释并改为从 localStorage 读取:

```ts
// 请求拦截器
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

删除注解掉的 `useUserStore` 引用 — ponytail: 不需要 pinia store，localStorage 足够。

- [ ] **Step 3: 验证编译**

```bash
cd admin && npx vue-tsc --noEmit --incremental
```

- [ ] **Step 4: Commit**

```bash
git add admin/package.json admin/package-lock.json admin/src/utils/request.ts
git commit -m "feat: add dexie, inject token in request interceptor"
```

---

### Task 7: 创建前端类型定义 + Dexie 封装

**Files:**
- Create: `admin/src/typings/chat.d.ts`
- Create: `admin/src/composables/useChatDB.ts`

**Interfaces:**
- Consumes: `dexie` 库
- Produces: `useChatDB()` 返回 `{ getMessages(contact): Promise<Message[]>, saveMessage(msg): Promise<void> }`

- [ ] **Step 1: 创建类型定义文件**

```ts
// admin/src/typings/chat.d.ts
interface Contact {
  username: string;
  online: boolean;
}

interface Message {
  id?: number;
  contact: string;
  content: string;
  time: string;
  isSelf: boolean;
}
```

- [ ] **Step 2: 创建 useChatDB.ts**

```ts
// admin/src/composables/useChatDB.ts
import Dexie, { type Table } from 'dexie';

class ChatDB extends Dexie {
  messages!: Table<Message, number>;

  constructor() {
    super('chatDB');
    this.version(1).stores({
      messages: '++id, contact, time',
    });
  }
}

const db = new ChatDB();

export function useChatDB() {
  const getMessages = (contact: string): Promise<Message[]> =>
    db.messages.where('contact').equals(contact).sortBy('id');

  const saveMessage = (msg: Message): Promise<number> =>
    db.messages.add(msg);

  return { getMessages, saveMessage };
}
```

- [ ] **Step 3: 验证编译**

```bash
cd admin && npx vue-tsc --noEmit --incremental
```

- [ ] **Step 4: Commit**

```bash
git add admin/src/typings/chat.d.ts admin/src/composables/useChatDB.ts
git commit -m "feat: add chat types + Dexie composable"
```

---

### Task 8: 创建 WebSocket composable

**Files:**
- Create: `admin/src/composables/useWebSocket.ts`

**Interfaces:**
- Produces: 
  - `useWebSocket()` 返回 `{ sendMessage(to, content), onMessage(handler), isConnected, contacts }`
  - 全局单例：模块级变量，多次调用共享同一连接
  - `contacts` 是 `Ref<Contact[]>`，由 `online`/`offline` 事件驱动更新
  - `onMessage(handler)` 注册消息回调，handler 签名为 `(msg: { from, content, time }) => void`

- [ ] **Step 1: 创建 useWebSocket.ts**

```ts
// admin/src/composables/useWebSocket.ts
import { ref, type Ref } from 'vue';
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

  ws.onclose = () => {
    isConnected.value = false;
    // ponytail: 指数退避重连，最大 5s 间隔
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
```

- [ ] **Step 2: 验证编译**

```bash
cd admin && npx vue-tsc --noEmit --incremental
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/composables/useWebSocket.ts
git commit -m "feat: add WebSocket composable (global singleton)"
```

---

### Task 9: 改写登录页

**Files:**
- Modify: `admin/src/pages/login/index.vue`

**Interfaces:**
- Consumes: `axios` (通过 `@/utils/request`)，`vue-router`
- 注册/登录成功后存 `token` 和 `username` 到 localStorage，跳转 `/home`

- [ ] **Step 1: 重写 login/index.vue**

```vue
<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Local-CloudPan</h1>
      <el-tabs v-model="mode" class="login-tabs">
        <el-tab-pane label="登录" name="login" />
        <el-tab-pane label="注册" name="register" />
      </el-tabs>
      <el-form @submit.prevent="submit">
        <el-form-item>
          <el-input v-model="username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit" :loading="submitting" style="width:100%">
            {{ mode === 'login' ? '登录' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const router = useRouter();
const mode = ref('login');
const username = ref('');
const password = ref('');
const submitting = ref(false);

async function submit() {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }
  submitting.value = true;
  try {
    const path = mode.value === 'login' ? '/auth/login' : '/auth/register';
    const res: any = await request.post(path, {
      username: username.value,
      password: password.value,
    });
    localStorage.setItem('token', res.token);
    localStorage.setItem('username', res.username);
    router.push('/home');
  } catch {
    // 错误已在拦截器中提示
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--ep-bg-color-page);
}
.login-card {
  width: 360px;
  padding: 2rem;
  background: var(--ep-bg-color);
  border-radius: 0.5rem;
  box-shadow: var(--ep-box-shadow-base);
}
.login-card h1 {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--ep-text-color-primary);
}
</style>
```

- [ ] **Step 2: 验证编译**

```bash
cd admin && npx vue-tsc --noEmit --incremental
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/pages/login/index.vue
git commit -m "feat: rewrite login page with login/register form"
```

---

### Task 10: 添加路由守卫 + 修复 login 路由不套 Layout

**Files:**
- Modify: `admin/src/router/index.ts`
- Modify: `admin/src/router/routes.ts`

- [ ] **Step 1: 修改 router/index.ts 添加 beforeEach 守卫**

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
import { constantRoute } from './routes';

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoute,
  scrollBehavior() {
    return {
      left: 0,
      top: 0,
    };
  },
});

// 路由守卫：未登录跳登录页
router.beforeEach((to, _from) => {
  const token = localStorage.getItem('token');
  if (to.path !== '/login' && !token) {
    return '/login';
  }
  if (to.path === '/login' && token) {
    return '/home';
  }
});

export default router;
```

- [ ] **Step 2: 修改 routes.ts — login 路由抽出 Layout 外**

将 `routes.ts` 中 login 路由从 Layout children 中移出，改为顶层路由：

```ts
export const constantRoute: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/index.vue'),
  },
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      // ... 保持不变：home, sharePan, chat
    ],
  },
  // ... 404
];
```

注意：删除原来嵌在 Layout 内的 login 路由定义。

- [ ] **Step 3: 验证编译**

```bash
cd admin && npx vue-tsc --noEmit --incremental
```

- [ ] **Step 4: Commit**

```bash
git add admin/src/router/index.ts admin/src/router/routes.ts
git commit -m "feat: add route guard, move login out of Layout"
```

---

### Task 11: 改写聊天页 — 接入真实数据

**Files:**
- Modify: `admin/src/pages/chat/index.vue`

**Interfaces:**
- Consumes: `useWebSocket()` 的 `{ sendMessage, onMessage, contacts, isConnected }`，`useChatDB()` 的 `{ getMessages, saveMessage }`
- 左侧列表展示 `contacts`（在线用户），右侧消息区从 Dexie 加载历史 + 实时接收

- [ ] **Step 1: 重写 chat/index.vue**

```vue
<template>
  <div class="chat-container">
    <!-- 左侧-联系人列表（在线用户） -->
    <div class="contacts-sidebar">
      <div class="sidebar-header">
        <h2>在线用户</h2>
        <span class="connection-status" :class="{ connected: isConnected }">
          {{ isConnected ? '已连接' : '连接中...' }}
        </span>
      </div>
      <div class="contacts-list" v-if="contacts.length">
        <div
          v-for="contact in contacts"
          :key="contact.username"
          class="contact-item"
          :class="{ active: contact.username === curContact }"
          @click="switchContact(contact.username)"
        >
          <div class="contact-avatar">{{ contact.username[0] }}</div>
          <div class="contact-info">
            <span class="contact-name">{{ contact.username }}</span>
            <div class="contact-status">在线</div>
          </div>
        </div>
      </div>
      <div class="empty-contacts" v-else>
        <p>暂无在线用户</p>
      </div>
    </div>

    <!-- 右侧-消息区域 -->
    <div class="message-area">
      <div class="place-container" v-if="!curContact">
        <p class="place-title">选择一个用户开始聊天</p>
      </div>
      <template v-else>
        <div class="messages-container" ref="msgContainerRef">
          <div
            v-for="msg in currentMessages"
            :key="msg.id"
            class="message"
            :class="{ 'message-self': msg.isSelf }"
          >
            <div class="message-content">
              <p>{{ msg.content }}</p>
              <span class="message-time">{{ msg.time }}</span>
            </div>
          </div>
        </div>

        <div class="message-input">
          <el-input
            class="input-field"
            v-model="newMessage"
            placeholder="输入消息..."
            @keyup.enter="send"
          />
          <el-button type="primary" class="message-button" @click="send">
            <el-icon :size="24"><i-mynaui:send-solid /></el-icon>
          </el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { useWebSocket } from '@/composables/useWebSocket';
import { useChatDB } from '@/composables/useChatDB';

defineOptions({ name: 'chat' });

const { sendMessage, onMessage, isConnected, contacts } = useWebSocket();
const { getMessages, saveMessage } = useChatDB();

const curContact = ref('');
const currentMessages = ref<Message[]>([]);
const newMessage = ref('');
const msgContainerRef = ref<HTMLElement>();

// 切换联系人时加载历史消息
watch(curContact, async (username) => {
  if (username) {
    currentMessages.value = await getMessages(username);
    await nextTick();
    scrollToBottom();
  }
});

function scrollToBottom() {
  const el = msgContainerRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function switchContact(username: string) {
  curContact.value = username;
}

async function send() {
  const content = newMessage.value.trim();
  if (!content || !curContact.value) return;

  const msg: Message = {
    contact: curContact.value,
    content,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    isSelf: true,
  };
  await saveMessage(msg);
  currentMessages.value.push(msg);
  sendMessage(curContact.value, content);
  newMessage.value = '';
  await nextTick();
  scrollToBottom();
}

// 接收实时消息
onMessage(({ from, content, time }) => {
  if (from === curContact.value) {
    currentMessages.value.push({ contact: from, content, time, isSelf: false });
    scrollToBottom();
  }
  // 即使不是当前联系人也要存到 DB（已在 useWebSocket 中处理），此处只需更新 UI
  // ponytail: 如果消息来自当前联系人则展示，否则只落 DB 不展示（下次切换时加载）
  if (from !== curContact.value) {
    // 提示有新消息 - 可在后续版本添加通知
  }
});
</script>

<style scoped lang="scss">
.chat-container {
  display: flex;
  padding: 0;
  height: calc(100vh - 4rem);
  text-align: left;
  overflow: hidden;

  .contacts-sidebar {
    width: 16rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--ep-border-color-lighter);

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      h2 { font-size: 1.25rem; font-weight: 600; color: var(--ep-text-color-primary); margin: 0; }
      .connection-status {
        font-size: 0.75rem;
        color: #e6a23c;
        &.connected { color: #67c23a; }
      }
    }
    .contacts-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .contact-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        &:hover { background-color: var(--ep-file-hover); }
        &.active { background-color: var(--ep-file-hover); }

        .contact-avatar {
          width: 2.5rem; height: 2.5rem;
          background-color: #e6e8eb;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-right: 12px; color: #606266;
        }
        .contact-info {
          flex: 1 1 0%; min-width: 0;
          .contact-name { font-weight: 500; color: var(--ep-text-color-primary); display: block; }
          .contact-status { font-size: 0.75rem; color: #67c23a; }
        }
      }
    }
    .empty-contacts {
      flex: 1;
      display: flex; justify-content: center; align-items: center;
      color: var(--ep-text-color-secondary);
    }
  }
}

.message-area {
  flex: 1; display: flex; flex-direction: column;

  .place-container {
    flex: 1; display: flex; justify-content: center; align-items: center;
    .place-title { color: #909399; }
  }

  .messages-container {
    flex: 1; padding: 1.25rem; overflow-y: auto;

    .message {
      margin-bottom: 1.25rem; display: flex;
      .message-content {
        max-width: 70%; padding: 0.75rem 1rem;
        background-color: var(--ep-fill-color-light);
        border-radius: 0.5rem; position: relative;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        p { margin: 0; color: var(--ep-text-color-primary); line-height: 1.5; }
        .message-time {
          font-size: 0.75rem; color: var(--ep-text-color-secondary);
          margin-top: 4px; display: block;
        }
      }
    }
    .message-self {
      flex-direction: row-reverse;
      .message-content {
        background-color: var(--ep-color-primary);
        p { color: #fff; }
      }
    }
  }

  .message-input {
    display: flex; align-items: center; padding: 1.5rem;
    border-top: 1px solid var(--ep-border-color-lighter);
    .input-field {
      border-radius: 0.375rem; border-width: 1px;
      width: 100%; height: 2.5rem; font-size: 1rem;
      color: var(--ep-text-color-placeholder);
      background-color: var(--ep-fill-color-light);
      margin-right: 0.75rem;
    }
    .message-button { width: 3rem; height: 2.5rem; }
  }
}

:deep(.el-textarea__inner) { resize: none; }
</style>
```

- [ ] **Step 2: 验证编译**

```bash
cd admin && npx vue-tsc --noEmit --incremental
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/pages/chat/index.vue
git commit -m "feat: rewrite chat page with real WebSocket + Dexie"
```

---

### Task 12: 端到端验证

- [ ] **Step 1: 启动后端**

```bash
cd server && node index.js
```

预期: `WebSocket server ready` + `Server start on port 9527`

- [ ] **Step 2: 启动前端**

```bash
cd admin && npm run dev
```

预期: Vite 开发服务器启动在端口 8888

- [ ] **Step 3: 测试注册和登录**

打开两个浏览器窗口 `http://localhost:8888`：
1. 页面应自动跳转到 `/login`
2. 注册用户 A → 自动跳转到首页
3. 另一个窗口注册用户 B
4. 两个用户都应出现在 `/chat` 的在线列表中

- [ ] **Step 4: 测试聊天**

1. 用户 A 在聊天页选择用户 B
2. 发送消息 → 用户 B 应实时收到
3. 刷新页面 → 消息历史仍在（IndexedDB 持久化）

- [ ] **Step 5: Commit（如有修改）**

```bash
git add -A
git commit -m "chore: final fixes from e2e testing"
```
