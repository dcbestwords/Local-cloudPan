const fs = require('fs-extra');
const path = require('path');

exports.generateUrl = function (req, filename, basePath = '/upload') {
  return `${req.origin}${basePath}/${filename}`;
};

/** 目录优先 */
function sortByName(a, b) {
  return b.isDir - a.isDir || (a.name > b.name ? 1 : -1);
}

/** 大文件在前 */
function sortBySize(a, b) {
  return b.size - a.size;
}

/** 最近更新在前 */
function sortByModified(a, b) {
  return b.modified - a.modified;
}

async function getNewFileName(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);

  let newFilePath = filePath;

  // 匹配文件名中的括号数字
  const regex = /(.*?)(\((\d+)\))?$/;
  const match = base.match(regex);

  if (match) {
    let baseName = match[1].trim();
    let number = match[3] ? parseInt(match[3]) : 0;

    while (await fs.pathExists(newFilePath)) {
      number++;
      newFilePath = path.join(dir, `${baseName} (${number})${ext}`);
    }
  }
  return newFilePath;
}

module.exports = {
  sortByName,
  sortBySize,
  sortByModified,
  getNewFileName,
};
