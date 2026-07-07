# 音乐卡片制作工具 — Tauri v2 移植设计文档

## 1. 概述

将 yue-master（Electron 应用）完整移植到 Tauri v2 平台，保持**全部业务逻辑不变**，仅将 Electron 特定的 IPC 调用替换为 Tauri invoke API，并将原先的 3 个巨型源文件（yue2.html / yue2.css / yue2.js）拆分为细粒度的 ES Module 组件。

### 关键约束

- **原逻辑不改变** — 所有配置参数、计算逻辑、Canvas 渲染、iTunes 搜索、历史记录等行为保持 100%一致
- **零外部运行时依赖** — 移除 Electron 运行时，改用 Tauri 原生窗口 + WebView2
- **拆分不动逻辑** — 拆分后每个组件仅提纯原 `yue2.js` 的函数集群，不修改任何函数体

---

## 2. 架构总览

### 2.1 项目结构

```
7.7/
├── src/                          ← 前端源码（Tauri frontendDist）
│   ├── index.html                ← 页面结构（原 yue2.html 内容）
│   ├── styles.css                ← 全局样式（原 yue2.css 内容）
│   ├── main.js                   ← [入口] 初始化所有组件
│   ├── covers/                   ← 封面图片目录
│   │   └── 花鳥風月-1400.jpg     ← 默认封面
│   │
│   ├── config/                   ← 配置系统
│   │   ├── defaults.js           ← DEFAULT_CONFIG / FIELD_META / FIELD_SECTIONS / HIDDEN_FIELDS
│   │   └── panel.js              ← buildConfigPanel / sync / readConfig / autoCalcTime
│   │
│   ├── card/                     ← 卡片渲染与导出
│   │   ├── renderer.js           ← applyConfig（CSS变量写入DOM）
│   │   ├── export.js             ← exportImage / drawFaIcon / roundPath / imgToDataUrl
│   │   ├── text-fitter.js        ← clampTextWidth / fitTitle（红线自适应）
│   │   └── controls.js           ← 播放/收藏/评论按钮交互
│   │
│   ├── history/                  ← 历史记录
│   │   └── manager.js            ← localStorage CRUD / renderHistory
│   │
│   ├── cover/                    ← 封面搜索与上传
│   │   ├── search.js             ← doCoverSearch / 搜索事件绑定
│   │   └── drop-zone.js          ← 图片拖拽/点击上传组件
│   │
│   └── utils/                    ← 工具函数
│       ├── color.js              ← hexToRgba
│       ├── icons.js              ← FA_ICONS 映射表
│       └── tauri-api.js          ← Tauri invoke 封装（electronAPI 替代品）
│
├── src-tauri/                    ← Tauri Rust 后端
│   ├── src/
│   │   ├── lib.rs                ← 4 个 Tauri command
│   │   └── main.rs               ← 入口
│   ├── Cargo.toml                ← Rust 依赖
│   ├── tauri.conf.json           ← Tauri 配置
│   └── capabilities/default.json ← 权限声明
│
├── icon.svg                      ← 应用图标
├── package.json                  ← npm 配置（type: module）
└── docs/superpowers/specs/       ← 设计文档
```

### 2.2 数据流

```
用户操作配置面板
        │
        ▼
  panel.js: sync()
        │
        ├──▶ readConfig()     ← 从 DOM 读取所有 input 值
        ├──▶ autoCalcTime()   ← 根据总时长+百分比计算当前时间
        │
        ▼
  renderer.js: applyConfig(config)
        │
        ├──▶ CSS 变量写入 `--card-bg`, `--text-color` 等
        ├──▶ albumImage src、songTitle/textContent 等 DOM 更新
        ├──▶ text-fitter.js: fitTitle()  ← 红线自适应
        │
        ▼
  卡片外观实时更新（预览面板）
```

---

## 3. 组件详细设计

### 3.1 `config/defaults.js` — 配置定义

**职责：** 集中存放所有配置元数据，纯数据模块，无副作用。

