const fs = require('fs-extra');
const path = require('path');
const Router = require('@koa/router');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const chat = require('./chat');

const router = new Router({ prefix: '/auth' });
const DATA_FILE = path.join(__dirname, '../data/users.json');

let registerLock = Promise.resolve();

// 读写用户文件
async function readUsers() {
  try { return JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')); }
  catch { return []; }
}
async function writeUsers(users) {
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// 注册
router.post('/register', async (ctx) => {
  const username = (ctx.request.body.username || '').trim();
  const password = ctx.request.body.password || '';
  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { msg: '用户名和密码不能为空' };
    return;
  }
  if (username.length < 2 || username.length > 30) {
    ctx.status = 400;
    ctx.body = { msg: '用户名需要2-30个字符' };
    return;
  }
  if (password.length < 4) {
    ctx.status = 400;
    ctx.body = { msg: '密码至少需要4个字符' };
    return;
  }
  // Serialize registrations to prevent race conditions
  const prev = registerLock;
  let resolve;
  registerLock = new Promise(r => { resolve = r; });
  await prev;
  try {
    const users = await readUsers();
    if (users.find(u => u.username === username)) {
      ctx.status = 409;
      ctx.body = { msg: '用户名已存在' };
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    users.push({ username, password: hash });
    await writeUsers(users);
    const token = jwt.sign({ username }, config.global.jwtSecret, { expiresIn: '7d' });
    ctx.body = { token, username };
  } finally {
    resolve();
  }
});

// 登录
router.post('/login', async (ctx) => {
  const username = (ctx.request.body.username || '').trim();
  const password = ctx.request.body.password || '';
  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { msg: '用户名和密码不能为空' };
    return;
  }
  if (username.length < 2 || username.length > 30) {
    ctx.status = 400;
    ctx.body = { msg: '用户名需要2-30个字符' };
    return;
  }
  if (password.length < 4) {
    ctx.status = 400;
    ctx.body = { msg: '密码至少需要4个字符' };
    return;
  }
  const users = await readUsers();
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

// 获取在线用户列表（需要登录，从 chat 模块导入 getter）
router.get('/users', authMiddleware, (ctx) => {
  const onlineUsers = chat.onlineUsers ? chat.onlineUsers() : [];
  ctx.body = onlineUsers.filter(u => u !== ctx.state.user.username);
});

module.exports = { router, authMiddleware };
