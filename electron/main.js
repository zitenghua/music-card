const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 应用根目录（安装版=exe所在目录，开发版=项目根目录）
function appRoot() {
  return app.isPackaged
    ? path.dirname(app.getPath('exe'))
    : path.join(__dirname, '..');
}

// 用户数据目录（output, configs 等放到安装目录下）
function userDir(sub) {
  const dir = path.join(appRoot(), sub);
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  return dir;
}
const outputDir = userDir('output');
const configsDir = userDir('configs');

// 确保 covers 目录在安装目录下存在
function ensureCovers() {
  const coversDir = path.join(appRoot(), 'covers');
  if (fs.existsSync(coversDir)) return coversDir;

  // 打包版：从 extraResources 复制默认封面到安装目录
  if (app.isPackaged) {
    const srcDir = path.join(process.resourcesPath, 'covers');
    if (fs.existsSync(srcDir)) {
      try { fs.cpSync(srcDir, coversDir, { recursive: true }); } catch (e) {
        console.warn('复制封面失败:', e.message);
      }
    }
  }
  // 开发版：项目根目录下已有 covers/
  return coversDir;
}

ipcMain.handle('select-cover-file', async () => {
  const coversDir = ensureCovers();
  const result = await dialog.showOpenDialog({
    defaultPath: coversDir,
    properties: ['openFile'],
    filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
  const dataUrl = `data:${mimeMap[ext] || 'image/png'};base64,${data.toString('base64')}`;
  return { dataUrl, fileName: path.basename(filePath) };
});

ipcMain.handle('export-config-file', async (event, { fileName, content }) => {
  const result = await dialog.showSaveDialog({
    defaultPath: path.join(configsDir, fileName),
    filters: [{ name: 'JSON 配置', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return false;

  fs.writeFileSync(result.filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('export-png-file', async (event, { dataUrl, fileName }) => {
  const result = await dialog.showSaveDialog({
    defaultPath: path.join(outputDir, fileName || 'music-card.png'),
    filters: [{ name: 'PNG 图片', extensions: ['png'] }],
  });
  if (result.canceled || !result.filePath) return false;

  const matches = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!matches) return false;
  const buffer = Buffer.from(matches[1], 'base64');
  fs.writeFileSync(result.filePath, buffer);
  return true;
});

ipcMain.handle('import-config-file', async () => {
  const result = await dialog.showOpenDialog({
    defaultPath: configsDir,
    properties: ['openFile'],
    filters: [{ name: 'JSON 配置', extensions: ['json'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return content;
});

ipcMain.handle('get-user-dirs', async () => {
  return {
    output: outputDir,
    configs: configsDir,
    covers: ensureCovers(),
    root: appRoot(),
  };
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    title: '音乐卡片制作工具',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // 加载 yue2.html（相对于 electron/ 的上一层目录）
  win.loadFile(path.join(__dirname, '..', 'yue2.html'));
}

// ★ 单实例锁：只允许一个窗口
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 如果有人试图再开一个，焦点回到已有窗口
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      if (wins[0].isMinimized()) wins[0].restore();
      wins[0].focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    app.quit();
  });
}