```js
// 导出
export const DEFAULT_CONFIG = { ... }       // 所有参数默认值
export const FIELD_META = { ... }           // 字段标签+控件类型
export const HIDDEN_FIELDS = new Set([...]) // 隐藏字段名集合
export const FIELD_SECTIONS = [...]         // 分组配置
```

**原文件范围：** `yue2.js` 第 1-97 行

**不变部分：** 所有数据值 100% 保持原样

---

### 3.2 `config/panel.js` — 配置面板构建

**职责：** 根据配置元数据动态构建 DOM 面板，读取/同步配置状态。

```js
import { FIELD_META, FIELD_SECTIONS, HIDDEN_FIELDS } from './defaults.js'

export function buildConfigPanel(config)   // 构建配置面板 DOM
export function sync()                     // 同步：readConfig → autoCalcTime → applyConfig
export function readConfig()               // 从 DOM 读取当前配置
export function autoCalcTime(config)       // 自动计算 currentTime
```

**关键方法 `buildConfigPanel(config)` 内部逻辑：**

```
遍历 FIELD_SECTIONS
  └─ 跳过所有 keys 都在 HIDDEN_FIELDS 中的 section
  └─ 创建 section-label div
  └─ 遍历 section.keys
     └─ 根据 FIELD_META[key].type 创建对应控件：
        ├── type=color    → <input type="color">
        ├── type=checkbox → <input type="checkbox">
        ├── type=range    → <input type="range"> + <span>显示值
        ├── type=image    → 调用 cover/drop-zone.js 组件
        └── type=text     → <input type="text">
     └─ input.id = `c-${key}`
     └─ 绑定事件 → sync()
```

**原文件范围：** `yue2.js` 第 315-498 行

**不变部分：** DOM 结构、字段名、事件绑定方式

---

### 3.3 `card/renderer.js` — 卡片 CSS 渲染

**职责：** 将配置对象应用到 DOM 元素的 CSS 变量和文本内容。

```js
export function applyConfig(config)   // 写入 CSS 变量 + DOM 更新
```

**CSS 变量映射表（28 个变量）：**

| 分类 | CSS 变量 | 配置字段 |
|------|----------|---------|
| 卡片 | `--card-width`, `--card-aspect-ratio`, `--card-bg`, `--card-radius` | cardWidth, cardAspectRatio, cardBg, cardRadius |
| 封面 | `--album-height`, `--album-padding`, `--album-img-radius` | albumHeight, albumPadding, albumImgRadius |
| 文字 | `--text-color`, `--text-shadow`, `--title-size`, `--artist-size`, `--artist-opacity` | textColor, textShadow, titleSize, artistSize, artistOpacity |
| 进度条 | `--progress-text-color`, `--time-size`, `--progress-height`, `--progress-track-color`, `--progress-fill-color`, `--progress-fill-width` | progressTextColor, timeSize, progressHeight, progressTrackColor, progressFillColor, progressPercent |
| 控制按钮 | `--controls-bottom`, `--controls-gap`, `--side-btn-size`, `--side-btn-icon-size`, `--side-btn-opacity`, `--play-btn-size`, `--play-btn-icon-size`, `--play-btn-bg`, `--play-btn-color`, `--play-btn-shadow` | controlsBottom, controlsGap, sideBtnSize, sideBtnIconSize, sideBtnOpacity, playBtnSize, playBtnIconSize, playBtnBg, playBtnColor, playBtnShadow |
| 操作按钮 | `--action-top`, `--action-right`, `--action-gap`, `--action-btn-size`, `--action-btn-icon-size`, `--action-btn-bg`, `--action-active-color` | actionTop, actionRight, actionGap, actionBtnSize, actionBtnIconSize, actionBtnBg, actionBtnOpacity, actionActiveColor |
| 打印 | `--print-width`, `--print-height` | printWidth, printHeight |
| 杂项 | `--font-family`, `--overlay-gradient`, `--song-info-gap`, `--content-bottom`, `--content-padding-x` | fontFamily, overlayGradient(计算), songInfoGap, contentBottom, contentPaddingX |

**DOM 更新：** albumImage backgroundImage、songTitle/songArtist textContent、currentTime/totalTime textContent、favoriteBtn active class

