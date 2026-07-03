const path = require('path');

exports.global = {
  port: 9527,
  publicPath: 'D://', // 代理的磁盘或者文件夹
  jwtSecret: 'local-cloudpan-secret-key-2024',
};

exports.single = {
  sizeLimit: 1 * 1024 * 1024,
  exts: ['.jpg', '.jpeg', '.bmp', '.webp', '.gif', '.png'],
  fieldName: 'file',
};
exports.base64 = {
  sizeLimit: 1 * 1024 * 1024,
  exts: ['.jpg', '.jpeg', '.bmp', '.webp', '.gif', '.png'],
};
exports.binary = {
  sizeLimit: 1 * 1024 * 1024,
  exts: ['.jpg', '.jpeg', '.bmp', '.webp', '.gif', '.png'],
};
exports.multi = {
  fieldName: 'photos',
  sizeLimit: 1 * 1024 * 1024,
  countLimit: 10,
  exts: ['.jpg', '.jpeg', '.bmp', '.webp', '.gif', '.png'],
};
