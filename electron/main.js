const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

ipcMain.handle('select-cover-file', async () => {
  const coversDir = path.join(__dirname, '..', 'covers');
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

// 配置文件夹路径
const configsDir = path.join(__dirname, '..', 'configs');

ipcMain.handle('export-config-file', async (event, { fileName, content }) => {
  // 确保 configs 目录存在
  try { fs.mkdirSync(configsDir, { recursive: true }); } catch {}

  const result = await dialog.showSaveDialog({
    defaultPath: path.join(configsDir, fileName),
    filters: [{ name: 'JSON 配置', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return false;

  fs.writeFileSync(result.filePath, content, 'utf-8');
  return true;
});

// 输出文件夹路径
const productsDir = path.join(__dirname, '..', 'output');

ipcMain.handle('export-png-file', async (event, { dataUrl, fileName }) => {
  // 确保输出目录存在
  try { fs.mkdirSync(productsDir, { recursive: true }); } catch {}

  const result = await dialog.showSaveDialog({
    defaultPath: path.join(productsDir, fileName || 'music-card.png'),
    filters: [{ name: 'PNG 图片', extensions: ['png'] }],
  });
  if (result.canceled || !result.filePath) return false;

  // dataUrl -> Buffer
  const matches = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!matches) return false;
  const buffer = Buffer.from(matches[1], 'base64');
  fs.writeFileSync(result.filePath, buffer);
  return true;
});

ipcMain.handle('import-config-file', async () => {
  // 确保 configs 目录存在
  try { fs.mkdirSync(configsDir, { recursive: true }); } catch {}

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