**原文件范围：** `yue2.js` 第 112-173 行

**不变部分：** CSS 变量名、DOM 元素 ID、overlayGradient 计算逻辑

---

### 3.4 `card/text-fitter.js` — 红线自适应

**职责：** 确保歌名/歌手不超出收藏按钮左边沿（"红线原则"），自动缩小字号或换行。

```js
export function clampTextWidth(el, defaultSize, fontWeight)  // 单元素自适应
export function fitTitle()                                    // 对歌名+歌手同时应用
```

**自适应策略：**
1. 测量卡片内 action-buttons 左边缘位置
2. 计算文本可用宽度 = btnLeft - textLeft - 5
3. 用 Canvas 2D context 测量文本渲染宽度
4. 如果超出，二分查找 [8, baseSize] 间最佳字号
5. 最佳字号 ≥ 10px → 单行 + ellipsis
6. 最佳字号 < 10px → 8px + 最多 2 行（-webkit-line-clamp）

**特殊逻辑：** `_manualFont` 标记 — 用户手动改过字号时跳过自适应，只用红线约束宽度

**原文件范围：** `yue2.js` 第 176-313 行

**不变部分：** 自适应算法、红线逻辑、_manualFont 标记

---

### 3.5 `card/export.js` — Canvas PNG 导出

**职责：** 将卡片逐层绘制到 Canvas 并导出为高清 PNG。

```js
export function exportImage(event)  // 主导出函数
export function drawFaIcon(ctx, el, cx, cy, size)  // Font Awesome 图标绘制
export function roundPath(ctx, x, y, w, h, r)      // Canvas 圆角矩形路径
export function imgToDataUrl(url)                   // 图片转 Data URL（带降级）
```

**Canvas 渲染层级（8 层，按顺序）：**

| 层 | 内容 | 绘图方式 |
|----|------|---------|
| 1 | 卡片背景 | 圆角矩形 fill |
| 2 | 封面图片 | 圆角裁剪 clip + drawImage (cover 缩放) |
| 3 | 覆盖层渐变 | linearGradient (底部实色→顶部透明) |
| 4 | 操作按钮 | arc 圆形 + drawFaIcon |
| 5 | 歌名/歌手 | fillText |
| 6 | 时间文字 | fillText (左右对齐) |
| 7 | 进度条 | 圆角矩形 fill (轨道+填充) |
| 8 | 控制按钮 | arc 圆形/半透明 + drawFaIcon |

**缩放：** 6 倍缩放 (`SCALE = 6`)，从 DOM 元素 offsetWidth/offsetHeight 为基准

**导出流程：**
```
measureElementPositions → loadCoverImage → createCanvas@6x → 
drawLayer1~8 → toDataURL('image/png') → 
Tauri: invoke('export_png_file') / Browser: a.click()
```

**原文件范围：** `yue2.js` 第 873-1153 行

**不变部分：** 所有绘制坐标计算、缩放比例、Font Awesome 字体渲染

---

### 3.6 `card/controls.js` — 卡片交互控制

**职责：** 收藏、播放、评论按钮的点击交互。

```js
export function initControls()    // 绑定 3 个按钮事件
```

**按钮行为：**
- 收藏按钮：toggle isFavorite + active class + 同步 checkbox
- 播放按钮：toggle fa-play / fa-pause 图标
- 评论按钮：alert('评论区')

**原文件范围：** `yue2.js` 第 633-644 行

---

### 3.7 `history/manager.js` — 历史记录

**职责：** 配置历史的 localStorage 持久化、渲染列表、命名/删除/恢复操作。

```js
export function loadHistory()          // 从 localStorage 读取
export function saveHistory()          // 写入 localStorage（存满时丢弃最旧条目）
export function saveCurrentConfig()    // 保存当前配置为历史条目
export function deleteHistoryEntry(id) // 删除单条
export function restoreHistoryEntry(id)// 恢复历史配置
export function renameHistoryEntry(id) // 重命名条目
export function renderHistory()        // 渲染历史列表 DOM
```

**localStorage key：** `musicCardHistory`

