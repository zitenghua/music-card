<p align="center">
  <img src="./icon.svg" width="80" height="80" alt="logo">
</p>

<h1 align="center">音乐卡片制作工具</h1>
<p align="center">一款可配置的 NFC 音乐卡片设计工具 — 搜索封面 · 调整样式 · 导出打印</p>

<p align="center">
  <a href="#-功能">功能</a> ·
  <a href="#-安装">安装</a> ·
  <a href="#-使用">使用</a> ·
  <a href="#-开发">开发</a>
</p>

<p align="center">
  <a href="https://github.com/zitenghua/music-card/releases">
    <img src="https://img.shields.io/badge/下载-v1.0.0-2d7d46?style=for-the-badge&logo=github" alt="Download">
  </a>
</p>

---

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 🎨 实时预览 | 左侧调参数，右侧即时看到卡片效果 |
| 🔍 封面搜索 | 内置 iTunes API，按歌曲/专辑/歌手搜索，200 结果一次拉取 |
| 🖼️ 本地封面 | 支持从本地选取封面图片 |
| 💾 配置导入/导出 | 配置存为 `.json` 文件，随时分享恢复 |
| 📸 导出 PNG | Canvas 渲染高清图片，可直接用于印刷 |
| 🌐 多国区搜索 | 支持中国/日本/美国等多国 iTunes 曲库 |
| 🌙 深色模式 | 一键切换深色/浅色主题 |
| 📐 尺寸预设 | 适配 NFC 卡片尺寸，直接导出打印 |

## 🖼️ 预览

```
┌───────── 配置面板 ─────────┬──── 预览 ────┬── 封面搜索 ─────┐
│                            │             │                 │
│  🎨 颜色 / 📏 尺寸 / 📝 内容 │   卡片预览    │  [歌曲] [专辑] [歌手] │
│                            │   ┌──────┐  │  [搜索框...]  🔍  │
│  ┌──────────────────┐      │   │      │  │ ┌─┐ ┌─┐ ┌─┐    │
│  │ 导入配置 │ 导出配置 │      │   │ 卡   │  │ │ │ │ │ │ │    │
│  │  重置   │ 导出PNG │      │   │ 片   │  │ └─┘ └─┘ └─┘    │
│  └──────────────────┘      │   │      │  │ (滚动加载)       │
│                            │   └──────┘  │                 │
└────────────────────────────┴─────────────┴─────────────────┘
```

## 📦 安装

### 普通用户

从 [Releases](https://github.com/zitenghua/music-card/releases) 下载 `音乐卡片制作工具_1.0.0_x64-setup.exe`，双击安装即可使用。

**系统要求：** Windows 10/11（自带 WebView2 运行环境）

### 开发者

```bash
git clone https://github.com/zitenghua/music-card.git
cd music-card
npm install
npm run tauri dev
```

## 🚀 使用

1. **搜索封面** — 在右侧搜索框输入歌曲名，选择后自动应用
2. **调整样式** — 左侧面板调节颜色、尺寸、进度条等参数
3. **导出配置** — 点击「导出配置」保存当前参数为 `.json` 文件
4. **导入配置** — 点击「导入配置」一键恢复
5. **导出 PNG** — 点击「导出 PNG」下载高清图片

### 使用场景

```
设计卡片 → 导出 PNG → 发送给 NFC 卡片店铺 → 打印制作 → 完成！
```

## 🛠️ 构建

生成 Windows 安装包：

```bash
npm run tauri build
```

构建产物在 `src-tauri/target/release/bundle/nsis/` 目录。

## 🧱 技术栈

| 技术 | 用途 |
|------|------|
| Tauri v2 | 桌面应用框架 |
| React 19 | 前端 UI |
| Vite 6 | 构建工具 |
| Rust | 原生对话框与文件操作 |
| iTunes Search API | 封面搜索 |

## 📁 项目结构

```
music-card/
├── src/                          ← 前端源码
│   ├── main.jsx                  ← React 入口
│   ├── App.jsx                   ← 根组件
│   ├── configData.js             ← 配置参数定义
│   ├── api.js                    ← Tauri invoke 封装
│   ├── components/               ← React 组件
│   ├── utils/                    ← 工具函数
│   └── styles.css                ← 样式
├── src-tauri/                    ← Tauri / Rust 后端
│   ├── src/lib.rs                ← Rust 命令
│   ├── icons/                    ← 应用图标
│   └── tauri.conf.json           ← Tauri 配置
├── icon.svg                      ← 应用图标
├── vite.config.js                ← Vite 配置
└── package.json
```

## 📄 许可证

MIT
