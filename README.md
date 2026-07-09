<div align="center">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="80" height="80">
    <rect width="512" height="512" rx="80" fill="#f5a0b8"/>
    <ellipse cx="256" cy="120" rx="38" ry="68" fill="#ff6b93" transform="rotate(0 256 256)"/>
    <ellipse cx="256" cy="120" rx="38" ry="68" fill="#ff8aa5" transform="rotate(60 256 256)"/>
    <ellipse cx="256" cy="120" rx="38" ry="68" fill="#ff6b93" transform="rotate(120 256 256)"/>
    <ellipse cx="256" cy="120" rx="38" ry="68" fill="#ff8aa5" transform="rotate(180 256 256)"/>
    <ellipse cx="256" cy="120" rx="38" ry="68" fill="#ff6b93" transform="rotate(240 256 256)"/>
    <ellipse cx="256" cy="120" rx="38" ry="68" fill="#ff8aa5" transform="rotate(300 256 256)"/>
    <circle cx="256" cy="256" r="36" fill="#ffe066"/>
    <circle cx="256" cy="256" r="24" fill="#ffcc33"/>
  </svg>
  <h1 align="center">音乐卡片制作工具</h1>
  <p align="center">
    一款可配置的 NFC 音乐卡片设计工具<br>
    搜索封面 · 调整样式 · 导出打印
  </p>
  <p>
    <a href="#features">功能</a> ·
    <a href="#install">安装</a> ·
    <a href="#usage">使用</a> ·
    <a href="#development">开发</a>
  </p>
  <p>
    <a href="https://github.com/zitenghua/music-card/releases">
      <img src="https://img.shields.io/badge/下载-v1.1.0-2d7d46?style=for-the-badge&logo=github" alt="Download">
    </a>
  </p>
</div>

---

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 🎨 实时预览 | 左侧调参数，右侧即时看到卡片效果 |
| 🔍 封面搜索 | 内置 iTunes API，按歌曲/专辑/歌手搜索，200 结果一次拉取 |
| 🖼️ 本地封面 | 支持本地上传或拖拽封面图片，封面自动复制到安装目录 |
| 📐 红线约束 | 歌名和歌手自动缩放到收藏按钮左侧，不遮挡操作区 |
| 💾 配置导入/导出 | 配置存为 `.json` 文件，随时分享恢复 |
| 📸 导出 PNG | Canvas 渲染高清图片，以「歌名-歌手.png」保存到 `output/` 文件夹 |
| 🌐 多国区搜索 | 支持中国/日本/美国等多国 iTunes 曲库 |
| 🌙 深色模式 | 一键切换深色界面，护眼更舒适 |
| 🎯 PX 智能输入 | 尺寸字段只填数字，自动补全 px 单位 |
| 📌 底部固定按钮 | 导入/导出/重置/导出 PNG 始终固定在左下角 |

## 📦 安装

### 普通用户

从 [Releases](https://github.com/zitenghua/music-card/releases) 下载 `音乐卡片制作工具 Setup 1.1.0.exe`，双击安装即可使用。

### 开发者

```bash
git clone https://github.com/zitenghua/music-card.git
cd nfc-music-card
npm install
npm start
```

## 🚀 使用

1. **搜索封面** — 在右侧搜索框输入歌曲名，选择封面后自动填充歌名、歌手、时长
2. **调整样式** — 左侧面板调节颜色、尺寸、进度条等参数
3. **导出配置** — 点击「导出配置」保存当前参数为 `.json` 文件
4. **导入配置** — 别人分享的配置，点击「导入配置」一键恢复
5. **导出 PNG** — 点击「导出 PNG」，默认以「歌名-歌手.png」保存到 `output/` 文件夹（位于安装目录下）

### 使用场景

```
设计卡片 → 导出 PNG → 发送给 NFC 卡片店铺 → 打印制作 → 完成！
```

## 🛠️ 打包

生成 Windows 安装包：

```bash
npm run dist:win
```

生成后在 `release/` 目录获取 `Setup.exe`。

## 🧱 技术栈

| 技术 | 用途 |
|------|------|
| Electron | 桌面应用框架 |
| HTML + CSS | 界面与样式（CSS 变量驱动） |
| JavaScript | 交互逻辑（Canvas 渲染导出） |
| iTunes Search API | 封面搜索 |

## 📁 项目结构

```
music-card/
├── yue2.html          ← 页面结构
├── yue2.css           ← 卡片样式
├── yue2.js            ← 交互逻辑
├── electron/
│   ├── main.js        ← Electron 入口（单实例锁、IPC）
│   └── preload.js     ← 桥接 API
├── covers/            ← 默认封面图片（花鳥風月）
├── package.json
└── icon.svg           ← 应用图标（内嵌于 README）

# 安装后会创建的目录（位于 exe 同目录下）
├── covers/            ← 用户封面（可自行添加图片）
├── output/            ← 导出的 PNG 图片
└── configs/           ← 导出的配置文件
```

## 📄 许可证

MIT