**条目结构：**
```js
{ id: Date.now(), name: '', time: 'HH:MM:SS', date: 'YYYY/MM/DD', config: { ... } }
```

**原文件范围：** `yue2.js` 第 504-628 行

---

### 3.8 `cover/search.js` — 封面搜索

**职责：** 调用 iTunes Search API 搜索封面，渲染结果网格。

```js
export function initCoverSearch()      // 绑定搜索相关事件
export async function doCoverSearch(query)  // 执行搜索
```

**搜索流程：**
```
用户输入 → 选择搜索类型（歌曲/专辑/歌手）→ 选择国家 →
doCoverSearch(query)
  ├─ 取消上一次请求（AbortController）
  ├─ fetch(`https://itunes.apple.com/search?term=${q}&entity=${entity}&limit=200&country=${country}`)
  ├─ 去重（artworkUrl100 去重）
  ├─ 渲染封面网格（artworkUrl100 → 600x600bb）
  └─ 点击结果 → 应用封面 + 自动填充歌曲信息
```

**原文件范围：** `yue2.js` 第 735-867 行 + 第 1158-1188 行（事件绑定）

---

### 3.9 `cover/drop-zone.js` — 图片拖拽上传

**职责：** 封面上传区域的点击/拖拽/Electron 原生对话框支持。

```js
export function createDropZone(group, config)  // 构建图片上传控件
```

**三种上传方式（优先级）：**
1. **Tauri 环境** → `invoke('select_cover_file')` 调用原生文件对话框
2. **浏览器 / 回退** → `<input type="file">` 点击触发
3. **拖拽** → dragenter / dragover / drop 事件处理

**原文件范围：** `yue2.js` 第 370-448 行

---

### 3.10 `utils/color.js` — 颜色工具

```js
export function hexToRgba(hex, a)  // #RRGGBB → rgba(r,g,b,a)
```

### 3.11 `utils/icons.js` — 图标映射

```js
export const FA_ICONS = {
  'fa-step-backward': { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
  'fa-step-forward':  { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
  'fa-play':          { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
  'fa-pause':         { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
  'fa-heart':         { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
  'fa-comment-dots':  { ch: '', font: 'Font Awesome 6 Free Regular', w: 400 },
}
```

### 3.12 `utils/tauri-api.js` — Tauri 桥接

**职责：** 封装 Tauri invoke 调用，提供与前项目 `window.electronAPI` 兼容的接口。

```js
import { invoke } from '@tauri-apps/api/core'

export const tauriAPI = {
  async selectCoverFile() { ... },
  async exportConfigFile(fileName, content) { ... },
  async importConfigFile() { ... },
  async exportPngFile(dataUrl) { ... },
}
```

**关键设计：** 保留 `if (window.__TAURI__)` 检测，浏览器 fallback 与原项目一致

---

### 3.13 `main.js` — 应用入口

**职责：** 导入并初始化所有组件。

```js
import './config/defaults.js'        // 纯数据，自动生效
import { buildConfigPanel, sync } from './config/panel.js'
import { applyConfig } from './card/renderer.js'
import { initControls } from './card/controls.js'
import { loadHistory, renderHistory } from './history/manager.js'
import { initCoverSearch } from './cover/search.js'
import { setupExportButtons } from './card/export.js'

// 初始化
const currentConfig = { ...DEFAULT_CONFIG }
buildConfigPanel(currentConfig)
applyConfig(currentConfig)
loadHistory()
renderHistory()
initControls()
initCoverSearch()
setupExportButtons()
```

---

## 4. Rust 后端设计

### 4.1 Tauri Command 接口（4 个）

| Command | 参数 | 返回 | 对应原 Electron IPC |
|---------|------|------|---------------------|
| `select_cover_file` | 无 | `{ data_url: string, file_name: string }` | `select-cover-file` |
| `export_config_file` | `{ file_name, content }` | `bool` | `export-config-file` |
| `import_config_file` | 无 | `string` (JSON 内容) | `import-config-file` |
| `export_png_file` | `{ data_url }` | `bool` | `export-png-file` |

### 4.2 核心逻辑

```rs
// select_cover_file
1. 用 tauri-plugin-dialog 打开文件选择器
2. 读取文件为 bytes
3. 检测扩展名确定 MIME type
4. base64 编码 → data URL

// export_config_file
1. 打开保存对话框（默认目录 configs/）
2. 写入 JSON 内容

// import_config_file
1. 打开文件选择器（默认目录 configs/）
2. 读取并返回文件内容

// export_png_file
1. 接收 data:image/png;base64 URL
2. 解码 base64 为 buffer
3. 打开保存对话框（默认目录 output/）
4. 写入 buffer

// 目录管理
resource_dir/covers/      ← 封面图片
resource_dir/configs/     ← 导出的配置
resource_dir/output/      ← 导出的 PNG
```

---

## 5. Tauri 配置

```json
{
  "productName": "音乐卡片制作工具",
  "version": "1.0.0",
  "identifier": "com.music-card-maker.app",
  "windows": [{ "width": 1100, "height": 800, "title": "音乐卡片制作工具" }],
  "resources": ["../covers/*"]
}
```

### 权限声明（capabilities）

```json
{
  "permissions": [
    "core:default",
    "opener:default",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save"
  ]
}
```

### Rust 依赖

```toml
[dependencies]
tauri = { version = "2", features = ["dialog"] }
tauri-plugin-opener = "2"
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
base64 = "0.22"
```

---

## 6. 与原项目的差异对照

| 维度 | 原项目 (Electron) | 移植后 (Tauri v2) |
|------|-------------------|-------------------|
| 桌面框架 | Electron + electron-builder | Tauri v2 |
| 后端语言 | Node.js | Rust |
| 前端架构 | 3 个单文件 | 13 个 ES Module 组件 |
| IPC 机制 | contextBridge + ipcRenderer | `@tauri-apps/api` invoke |
| 文件对话框 | Electron dialog API | tauri-plugin-dialog |
| 单实例锁 | `app.requestSingleInstanceLock()` | Tauri 内置单实例 |
| 图标 | Node.js sharp + png-to-ico 生成 | Tauri icons 目录 |
| 图片选择 | Electron dialog 读文件 → data URL | Tauri dialog + base64 Rust |
| 配置导入/导出 | Electron 对话框 | Tauri dialog |
| PNG 导出 | Canvas → data URL → Electron 保存 | Canvas → data URL → Rust 解码保存 |
| 前端模块化 | 无（script src 加载） | ES Module (type: module) |

---

## 7. 不变清单（确保万无一失）

以下内容与原项目保持**完全一致**，一个字不改：

- ✅ `DEFAULT_CONFIG` 所有参数值
- ✅ `FIELD_META` 所有字段定义
- ✅ `FIELD_SECTIONS` 分组结构
- ✅ `HIDDEN_FIELDS` 集合
- ✅ `applyConfig` 内 28 个 CSS 变量名与计算逻辑
- ✅ `clampTextWidth` 自适应算法（Canvas 测量、二分查找）
- ✅ Canvas 导出 8 层绘制顺序与坐标计算
- ✅ `FA_ICONS` Font Awesome Unicode 码点
- ✅ iTunes API 请求参数与结果处理
- ✅ 历史记录 localStorage key 与数据格式
- ✅ HTML DOM 结构（class、id、嵌套层级）
- ✅ CSS 选择器与变量名
- ⚠️ **修复项目已有 bug**：补声明 `coverSearchState` 变量（原项目缺少 `const coverSearchState = {}`）

---

## 8. 实施步骤

1. **准备 Cargo.toml** — 添加 dialog、base64 依赖
2. **编写 Rust lib.rs** — 4 个 Tauri command
3. **配置 tauri.conf.json** — 窗口大小、产品名、资源目录
4. **配置 capabilities** — dialog 权限
5. **复制 covers/** — 默认封面图
6. **替换 index.html** — yue2.html 内容 + Font Awesome CDN
7. **替换 styles.css** — yue2.css 完整内容
8. **拆 JS 为 ES Module** — 13 个组件文件
9. **安装 npm 依赖** — @tauri-apps/api, @tauri-apps/plugin-dialog
10. **编译验证** — `npm run tauri build`
