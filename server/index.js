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
