# 音乐卡片制作工具

一款基于 Tauri v2 + React 的可配置 NFC 音乐卡片设计工具。

搜索封面 · 调整样式 · 导出打印

## 功能

- 🎨 实时预览 — 左侧调参数，右侧即时看到卡片效果
- 🔍 封面搜索 — 内置 iTunes API，按歌曲/专辑/歌手搜索
- 🖼️ 本地封面 — 支持从本地选择封面图片
- 💾 配置导入/导出 — 配置存为 .json 文件，随时分享恢复
- 📸 导出 PNG — Canvas 渲染高清图片
- 🌐 多国区搜索 — 支持多国 iTunes 曲库
- 🌙 深色模式 — 支持切换

## 开发

```bash
npm install
npm run tauri dev
```

## 构建

```bash
npm run tauri build
```

产物在 `src-tauri/target/release/bundle/nsis/`
