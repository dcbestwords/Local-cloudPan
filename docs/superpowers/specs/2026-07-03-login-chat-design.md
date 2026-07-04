# 登录 + 局域网聊天 设计文档

## 概述

在现有 Local-cloundPan 项目基础上，添加用户登录/注册功能和基于 WebSocket 的局域网一对一私聊功能。

## 技术决策

- **实时通信**：`ws` 库（轻量 WebSocket），运行在现有 Koa HTTP 服务器上
- **消息持久化**：前端 IndexedDB（Dexie.js），服务端不存消息
- **离线消息**：丢弃，不做服务端暂存
- **在线用户发现**：服务端维护在线列表，REST 接口拉取
- **登录态**：JWT token

---

## 后端设计

### 新增依赖

- `ws` — WebSocket 服务
- `jsonwebtoken` — JWT 签发与验证

### 新增文件

```
server/
  controller/
    chat.js        — WebSocket 连接管理 + 消息转发
    auth.js        — 注册/登录 REST 接口
  middleware/
    ws-auth.js     — WebSocket 连接时的 token 校验
```

### 修改文件

- `server/index.js` — 挂载 WebSocket 服务 + auth 路由

### JWT 设计

- 密钥：config.js 中的 `jwtSecret`
- 载荷：`{ username }`
- 过期：7 天

### REST 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 { username, password }，密码 bcrypt 哈希，存 JSON 文件 |
| POST | `/api/auth/login` | 登录，返回 { token } |
| GET | `/api/auth/users` | 获取在线用户列表（需 Authorization header） |

### 用户存储

使用 `server/data/users.json` 文件存储，不引入数据库。格式：

```json
[
  { "username": "zhangsan", "password": "$2b$..." }
]
```

### WebSocket 消息协议

所有消息为 JSON，含 `type` 字段：

```js
// 客户端 → 服务端
{ type: 'message', to: 'username', content: '你好' }

// 服务端 → 客户端（收消息）
{ type: 'message', from: 'username', content: '你好', time: '14:30' }

// 服务端 → 所有客户端（广播）
{ type: 'online', username: 'zhangsan' }
{ type: 'offline', username: 'zhangsan' }
```

### 服务端消息流转

1. 客户端连接 WebSocket，URL 带 token 参数 `ws://host?token=xxx`
2. 服务端 `ws-auth` 校验 token，提取 username
3. 连接存入 `Map<username, WebSocket>`
4. 广播 `{ type: 'online', username }` 给所有在线客户端
5. 收到 `message` 类型 → 查找接收方 WebSocket → 转发 → 接收方不在线则丢弃
6. 断开连接 → 从 Map 移除 → 广播 `{ type: 'offline', username }`

---

## 前端设计

### 新增依赖

- `dexie` — IndexedDB 封装

### 新增文件

```
admin/src/
  composables/
    useWebSocket.ts   — WebSocket 连接/重连/收发，全局单例
    useChatDB.ts      — Dexie 数据库读写封装
```

### 修改文件

| 文件 | 变更 |
|------|------|
| `pages/login/index.vue` | 从空壳改为登录/注册表单 |
| `pages/chat/index.vue` | 移除 mock 数据，接入 WebSocket + Dexie |
| `router/index.ts` | 添加路由守卫（无 token → 跳登录） |
| `router/routes.ts` | `/login` 路由无需 Layout |

### 登录页设计

- 登录/注册两个 tab 切换
- 表单：username + password
- 登录成功 → 存 token 到 localStorage → 跳到 `/home`
- 注册成功 → 自动登录 → 跳到 `/home`

### 路由守卫

`router.beforeEach`：
- 无 token 且目标不是 `/login` → 跳 `/login`
- 有 token 且目标是 `/login` → 跳 `/home`

### 聊天页改造

**左侧在线用户列表**：
- 页面 `onMounted` 时调 `GET /api/auth/users` 获取在线用户
- WebSocket `online` 事件 → 添加用户到列表
- WebSocket `offline` 事件 → 移除用户（当前聊天中则保留显示）
- 不显示自己

**消息区域**：
- 当前选中联系人的消息从 Dexie 读取
- 新消息到达时追加到列表并写入 Dexie

**Dexie 数据库设计**：

```ts
// 数据库名: 'chatDB', 表: 'messages'
// 索引: [contact+time]
{
  id: autoIncrement,
  contact: string,    // 对方的 username（用于索引查询）
  content: string,
  time: string,       // 'HH:MM'
  isSelf: boolean,
}
```

**附件按钮**：移除，当前只做纯文本聊天。

### useWebSocket composable

```ts
// 全局单例，导入即用
// 暴露：
onMessage: (handler: (msg) => void) => void
sendMessage: (to: string, content: string) => void
isConnected: Ref<boolean>
```

- 连接时从 localStorage 读取 token，带到 URL 参数
- 断线自动重连（指数退避，最大 5 秒间隔）

### useChatDB composable

```ts
// 暴露：
getMessages: (contact: string) => Promise<Message[]>
saveMessage: (msg: Message) => Promise<void>
```

---

## 类型定义

```ts
// admin/src/typings/chat.d.ts
interface Contact {
  username: string;    // 唯一标识
  online: boolean;
}

interface Message {
  id?: number;
  contact: string;     // 对方的 username
  content: string;
  time: string;
  isSelf: boolean;
}
```

---

## 边界与取舍

- **不做**：文件发送、消息已读、表情、图片、群聊
- **不做**：服务端消息持久化（不需要数据库）
- **简化**：用户名不可修改，无密码重置
- **简化**：用户数据存 JSON 文件（足够 LAN 场景使用）
