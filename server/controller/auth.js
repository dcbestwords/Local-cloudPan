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
