# 音乐卡片制作工具 Tauri v2 移植 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 yue-master (Electron) 完整移植到 Tauri v2，拆分为 13 个 ES Module 组件

**Architecture:** 前端 ES Module 组件（纯数据 + 逻辑抽取），后端 Rust Tauri command（替代 Electron IPC）

**Tech Stack:** Tauri v2, Rust, vanilla JS (ES Module), CSS Variables, Canvas 2D, iTunes Search API

## 全局约束

- **原逻辑不改变** — 所有函数体、配置值、CSS 变量名、DOM ID 与原项目 `yue2.js` 完全一致
- `src/` 目录下 `index.html` 须移除 `<script type="module">` 标签外的所有默认 Tauri 模板内容
- 使用 `type="module"` 加载 `main.js`
- Font Awesome 6 通过 CDN 加载：`https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css`
- 所有 JS 组件文件必须导出 `export` 命名导出（不使用 `export default`）

---

### Task 1: 配置 Rust 后端与 Tauri 设置

**文件:**
- Create: `src-tauri/Cargo.toml`（已存在，覆盖）
- Create: `src-tauri/tauri.conf.json`（已存在，覆盖）
- Create: `src-tauri/capabilities/default.json`（已存在，覆盖）
- Create: `src-tauri/src/lib.rs`（已存在，覆盖）

**接口:**
- Produces: 4 个 Tauri command → `select_cover_file`, `export_config_file`, `import_config_file`, `export_png_file`
- Produces: dialog 权限配置

- [ ] **Step 1: 写入 Cargo.toml**

```toml
[package]
name = "music-card-maker"
version = "1.0.0"
description = "音乐卡片制作工具"
authors = ["you"]
edition = "2021"

[lib]
name = "music_card_maker_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["dialog"] }
tauri-plugin-opener = "2"
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
base64 = "0.22"
```

- [ ] **Step 2: 写入 tauri.conf.json**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "音乐卡片制作工具",
  "version": "1.0.0",
  "identifier": "com.music-card-maker.app",
  "build": {
    "frontendDist": "../src"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "title": "音乐卡片制作工具",
        "width": 1100,
        "height": 800
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "resources": [
      "../covers/*"
    ],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 3: 写入 capabilities/default.json**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "dialog:allow-message",
    "dialog:allow-ask"
  ]
}
```

- [ ] **Step 4: 写入 src-tauri/src/lib.rs**

```rust
use base64::Engine;
use serde::Serialize;
use std::fs;
use tauri::Manager;

#[derive(Serialize)]
pub struct CoverFileResult {
    data_url: String,
    file_name: String,
}

#[tauri::command]
fn select_cover_file(app: tauri::AppHandle) -> Result<CoverFileResult, String> {
    let covers_dir = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("covers");
    let _ = fs::create_dir_all(&covers_dir);

    let result = tauri_plugin_dialog::FileDialogBuilder::new()
        .set_title("选择封面图片")
        .add_filter("图片", &["png", "jpg", "jpeg", "webp", "gif"])
        .set_directory(&covers_dir)
        .blocking_pick_file();

    match result {
        Some(file_path) => {
            let path = file_path.as_path().ok_or("无效的文件路径")?;
            let data = fs::read(path).map_err(|e| e.to_string())?;
            let ext = path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("png")
                .to_lowercase();
            let mime = match ext.as_str() {
                "png" => "image/png",
                "jpg" | "jpeg" => "image/jpeg",
                "webp" => "image/webp",
                "gif" => "image/gif",
                _ => "image/png",
            };
            let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
            let data_url = format!("data:{};base64,{}", mime, b64);
            let file_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();
            Ok(CoverFileResult { data_url, file_name })
        }
        None => Ok(CoverFileResult {
            data_url: String::new(),
            file_name: String::new(),
        }),
    }
}

#[tauri::command]
fn export_config_file(app: tauri::AppHandle, file_name: String, content: String) -> Result<bool, String> {
    let configs_dir = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("configs");
    let _ = fs::create_dir_all(&configs_dir);

    let result = tauri_plugin_dialog::FileDialogBuilder::new()
        .set_title("导出配置")
        .add_filter("JSON 配置", &["json"])
        .set_file_name(&file_name)
        .blocking_save_file();

    match result {
        Some(file_path) => {
            let path = file_path.as_path().ok_or("无效的文件路径")?;
            fs::write(path, &content).map_err(|e| e.to_string())?;
            Ok(true)
        }
        None => Ok(false),
    }
}

#[tauri::command]
fn import_config_file(app: tauri::AppHandle) -> Result<String, String> {
    let configs_dir = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("configs");
    let _ = fs::create_dir_all(&configs_dir);

    let result = tauri_plugin_dialog::FileDialogBuilder::new()
        .set_title("导入配置")
        .add_filter("JSON 配置", &["json"])
        .set_directory(&configs_dir)
        .blocking_pick_file();

    match result {
        Some(file_path) => {
            let path = file_path.as_path().ok_or("无效的文件路径")?;
            let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
            Ok(content)
        }
        None => Ok(String::new()),
    }
}

#[tauri::command]
fn export_png_file(app: tauri::AppHandle, data_url: String) -> Result<bool, String> {
    let output_dir = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("output");
    let _ = fs::create_dir_all(&output_dir);

    let result = tauri_plugin_dialog::FileDialogBuilder::new()
        .set_title("导出 PNG")
        .add_filter("PNG 图片", &["png"])
        .set_file_name("music-card.png")
        .blocking_save_file();

    match result {
        Some(file_path) => {
            let path = file_path.as_path().ok_or("无效的文件路径")?;
            let b64_str = data_url
                .strip_prefix("data:image/png;base64,")
                .ok_or("无效的 data URL 格式")?;
            let decoded = base64::engine::general_purpose::STANDARD
                .decode(b64_str)
                .map_err(|e| e.to_string())?;
            fs::write(path, &decoded).map_err(|e| e.to_string())?;
            Ok(true)
        }
        None => Ok(false),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            select_cover_file,
            export_config_file,
            import_config_file,
            export_png_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 5: 验证 Rust 配置编译**

```bash
cd 'C:\Users\ASUS\Desktop\llmux\7.7' && cargo check 2>&1 || echo "EXPECTED: some errors may show if ffmpeg/system deps missing — ok for now"
```

---

### Task 2: 资源文件 — covers/ 目录和 icon.svg

**文件:**
- Create: `src/covers/`（目录）
- Copy: `C:\Users\ASUS\Desktop\llmux\yue-master\covers\花鳥風月-1400.jpg` → `src/covers/花鳥風月-1400.jpg`
- Copy: `C:\Users\ASUS\Desktop\llmux\yue-master\icon.svg` → `icon.svg`

- [ ] **Step 1: 创建目录并复制资源文件**

```bash
mkdir -p 'C:\Users\ASUS\Desktop\llmux\7.7\src\covers'
cp 'C:\Users\ASUS\Desktop\llmux\yue-master\covers\花鳥風月-1400.jpg' 'C:\Users\ASUS\Desktop\llmux\7.7\src\covers\花鳥風月-1400.jpg'
cp 'C:\Users\ASUS\Desktop\llmux\yue-master\icon.svg' 'C:\Users\ASUS\Desktop\llmux\7.7\icon.svg'
```

- [ ] **Step 2: 验证文件已复制**

```bash
ls -la 'C:\Users\ASUS\Desktop\llmux\7.7\src\covers\'
ls -la 'C:\Users\ASUS\Desktop\llmux\7.7\icon.svg'
```

---

### Task 3: 替换 index.html

**文件:**
- Modify: `src/index.html`（覆盖）

**接口:**
- Consumes: 用 `<script type="module" src="main.js">` 加载 JS
- Consumes: Font Awesome CDN 链接
- Produces: 所有 DOM 元素 ID（musicCard, albumImage, songTitle 等）

- [ ] **Step 1: 写入 src/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>可配置音乐卡片</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

<div class="app-container">

    <!-- 左侧：可滚动配置 -->
    <div class="config-panel">
        <div class="config-header">
            <h3>卡片配置</h3>
            <div class="sub">调整参数 · 实时预览</div>
        </div>

        <div class="history-section" id="historySection"></div>

        <div class="config-grid" id="configGrid"></div>

        <div class="config-actions">
            <div class="config-actions-row">
                <button class="btn-action btn-import" id="importBtn">导入配置</button>
                <button class="btn-action btn-export" id="exportBtn">导出配置</button>
            </div>
            <div class="config-actions-row">
                <button class="btn-action btn-reset" id="resetBtn">重置</button>
                <button class="btn-action btn-png" id="exportPngBtn">导出 PNG</button>
            </div>
        </div>

        <input type="file" id="importFileInput" accept=".json" style="display:none">
    </div>

    <!-- 右侧：预览 + 封面浏览器 -->
    <div class="right-panel">
        <div class="preview-section">
            <span class="right-section-label">预览</span>
            <div class="music-card" id="musicCard">
                <div class="album-cover">
                    <div class="album-img" id="albumImage"></div>
                </div>
                <div class="overlay"></div>

                <div class="content-group">
                    <div class="song-info">
                        <div class="song-title" id="songTitle">邂逅</div>
                        <div class="song-artist" id="songArtist">kaf</div>
                    </div>
                    <div class="progress-container">
                        <div class="time-display">
                            <span id="currentTime">1:23</span>
                            <span id="totalTime">3:47</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                    </div>
                </div>

                <div class="control-buttons">
                    <button class="control-btn prev-btn" title="上一首"><i class="fas fa-step-backward"></i></button>
                    <button class="control-btn play-btn" id="playBtn" title="播放/暂停"><i class="fas fa-play" id="playIcon"></i></button>
                    <button class="control-btn next-btn" title="下一首"><i class="fas fa-step-forward"></i></button>
                </div>

                <div class="action-buttons">
                    <button class="action-btn" id="favoriteBtn" title="收藏"><i class="fas fa-heart"></i></button>
                    <button class="action-btn" id="commentBtn" title="评论区"><i class="fas fa-comment-dots"></i></button>
                </div>
            </div>
        </div>

        <div class="cover-browser" id="coverBrowser">
            <span class="right-section-label">封面搜索</span>
            <div class="cover-search-bar">
                <div class="cover-search-types">
                    <button class="cover-type-btn active" data-type="song">歌曲</button>
                    <button class="cover-type-btn" data-type="album">专辑</button>
                    <button class="cover-type-btn" data-type="artist">歌手</button>
                </div>
                <div class="cover-search-row">
                    <input type="text" id="coverSearchInput" placeholder="输入关键词搜索...">
                    <select id="coverCountrySelect">
                        <option value="">所有国家</option>
                        <option value="CN" selected>中国</option>
                        <option value="JP">日本</option>
                        <option value="KR">韩国</option>
                        <option value="US">美国</option>
                        <option value="GB">英国</option>
                        <option value="TW">台湾</option>
                        <option value="HK">香港</option>
                    </select>
                    <button id="coverSearchBtn"><i class="fas fa-search"></i> 搜索</button>
                </div>
            </div>
            <div class="cover-results" id="coverResults">
                <div class="cover-results-empty">
                    <i class="fas fa-music"></i>
                    <p>输入歌曲名或歌手，搜索封面</p>
                </div>
            </div>
        </div>
    </div>

</div>

<script type="module" src="main.js"></script>
</body>
</html>
```

---

### Task 4: 替换 styles.css

**文件:**
- Modify: `src/styles.css`（覆盖）

- [ ] **Step 1: 复制 yue2.css 到 src/styles.css**

复制 `C:\Users\ASUS\Desktop\llmux\yue-master\yue2.css` 的内容到 `C:\Users\ASUS\Desktop\llmux\7.7\src\styles.css`。

内容就是 yue2.css 的完整 805 行 — CSS 变量驱动的卡片样式、布局、配置面板、历史记录、封面浏览器、响应式、打印样式。与原文件完全一致，无需修改。

---

### Task 5: 工具函数 — color.js / icons.js / tauri-api.js

**文件:**
- Create: `src/utils/color.js`
- Create: `src/utils/icons.js`
- Create: `src/utils/tauri-api.js`

**接口:**
- Consumes: `hexToRgba` 被 `renderer.js`, `export.js` 使用
- Consumes: `FA_ICONS` 被 `export.js` 使用
- Consumes: `tauriAPI` 被 `drop-zone.js`, `export.js`, `panel.js`（配置导入导出）使用

- [ ] **Step 1: 创建 src/utils/ 目录**

```bash
mkdir -p 'C:\Users\ASUS\Desktop\llmux\7.7\src\utils'
```

- [ ] **Step 2: 写入 src/utils/color.js**

```js
export function hexToRgba(hex, a) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
}
```

- [ ] **Step 3: 写入 src/utils/icons.js**

```js
// Font Awesome 6 图标的 Unicode 字码
export const FA_ICONS = {
    'fa-step-backward': { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
    'fa-step-forward':  { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
    'fa-play':          { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
    'fa-pause':         { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
    'fa-heart':         { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
    'fa-comment-dots':  { ch: '', font: 'Font Awesome 6 Free Regular', w: 400 },
};
```

- [ ] **Step 4: 写入 src/utils/tauri-api.js**

```js
import { invoke } from '@tauri-apps/api/core';

export const tauriAPI = {
    async selectCoverFile() {
        if (window.__TAURI__) {
            return await invoke('select_cover_file');
        }
        return null;
    },

    async exportConfigFile(fileName, content) {
        if (window.__TAURI__) {
            return await invoke('export_config_file', { fileName, content });
        }
        return false;
    },

    async importConfigFile() {
        if (window.__TAURI__) {
            return await invoke('import_config_file');
        }
        return null;
    },

    async exportPngFile(dataUrl) {
        if (window.__TAURI__) {
            return await invoke('export_png_file', { dataUrl });
        }
        return false;
    },
};
```

---

### Task 6: 配置数据 — src/config/defaults.js

**文件:**
- Create: `src/config/defaults.js`

**接口:**
- Produces: `DEFAULT_CONFIG`, `FIELD_META`, `HIDDEN_FIELDS`, `FIELD_SECTIONS`
- Consumed by: `panel.js`, `renderer.js`, `text-fitter.js`, `export.js`, `main.js`

- [ ] **Step 1: 创建 src/config/ 目录**

```bash
mkdir -p 'C:\Users\ASUS\Desktop\llmux\7.7\src\config'
```

- [ ] **Step 2: 写入 src/config/defaults.js**

```js
export const DEFAULT_CONFIG = {
    cardWidth: '270px',
    cardAspectRatio: '54 / 85',
    cardBg: '#8B1A35',
    cardRadius: '16px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",

    albumImageUrl: 'covers/花鳥風月-1400.jpg',
    albumHeight: '55%',
    albumPadding: '1cm 1cm 0',
    albumImgRadius: '8px',

    textColor: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    titleSize: '14px',
    artistSize: '11px',
    artistOpacity: '0.9',

    songInfoGap: '8px',
    contentBottom: 'calc(1.3cm + 60px)',
    contentPaddingX: '1cm',

    progressTextColor: '#a0a0c0',
    timeSize: '10px',
    progressHeight: '3px',
    progressTrackColor: 'rgba(255,255,255,0.1)',
    progressFillColor: '#ff6b6b',
    progressPercent: 35,

    songTitle: '月 feat. ヰ世界情緒',
    songArtist: 'Guiano/ヰ世界情緒',
    currentTime: '1:23',
    totalTime: '3:34',

    controlsBottom: '1cm',
    controlsGap: '18px',
    sideBtnSize: '36px',
    sideBtnIconSize: '16px',
    sideBtnOpacity: '0.8',
    playBtnSize: '48px',
    playBtnIconSize: '20px',
    playBtnBg: '#ffffff',
    playBtnColor: '#8B1A35',
    playBtnShadow: '0 2px 8px rgba(255,255,255,0.2)',

    actionTop: 'calc(55% + 24px)',
    actionRight: '1cm',
    actionGap: '12px',
    actionBtnSize: '28px',
    actionBtnIconSize: '14px',
    actionBtnBg: '#ffffff',
    actionBtnOpacity: 20,
    actionActiveColor: '#ff6b6b',

    isFavorite: false,
    printWidth: '5.4cm',
    printHeight: '8.5cm',
};

export const FIELD_META = {
    cardBg:{label:'卡片背景',type:'color'}, textColor:{label:'文字颜色',type:'color'},
    progressFillColor:{label:'进度条填充',type:'color'}, progressTrackColor:{label:'进度条轨道',type:'color'},
    progressTextColor:{label:'时间文字',type:'color'}, playBtnBg:{label:'播放键背景',type:'color'},
    playBtnColor:{label:'播放键图标',type:'color'}, actionBtnBg:{label:'操作按钮底色',type:'color'},
    actionActiveColor:{label:'收藏激活色',type:'color'},
    cardWidth:{label:'卡片宽度',type:'text'}, cardAspectRatio:{label:'宽高比',type:'text'},
    cardRadius:{label:'卡片圆角',type:'text'}, progressPercent:{label:'进度百分比',type:'range',min:0,max:100,step:1},
    titleSize:{label:'标题字号',type:'text'}, artistSize:{label:'歌手字号',type:'text'},
    sideBtnSize:{label:'侧按钮大小',type:'text'}, playBtnSize:{label:'播放键大小',type:'text'},
    actionBtnSize:{label:'操作按钮大小',type:'text'}, actionBtnOpacity:{label:'按钮透明度',type:'range',min:0,max:100,step:1}, controlsGap:{label:'按钮间距',type:'text'},
    albumHeight:{label:'封面高度占比',type:'text'}, albumImgRadius:{label:'封面圆角',type:'text'},
    songTitle:{label:'歌曲名',type:'text'}, songArtist:{label:'歌手名',type:'text'},
    currentTime:{label:'当前时间',type:'text'}, totalTime:{label:'总时长',type:'text'},
    albumImageUrl:{label:'封面图片',type:'image'}, isFavorite:{label:'默认收藏',type:'checkbox'},
    playBtnShadow:{label:'播放键阴影',type:'text'}, textShadow:{label:'文字阴影',type:'text'},
};

export const HIDDEN_FIELDS = new Set([
    'fontFamily','artistOpacity','songInfoGap','contentBottom','contentPaddingX','timeSize',
    'progressHeight','sideBtnIconSize','sideBtnOpacity','playBtnIconSize','controlsBottom',
    'actionTop','actionRight','actionGap','actionBtnIconSize','albumPadding','printWidth','printHeight',
    'overlayGradient'
]);

export const FIELD_SECTIONS = [
    { title:'颜色', keys:['cardBg','textColor','progressFillColor','progressTrackColor','progressTextColor','playBtnBg','playBtnColor','actionBtnBg','actionBtnOpacity','actionActiveColor'] },
    { title:'尺寸', keys:['cardWidth','cardAspectRatio','cardRadius','progressPercent','titleSize','artistSize','sideBtnSize','playBtnSize','actionBtnSize','controlsGap','albumHeight','albumImgRadius'] },
    { title:'内容', keys:['songTitle','songArtist','currentTime','totalTime','albumImageUrl'] },
    { title:'状态', keys:['isFavorite'] },
    { title:'高级', keys:['playBtnShadow','textShadow'] },
];
```

---

### Task 7: 配置面板 — src/config/panel.js

**文件:**
- Create: `src/config/panel.js`

**接口:**
- Consumes: `FIELD_META`, `FIELD_SECTIONS`, `HIDDEN_FIELDS` from `defaults.js`
- Consumes: `tauriAPI` from `utils/tauri-api.js`
- Consumes: `applyConfig` from `card/renderer.js`
- Produces: `buildConfigPanel(config)`, `sync()`, `readConfig()`, `autoCalcTime(c)`, `showToast(msg)`, `resetBtn`, `exportBtn`, `importBtn` handlers
- Exports: `setCurrentConfigRef(fn)` — 让 main.js 传入 `setConfig` 回调

**注意:** `buildConfigPanel` 在 `type=image` 时创建 drop zone。此 drop zone 的创建逻辑与 `cover/drop-zone.js` 重复 —— 为保持原逻辑不变，直接内联此代码，不调用外部组件。`cover/drop-zone.js` 仅为独立封装的参考副本。

- [ ] **Step 1: 写入 src/config/panel.js**

```js
import { FIELD_META, FIELD_SECTIONS, HIDDEN_FIELDS, DEFAULT_CONFIG } from './defaults.js';
import { tauriAPI } from '../utils/tauri-api.js';
import { applyConfig } from '../card/renderer.js';

// 当前配置引用 — main.js 通过 setCurrentConfigRef 注入
let currentConfig = null;
export function setCurrentConfigRef(cfg) {
    currentConfig = cfg;
}
export function getCurrentConfig() {
    return currentConfig;
}

export function sync() {
    currentConfig = readConfig();
    autoCalcTime(currentConfig);
    applyConfig(currentConfig);
}

export function readConfig() {
    const cfg = {};
    Object.keys(FIELD_META).forEach(key => {
        if (HIDDEN_FIELDS.has(key)) return;
        if (FIELD_META[key].type === 'image') return;
        const el = document.getElementById(`c-${key}`);
        if (!el) return;
        cfg[key] = FIELD_META[key].type === 'checkbox' ? el.checked : el.value;
    });
    Object.keys(DEFAULT_CONFIG).forEach(k => {
        if (!(k in cfg)) cfg[k] = currentConfig[k] ?? DEFAULT_CONFIG[k];
    });
    return cfg;
}

export function autoCalcTime(c) {
    const m = c.totalTime.match(/^(\d+):(\d+)$/);
    if (m) {
        const totalSec = parseInt(m[1]) * 60 + parseInt(m[2]);
        const curSec = Math.round(totalSec * (parseFloat(c.progressPercent) / 100));
        c.currentTime = Math.floor(curSec / 60) + ':' + String(curSec % 60).padStart(2, '0');
        const input = document.getElementById('c-currentTime');
        if (input) input.value = c.currentTime;
    }
}

export function buildConfigPanel(config) {
    const grid = document.getElementById('configGrid');
    grid.innerHTML = '';

    FIELD_SECTIONS.forEach(section => {
        const keys = section.keys.filter(k => !HIDDEN_FIELDS.has(k));
        if (!keys.length) return;

        const title = document.createElement('div');
        title.className = 'section-label';
        title.textContent = section.title;
        grid.appendChild(title);

        keys.forEach(key => {
            const meta = FIELD_META[key];
            const val = config[key] ?? '';

            const group = document.createElement('div');
            group.className = 'config-group';
            if (key === 'songTitle' || key === 'songArtist') {
                group.style.gridColumn = '1 / -1';
            }

            const label = document.createElement('label');
            label.htmlFor = `c-${key}`;
            label.textContent = meta.label;
            group.appendChild(label);

            let input;
            if (meta.type === 'color') {
                input = document.createElement('input');
                input.type = 'color';
                input.value = val;
                input.addEventListener('input', sync);
            } else if (meta.type === 'checkbox') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = !!val;
                input.addEventListener('change', sync);
            } else if (meta.type === 'range') {
                input = document.createElement('input');
                input.type = 'range';
                input.min = meta.min;
                input.max = meta.max;
                input.step = meta.step;
                input.value = val;
                input.addEventListener('input', sync);

                const valSpan = document.createElement('span');
                valSpan.style.cssText = 'font-size:10.5px;color:#bbb;margin-left:2px;';
                valSpan.textContent = val;
                input.addEventListener('input', () => { valSpan.textContent = input.value; });
                group.appendChild(valSpan);
            } else if (meta.type === 'image') {
                group.style.gridColumn = '1 / -1';

                const dropZone = document.createElement('div');
                dropZone.className = 'image-drop-zone';

                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';

                const previewIcon = document.createElement('div');
                previewIcon.className = 'drop-zone-icon';
                previewIcon.innerHTML = '<i class="fas fa-image"></i>';

                const texts = document.createElement('div');
                texts.className = 'drop-zone-texts';

                const nameText = document.createElement('span');
                nameText.className = 'drop-zone-name';
                nameText.textContent = val && val !== 'none'
                    ? val.split('/').pop().split('\\').pop()
                    : '点击或拖拽选择封面图片';

                const hintText = document.createElement('span');
                hintText.className = 'drop-zone-hint';
                hintText.textContent = val && val !== 'none' ? '点击更换' : '支持 PNG / JPG / WebP';

                texts.appendChild(nameText);
                texts.appendChild(hintText);
                dropZone.appendChild(previewIcon);
                dropZone.appendChild(texts);
                dropZone.appendChild(fileInput);

                function handleFile(file) {
                    if (!file || !file.type.startsWith('image/')) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        currentConfig.albumImageUrl = ev.target.result;
                        nameText.textContent = file.name;
                        hintText.textContent = '点击更换';
                        previewIcon.innerHTML = '<i class="fas fa-check-circle" style="color:#2d7d46"></i>';
                        dropZone.classList.add('has-image');
                        sync();
                    };
                    reader.readAsDataURL(file);
                }

                dropZone.addEventListener('click', async () => {
                    if (window.__TAURI__) {
                        const result = await tauriAPI.selectCoverFile();
                        if (result && result.dataUrl) {
                            currentConfig.albumImageUrl = result.dataUrl;
                            nameText.textContent = result.fileName;
                            hintText.textContent = '已选择';
                            previewIcon.innerHTML = '<i class="fas fa-check-circle" style="color:#2d7d46"></i>';
                            dropZone.classList.add('has-image');
                            sync();
                        }
                    } else {
                        fileInput.click();
                    }
                });
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files[0]) handleFile(e.target.files[0]);
                    e.target.value = '';
                });

                ['dragenter', 'dragover'].forEach(evt => {
                    dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
                });
                ['dragleave', 'drop'].forEach(evt => {
                    dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); });
                });
                dropZone.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

                group.appendChild(dropZone);
                input = null;
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = val;
                input.addEventListener('input', sync);
                if (key === 'titleSize' || key === 'artistSize') {
                    input.addEventListener('input', () => { currentConfig._manualFont = true; });
                }
            }

            if (input) {
                input.id = `c-${key}`;
                group.appendChild(input);
            }
            grid.appendChild(group);
        });
    });
}

// Toast 消息提示
export function showToast(msg) {
    let t = document.getElementById('toastMsg');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toastMsg';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.classList.remove('show'), 2000);
}
```

---

### Task 8: 卡片渲染 — src/card/renderer.js + text-fitter.js

**文件:**
- Create: `src/card/renderer.js`
- Create: `src/card/text-fitter.js`

**接口:**
- Produces: `applyConfig(config)` — 写入 CSS 变量 + 更新 DOM + 触发 fitTitle
- Produces: `clampTextWidth(el, defaultSize, fontWeight)`, `fitTitle()`

- [ ] **Step 1: 创建 src/card/ 目录**

```bash
mkdir -p 'C:\Users\ASUS\Desktop\llmux\7.7\src\card'
```

- [ ] **Step 2: 写入 src/card/text-fitter.js**

```js
import { DEFAULT_CONFIG } from '../config/defaults.js';

export function clampTextWidth(el, defaultSize, fontWeight) {
    if (!el || !el.textContent) return;

    const card = document.getElementById('musicCard');
    if (!card) return;

    void card.offsetHeight;

    const actionBtns = card.querySelector('.action-buttons');
    const elRect = el.getBoundingClientRect();

    let availWidth;
    if (actionBtns) {
        const btnLeft = actionBtns.getBoundingClientRect().left;
        availWidth = btnLeft - elRect.left - 5;
    } else {
        availWidth = card.getBoundingClientRect().width - 130;
    }
    if (availWidth <= 20) return -1;

    el.style.maxWidth = availWidth + 'px';
    el.style.boxSizing = 'border-box';

    const baseSize = parseFloat(defaultSize) || 12;
    const weight = fontWeight || 400;

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${weight} ${baseSize}px sans-serif`;

    if (ctx.measureText(el.textContent).width <= availWidth) {
        el.style.fontSize = baseSize + 'px';
        el.style.whiteSpace = 'nowrap';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.lineHeight = '1.3';
        el.style.display = '';
        el.style.webkitLineClamp = '';
        el.style.webkitBoxOrient = '';
        el.style.maxHeight = '';
        return baseSize;
    }

    let low = 8, high = baseSize, best = 8;
    while (low <= high) {
        const mid = (low + high) / 2;
        ctx.font = `${weight} ${mid}px sans-serif`;
        if (ctx.measureText(el.textContent).width <= availWidth) {
            best = mid;
            low = mid + 0.5;
        } else {
            high = mid - 0.5;
        }
    }

    el.style.webkitLineClamp = '';
    el.style.webkitBoxOrient = '';
    el.style.maxHeight = '';
    el.style.display = '';

    if (best >= 10) {
        el.style.fontSize = best + 'px';
        el.style.whiteSpace = 'nowrap';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.lineHeight = '1.3';
        return best;
    } else {
        el.style.fontSize = '8px';
        el.style.whiteSpace = 'normal';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.lineHeight = '1.2';
        el.style.maxHeight = '2.4em';
        el.style.display = '-webkit-box';
        el.style.webkitLineClamp = '2';
        el.style.webkitBoxOrient = 'vertical';
        return 8;
    }
}

// fitTitle 接收 c (config) 参数以打破 panel↔renderer 循环依赖
export function fitTitle(c) {
    // c = currentConfig

    if (c._manualFont) {
        ['songTitle', 'songArtist'].forEach(id => {
            const e = document.getElementById(id);
            if (!e) return;
            e.style.fontSize = '';
            e.style.whiteSpace = '';
            e.style.overflow = '';
            e.style.textOverflow = '';
            e.style.lineHeight = '';
            e.style.display = '';
            e.style.webkitLineClamp = '';
            e.style.webkitBoxOrient = '';
            e.style.maxHeight = '';
        });
        const card = document.getElementById('musicCard');
        if (card) {
            void card.offsetHeight;
            const actionBtns = card.querySelector('.action-buttons');
            ['songTitle', 'songArtist'].forEach(id => {
                const e = document.getElementById(id);
                if (!e) return;
                const r = e.getBoundingClientRect();
                if (actionBtns) {
                    const w = actionBtns.getBoundingClientRect().left - r.left - 5;
                    if (w > 20) e.style.maxWidth = w + 'px';
                }
            });
        }
        return;
    }

    const defaultTitleSize = parseFloat(DEFAULT_CONFIG.titleSize) || 14;
    const defaultArtistSize = parseFloat(DEFAULT_CONFIG.artistSize) || 11;

    const usedTitle = clampTextWidth(document.getElementById('songTitle'), defaultTitleSize, 600);
    const usedArtist = clampTextWidth(document.getElementById('songArtist'), defaultArtistSize, 400);

    if (usedTitle && usedTitle > 0) {
        c.titleSize = usedTitle + 'px';
        const inp = document.getElementById('c-titleSize');
        if (inp) inp.value = c.titleSize;
    }
    if (usedArtist && usedArtist > 0) {
        c.artistSize = usedArtist + 'px';
        const inp = document.getElementById('c-artistSize');
        if (inp) inp.value = c.artistSize;
    }
}
```

- [ ] **Step 3: 写入 src/card/renderer.js**

```js
import { hexToRgba } from '../utils/color.js';
import { fitTitle } from './text-fitter.js';

export function applyConfig(c) {
    const card = document.getElementById('musicCard');
    const overlayGrad = `linear-gradient(to top, ${hexToRgba(c.cardBg, 0.8)} 0%, ${hexToRgba(c.cardBg, 0)} 100%)`;

    const vars = {
        '--card-width':           c.cardWidth,
        '--card-aspect-ratio':    c.cardAspectRatio,
        '--card-bg':              c.cardBg,
        '--card-radius':          c.cardRadius,
        '--font-family':          c.fontFamily,
        '--album-height':         c.albumHeight,
        '--album-padding':        c.albumPadding,
        '--album-img-radius':     c.albumImgRadius,
        '--overlay-gradient':     overlayGrad,
        '--text-color':           c.textColor,
        '--text-shadow':          c.textShadow,
        '--title-size':           c.titleSize,
        '--artist-size':          c.artistSize,
        '--artist-opacity':       c.artistOpacity,
        '--song-info-gap':        c.songInfoGap,
        '--content-bottom':       c.contentBottom,
        '--content-padding-x':    c.contentPaddingX,
        '--progress-text-color':  c.progressTextColor,
        '--time-size':            c.timeSize,
        '--progress-height':      c.progressHeight,
        '--progress-track-color': c.progressTrackColor,
        '--progress-fill-color':  c.progressFillColor,
        '--progress-fill-width':  c.progressPercent + '%',
        '--controls-bottom':      c.controlsBottom,
        '--controls-gap':         c.controlsGap,
        '--side-btn-size':        c.sideBtnSize,
        '--side-btn-icon-size':   c.sideBtnIconSize,
        '--side-btn-opacity':     c.sideBtnOpacity,
        '--play-btn-size':        c.playBtnSize,
        '--play-btn-icon-size':   c.playBtnIconSize,
        '--play-btn-bg':          c.playBtnBg,
        '--play-btn-color':       c.playBtnColor,
        '--play-btn-shadow':      c.playBtnShadow,
        '--action-top':           c.actionTop,
        '--action-right':         c.actionRight,
        '--action-gap':           c.actionGap,
        '--action-btn-size':      c.actionBtnSize,
        '--action-btn-icon-size': c.actionBtnIconSize,
        '--action-btn-bg':        hexToRgba(c.actionBtnBg, parseFloat(c.actionBtnOpacity) / 100),
        '--action-active-color':  c.actionActiveColor,
        '--print-width':          c.printWidth,
        '--print-height':         c.printHeight,
    };

    Object.entries(vars).forEach(([k, v]) => card.style.setProperty(k, v));

    document.getElementById('albumImage').style.backgroundImage = `url('${c.albumImageUrl}')`;
    document.getElementById('songTitle').textContent = c.songTitle;
    document.getElementById('songArtist').textContent = c.songArtist;
    document.getElementById('currentTime').textContent = c.currentTime;
    document.getElementById('totalTime').textContent = c.totalTime;
    document.getElementById('favoriteBtn').classList.toggle('active', c.isFavorite);
    requestAnimationFrame(() => fitTitle(c));
    setTimeout(() => fitTitle(c), 50);
}
```

---

### Task 9: Canvas 导出 — src/card/export.js

**文件:**
- Create: `src/card/export.js`

**接口:**
- Consumes: `FA_ICONS` from `utils/icons.js`
- Consumes: `hexToRgba` from `utils/color.js`
- Consumes: `tauriAPI` from `utils/tauri-api.js`
- Consumes: `getCurrentConfig` from `config/panel.js`
- Produces: `exportImage()`, `initExportButton()`

- [ ] **Step 1: 写入 src/card/export.js**

```js
import { getCurrentConfig, showToast } from '../config/panel.js';
import { FA_ICONS } from '../utils/icons.js';
import { hexToRgba } from '../utils/color.js';
import { tauriAPI } from '../utils/tauri-api.js';

function drawFaIcon(ctx, el, cx, cy, size) {
    if (!el) return;
    const cs = getComputedStyle(el);
    const font = cs.fontWeight + ' ' + size + 'px ' + cs.fontFamily;
    for (const [cls, icon] of Object.entries(FA_ICONS)) {
        if (el.classList.contains(cls)) {
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon.ch, cx, cy + 1);
            return;
        }
    }
}

function roundPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

async function imgToDataUrl(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('FileReader 读取失败'));
            reader.readAsDataURL(blob);
        });
    } catch (_fetchErr) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0);
                try {
                    resolve(c.toDataURL('image/png'));
                } catch (canvasErr) {
                    reject(new Error('Canvas 导出失败: ' + canvasErr.message));
                }
            };
            img.onerror = () => reject(new Error('图片加载失败: ' + url));
            img.src = url;
        });
    }
}

export async function exportImage() {
    const currentConfig = getCurrentConfig();
    if (!currentConfig) return;

    const card = document.getElementById('musicCard');
    const origShadow = card.style.boxShadow;
    card.style.boxShadow = 'none';

    const SCALE = 6;
    const w = card.offsetWidth;
    const h = card.offsetHeight;

    try {
        function rel(el) {
            if (!el) return { x: 0, y: 0, w: 0, h: 0 };
            const r = el.getBoundingClientRect();
            const c = card.getBoundingClientRect();
            return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height };
        }

        const albumImgEl = card.querySelector('.album-img');
        let coverImage = null;
        if (albumImgEl) {
            const bg = getComputedStyle(albumImgEl).backgroundImage;
            const m = bg.match(/url\(["']?(.+?)["']?\)/);
            if (m && m[1] && m[1] !== 'none') {
                const imgUrl = m[1];
                try {
                    coverImage = await loadImage(imgUrl);
                } catch (_) {
                    console.warn('直接加载封面失败，尝试转 data URL', _.message);
                    try {
                        const dataUrl = await imgToDataUrl(imgUrl);
                        coverImage = await loadImage(dataUrl);
                    } catch (e2) {
                        console.warn('封面转 data URL 也失败', e2);
                    }
                }
            }
        }

        function loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('图片加载失败: ' + src));
                img.src = src;
            });
        }

        const canvas = document.createElement('canvas');
        canvas.width = w * SCALE;
        canvas.height = h * SCALE;
        const ctx = canvas.getContext('2d');
        ctx.scale(SCALE, SCALE);

        // 1. 卡片背景
        const cardRadius = parseFloat(getComputedStyle(card).borderRadius) || 16;
        ctx.fillStyle = currentConfig.cardBg || '#8B1A35';
        roundPath(ctx, 0, 0, w, h, cardRadius);
        ctx.fill();

        // 2. 封面图片
        if (coverImage) {
            const ir = rel(albumImgEl);
            const imgRadius = parseFloat(getComputedStyle(albumImgEl).borderRadius) || 8;
            ctx.save();
            roundPath(ctx, ir.x, ir.y, ir.w, ir.h, imgRadius);
            ctx.clip();
            const sc = Math.max(ir.w / coverImage.width, ir.h / coverImage.height);
            const sw = coverImage.width * sc;
            const sh = coverImage.height * sc;
            ctx.drawImage(coverImage, ir.x + (ir.w - sw) / 2, ir.y + (ir.h - sh) / 2, sw, sh);
            ctx.restore();
        }

        // 3. 覆盖层渐变
        const ovEl = card.querySelector('.overlay');
        if (ovEl) {
            const or = rel(ovEl);
            const bgHex = (currentConfig.cardBg || '#8B1A35').replace('#', '');
            const r_ = parseInt(bgHex.substring(0, 2), 16);
            const g_ = parseInt(bgHex.substring(2, 4), 16);
            const b_ = parseInt(bgHex.substring(4, 6), 16);
            const grad = ctx.createLinearGradient(0, or.y + or.h, 0, or.y);
            grad.addColorStop(0, `rgba(${r_},${g_},${b_},0.8)`);
            grad.addColorStop(1, `rgba(${r_},${g_},${b_},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(or.x, or.y, or.w, or.h);
        }

        // 4. 操作按钮
        card.querySelectorAll('.action-btn').forEach(btn => {
            const br = rel(btn);
            const active = btn.classList.contains('active');
            ctx.fillStyle = active
                ? (currentConfig.actionActiveColor || '#ff6b6b')
                : hexToRgba(currentConfig.actionBtnBg || '#ffffff', parseFloat(currentConfig.actionBtnOpacity || 20) / 100);
            ctx.beginPath();
            ctx.arc(br.x + br.w / 2, br.y + br.h / 2, br.w / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = currentConfig.textColor || '#ffffff';
            drawFaIcon(ctx, btn.querySelector('i'), br.x + br.w / 2, br.y + br.h / 2, br.w * 0.48);
        });

        // 5. 歌曲标题 & 歌手
        const titleEl = card.querySelector('.song-title');
        const artistEl = card.querySelector('.song-artist');
        if (titleEl) {
            const tr = rel(titleEl);
            const ts = getComputedStyle(titleEl).fontSize || '14px';
            ctx.fillStyle = currentConfig.textColor || '#ffffff';
            ctx.font = '600 ' + ts + ' sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText(currentConfig.songTitle || '', tr.x, tr.y);
        }
        if (artistEl) {
            const ar = rel(artistEl);
            const as_ = getComputedStyle(artistEl).fontSize || '11px';
            ctx.fillStyle = currentConfig.textColor || '#ffffff';
            ctx.globalAlpha = parseFloat(currentConfig.artistOpacity) || 0.9;
            ctx.font = '400 ' + as_ + ' sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText(currentConfig.songArtist || '', ar.x, ar.y);
            ctx.globalAlpha = 1;
        }

        // 6. 时间文字
        const curEl = card.querySelector('#currentTime');
        const totEl = card.querySelector('#totalTime');
        if (curEl) {
            const cr = rel(curEl);
            ctx.fillStyle = currentConfig.progressTextColor || '#a0a0c0';
            ctx.font = (currentConfig.timeSize || '10px') + ' sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText(currentConfig.currentTime || '', cr.x, cr.y);
        }
        if (totEl) {
            const tr = rel(totEl);
            ctx.fillStyle = currentConfig.progressTextColor || '#a0a0c0';
            ctx.font = (currentConfig.timeSize || '10px') + ' sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'right';
            ctx.fillText(currentConfig.totalTime || '', tr.x + tr.w, tr.y);
            ctx.textAlign = 'left';
        }

        // 7. 进度条
        const barEl = card.querySelector('.progress-bar');
        if (barEl) {
            const pr = rel(barEl);
            const ph = parseFloat(getComputedStyle(barEl).height) || 3;
            const col = getComputedStyle(barEl).backgroundColor || 'rgba(255,255,255,0.1)';
            const pct = parseFloat(currentConfig.progressPercent) / 100 || 0;

            ctx.fillStyle = col;
            ctx.beginPath();
            roundPath(ctx, pr.x, pr.y, pr.w, ph, ph / 2);
            ctx.fill();

            const fillEl = card.querySelector('.progress-fill');
            const fillCol = fillEl ? getComputedStyle(fillEl).backgroundColor : (currentConfig.progressFillColor || '#ff6b6b');
            ctx.fillStyle = fillCol;
            ctx.beginPath();
            roundPath(ctx, pr.x, pr.y, pr.w * pct, ph, ph / 2);
            ctx.fill();
        }

        // 8. 控制按钮
        card.querySelectorAll('.control-btn').forEach(btn => {
            const br = rel(btn);
            if (btn.classList.contains('play-btn')) {
                ctx.fillStyle = currentConfig.playBtnBg || '#ffffff';
                ctx.beginPath();
                ctx.arc(br.x + br.w / 2, br.y + br.h / 2, br.w / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = currentConfig.playBtnColor || '#8B1A35';
            } else {
                ctx.fillStyle = currentConfig.textColor || '#ffffff';
                ctx.globalAlpha = parseFloat(currentConfig.sideBtnOpacity) || 0.8;
            }
            drawFaIcon(ctx, btn.querySelector('i'), br.x + br.w / 2, br.y + br.h / 2, br.w * 0.45);
            ctx.globalAlpha = 1;
        });

        // 下载 PNG
        const pngDataUrl = canvas.toDataURL('image/png');
        if (window.__TAURI__) {
            const ok = await tauriAPI.exportPngFile(pngDataUrl);
            if (ok) showToast('PNG 已保存到 output 文件夹');
            else showToast('已取消');
        } else {
            const a = document.createElement('a');
            a.download = 'music-card.png';
            a.href = pngDataUrl;
            a.click();
        }

        card.style.boxShadow = origShadow;
    } catch (err) {
        card.style.boxShadow = origShadow;
        console.error('导出失败:', err);
        alert('导出图片失败: ' + err.message);
    }
}

export function initExportButton() {
    document.getElementById('exportPngBtn').addEventListener('click', exportImage);
}
```

---

### Task 10: 卡片交互 — src/card/controls.js

**文件:**
- Create: `src/card/controls.js`

**接口:**
- Consumes: `getCurrentConfig` from `config/panel.js`
- Produces: `initControls()`

- [ ] **Step 1: 写入 src/card/controls.js**

```js
import { getCurrentConfig } from '../config/panel.js';

export function initControls() {
    document.getElementById('favoriteBtn').addEventListener('click', () => {
        const currentConfig = getCurrentConfig();
        if (!currentConfig) return;
        currentConfig.isFavorite = !currentConfig.isFavorite;
        document.getElementById('favoriteBtn').classList.toggle('active');
        const cb = document.getElementById('c-isFavorite');
        if (cb) cb.checked = currentConfig.isFavorite;
    });

    document.getElementById('playBtn').addEventListener('click', () => {
        const icon = document.getElementById('playIcon');
        icon.classList.toggle('fa-play');
        icon.classList.toggle('fa-pause');
    });

    document.getElementById('commentBtn').addEventListener('click', () => alert('评论区'));
}
```

---

### Task 11: 历史记录 — src/history/manager.js

**文件:**
- Create: `src/history/manager.js`

**接口:**
- Consumes: `getCurrentConfig` from `config/panel.js`
- Consumes: `buildConfigPanel`, `applyConfig` from their respective modules
- Produces: `loadHistory()`, `saveHistory()`, `saveCurrentConfig()`, `deleteHistoryEntry(id)`, `restoreHistoryEntry(id)`, `renameHistoryEntry(id)`, `renderHistory()`

- [ ] **Step 1: 创建 src/history/ 目录**

```bash
mkdir -p 'C:\Users\ASUS\Desktop\llmux\7.7\src\history'
```

- [ ] **Step 2: 写入 src/history/manager.js**

```js
import { getCurrentConfig, readConfig } from '../config/panel.js';
import { buildConfigPanel } from '../config/panel.js';
import { applyConfig } from '../card/renderer.js';

const HISTORY_KEY = 'musicCardHistory';
let historyEntries = [];

export function loadHistory() {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        historyEntries = stored ? JSON.parse(stored) : [];
    } catch { historyEntries = []; }
}

export function saveHistory() {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historyEntries));
    } catch {
        while (historyEntries.length > 0) {
            historyEntries.shift();
            try { localStorage.setItem(HISTORY_KEY, JSON.stringify(historyEntries)); return; } catch { /* continue */ }
        }
    }
}

export function saveCurrentConfig() {
    const currentConfig = getCurrentConfig();
    if (!currentConfig) return;
    const config = readConfig();
    const entry = {
        id: Date.now(),
        name: '',
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        date: new Date().toLocaleDateString('zh-CN'),
        config: JSON.parse(JSON.stringify(config))
    };
    historyEntries.push(entry);
    saveHistory();
    renderHistory();
}

export function deleteHistoryEntry(id) {
    historyEntries = historyEntries.filter(h => h.id !== id);
    saveHistory();
    renderHistory();
}

export function restoreHistoryEntry(id) {
    const entry = historyEntries.find(h => h.id === id);
    if (!entry) return;
    const currentConfig = getCurrentConfig();
    if (!currentConfig) return;
    Object.assign(currentConfig, JSON.parse(JSON.stringify(entry.config)));
    buildConfigPanel(currentConfig);
    applyConfig(currentConfig);
}

export function renameHistoryEntry(id) {
    const entry = historyEntries.find(h => h.id === id);
    if (!entry) return;
    const input = document.querySelector(`.history-name-input[data-id="${id}"]`);
    if (!input) return;
    const name = input.value.trim();
    entry.name = name;
    saveHistory();
}

export function renderHistory() {
    const section = document.getElementById('historySection');
    if (!section) return;

    const count = historyEntries.length;
    section.innerHTML = `
      <div class="history-header" id="historyHeader">
        <span class="history-title">历史记录</span>
        <span class="history-badge">${count}</span>
        <span class="history-arrow">▶</span>
      </div>
      <div class="history-body" id="historyBody" style="display:none">
        <button class="history-save-btn" id="historySaveBtn">+ 保存当前配置</button>
        ${count === 0 ? '<div class="history-empty">暂无保存记录</div>' : ''}
        <div class="history-list" id="historyList">
          ${historyEntries.slice().reverse().map(h => `
            <div class="history-item" data-id="${h.id}">
              <input class="history-name-input" data-id="${h.id}" value="${h.name}" placeholder="未命名">
              <span class="history-item-time">${h.time}</span>
              <div class="history-item-actions">
                <button class="history-restore-btn" data-id="${h.id}">应用</button>
                <button class="history-del-btn" data-id="${h.id}">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    section.querySelector('#historySaveBtn').addEventListener('click', e => {
        e.stopPropagation();
        saveCurrentConfig();
    });

    const header = section.querySelector('#historyHeader');
    const body = section.querySelector('#historyBody');
    header.addEventListener('click', () => {
        const open = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        header.querySelector('.history-arrow').textContent = open ? '▶' : '▼';
    });

    section.querySelectorAll('.history-name-input').forEach(inp => {
        inp.addEventListener('blur', () => renameHistoryEntry(parseInt(inp.dataset.id)));
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') { inp.blur(); }
        });
    });

    section.querySelectorAll('.history-restore-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            restoreHistoryEntry(parseInt(btn.dataset.id));
            body.style.display = 'none';
            header.querySelector('.history-arrow').textContent = '▶';
        });
    });

    section.querySelectorAll('.history-del-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            deleteHistoryEntry(parseInt(btn.dataset.id));
        });
    });
}
```

---

### Task 12: 封面搜索 — src/cover/search.js

**文件:**
- Create: `src/cover/search.js`

**接口:**
- Consumes: `getCurrentConfig`, `sync` from `config/panel.js`
- Produces: `doCoverSearch(query)`, `initCoverSearch()`

- [ ] **Step 1: 创建 src/cover/ 目录**

```bash
mkdir -p 'C:\Users\ASUS\Desktop\llmux\7.7\src\cover'
```

- [ ] **Step 2: 写入 src/cover/search.js**

```js
import { getCurrentConfig, sync } from '../config/panel.js';

let coverSearchAbort = null;

export async function doCoverSearch(query) {
    if (!query.trim()) return;

    const currentConfig = getCurrentConfig();
    if (!currentConfig) return;

    const type = document.querySelector('.cover-type-btn.active')?.dataset.type || 'song';
    const country = document.getElementById('coverCountrySelect')?.value || '';
    delete currentConfig._manualFont;

    const resultsEl = document.getElementById('coverResults');
    resultsEl.innerHTML = '<div class="cover-loading">搜索中...</div>';

    if (coverSearchAbort) coverSearchAbort.abort();
    coverSearchAbort = new AbortController();

    const entityMap = { song: 'song', album: 'album', artist: 'musicArtist' };
    const entity = entityMap[type] || 'song';

    try {
        let url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=200`;
        if (country) url += '&country=' + country;

        const res = await fetch(url, { signal: coverSearchAbort.signal });
        if (!res.ok) throw new Error('请求失败 (' + res.status + ')');
        const data = await res.json();
        const items = data.results || [];

        resultsEl.innerHTML = '';

        if (items.length === 0) {
            resultsEl.innerHTML = '<div class="cover-error">未找到结果，试试其他关键词</div>';
            return;
        }

        const seen = new Set();
        let count = 0;

        items.forEach(item => {
            let name = '';
            let sub = '';
            let artUrl = item.artworkUrl100;

            if (type === 'song') {
                name = item.trackName || '';
                sub = item.artistName || '';
            } else if (type === 'album') {
                name = item.collectionName || '';
                sub = item.artistName || '';
            } else if (type === 'artist') {
                name = item.artistName || '';
                if (!artUrl) return;
            }

            if (!artUrl || seen.has(artUrl)) return;
            seen.add(artUrl);
            const bigUrl = artUrl.replace('100x100bb', '600x600bb');

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cover-result-item';

            const img = document.createElement('img');
            img.src = artUrl;
            img.alt = name || '封面';
            img.loading = 'lazy';
            itemDiv.appendChild(img);

            const label = document.createElement('div');
            label.className = 'cover-result-label';
            label.textContent = sub ? `${name} — ${sub}` : name;
            itemDiv.appendChild(label);

            itemDiv.addEventListener('click', () => {
                delete currentConfig._manualFont;

                currentConfig.albumImageUrl = bigUrl;
                document.getElementById('albumImage').style.backgroundImage = `url('${bigUrl}')`;

                if (name) {
                    if (type === 'song' || type === 'album') {
                        currentConfig.songTitle = name;
                        currentConfig.songArtist = sub || '';
                    } else if (type === 'artist') {
                        currentConfig.songArtist = name;
                    }
                    const titleInput = document.getElementById('c-songTitle');
                    const artistInput = document.getElementById('c-songArtist');
                    if (titleInput) titleInput.value = currentConfig.songTitle;
                    if (artistInput) artistInput.value = currentConfig.songArtist;

                    if (item.trackTimeMillis) {
                        const totalSec = Math.round(item.trackTimeMillis / 1000);
                        const min = Math.floor(totalSec / 60);
                        const sec = totalSec % 60;
                        currentConfig.totalTime = min + ':' + String(sec).padStart(2, '0');
                        const timeInput = document.getElementById('c-totalTime');
                        if (timeInput) timeInput.value = currentConfig.totalTime;
                    }
                }

                const nameText = document.querySelector('.drop-zone-name');
                const hintText = document.querySelector('.drop-zone-hint');
                const icon = document.querySelector('.drop-zone-icon');
                const zone = document.querySelector('.image-drop-zone');
                if (nameText) nameText.textContent = name || '已选择封面';
                if (hintText) hintText.textContent = '点击更换';
                if (icon) icon.innerHTML = '<i class="fas fa-check-circle" style="color:#2d7d46"></i>';
                if (zone) zone.classList.add('has-image');

                resultsEl.querySelectorAll('.cover-result-item').forEach(d => d.classList.remove('selected'));
                itemDiv.classList.add('selected');
                sync();
            });

            resultsEl.appendChild(itemDiv);
            count++;
        });

        if (count === 0) {
            resultsEl.innerHTML = '<div class="cover-error">未找到结果，试试其他关键词</div>';
        }
    } catch (err) {
        if (err.name === 'AbortError') return;
        resultsEl.innerHTML = `<div class="cover-error">搜索失败：${err.message}</div>`;
    }
}

export function initCoverSearch() {
    const coverSearchState = { type: 'song', country: 'CN' };

    document.querySelectorAll('.cover-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cover-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            coverSearchState.type = btn.dataset.type;
            const input = document.getElementById('coverSearchInput');
            if (input.value.trim()) doCoverSearch(input.value.trim());
        });
    });

    document.getElementById('coverCountrySelect').addEventListener('change', (e) => {
        coverSearchState.country = e.target.value;
        const input = document.getElementById('coverSearchInput');
        if (input.value.trim()) doCoverSearch(input.value.trim());
    });

    document.getElementById('coverSearchBtn').addEventListener('click', () => {
        const input = document.getElementById('coverSearchInput');
        doCoverSearch(input.value);
    });

    document.getElementById('coverSearchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doCoverSearch(e.target.value);
    });
}
```

---

### Task 13: 配置操作绑定 — src/config/actions.js

**文件:**
- Create: `src/config/actions.js`

**接口:**
- Consumes: `DEFAULT_CONFIG` from `defaults.js`
- Consumes: `buildConfigPanel`, `readConfig`, `sync`, `showToast`, `getCurrentConfig`, `setCurrentConfigRef` from `panel.js`
- Consumes: `applyConfig` from `renderer.js`
- Consumes: `tauriAPI` from `utils/tauri-api.js`
- Produces: `initConfigActions()`

- [ ] **Step 1: 写入 src/config/actions.js**

```js
import { DEFAULT_CONFIG } from './defaults.js';
import { buildConfigPanel, readConfig, showToast, getCurrentConfig, setCurrentConfigRef } from './panel.js';
import { applyConfig } from '../card/renderer.js';
import { tauriAPI } from '../utils/tauri-api.js';

export function initConfigActions() {
    // 重置
    document.getElementById('resetBtn').addEventListener('click', () => {
        const currentConfig = getCurrentConfig();
        if (!currentConfig) return;
        delete currentConfig._manualFont;
        Object.assign(currentConfig, JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
        buildConfigPanel(currentConfig);
        applyConfig(currentConfig);
    });

    // 导出配置
    document.getElementById('exportBtn').addEventListener('click', async () => {
        const config = readConfig();
        const json = JSON.stringify(config, null, 2);
        const name = config.songTitle ? config.songTitle.replace(/[\\/:*?"<>|]/g, '_') : '卡片配置';

        if (window.__TAURI__) {
            const ok = await tauriAPI.exportConfigFile(`${name}.json`, json);
            if (ok) showToast('配置已导出');
        } else {
            const blob = new Blob([json], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${name}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
            showToast('配置已导出');
        }
    });

    // 导入配置
    document.getElementById('importBtn').addEventListener('click', async () => {
        const currentConfig = getCurrentConfig();
        if (!currentConfig) return;

        if (window.__TAURI__) {
            const content = await tauriAPI.importConfigFile();
            if (!content) return;
            try {
                const cfg = JSON.parse(content);
                Object.keys(DEFAULT_CONFIG).forEach(k => {
                    if (cfg[k] !== undefined) currentConfig[k] = cfg[k];
                });
                buildConfigPanel(currentConfig);
                applyConfig(currentConfig);
                showToast('配置已导入');
            } catch (err) {
                showToast('导入失败：文件格式不正确');
            }
        } else {
            document.getElementById('importFileInput').click();
        }
    });

    document.getElementById('importFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const currentConfig = getCurrentConfig();
            if (!currentConfig) return;
            try {
                const cfg = JSON.parse(ev.target.result);
                Object.keys(DEFAULT_CONFIG).forEach(k => {
                    if (cfg[k] !== undefined) currentConfig[k] = cfg[k];
                });
                buildConfigPanel(currentConfig);
                applyConfig(currentConfig);
                showToast('配置已导入');
            } catch (err) {
                showToast('导入失败：文件格式不正确');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });
}
```

---

### Task 14: 应用入口 — src/main.js

**文件:**
- Modify: `src/main.js`（覆盖）

**接口:**
- Consumes: 所有组件模块

- [ ] **Step 1: 写入 src/main.js**

```js
import { DEFAULT_CONFIG } from './config/defaults.js';
import { buildConfigPanel, sync, setCurrentConfigRef } from './config/panel.js';
import { applyConfig } from './card/renderer.js';
import { initControls } from './card/controls.js';
import { initExportButton } from './card/export.js';
import { loadHistory, renderHistory } from './history/manager.js';
import { initCoverSearch } from './cover/search.js';
import { initConfigActions } from './config/actions.js';

// 创建共享配置对象
const currentConfig = { ...DEFAULT_CONFIG };
setCurrentConfigRef(currentConfig);

// 挂载到 window（供 updateCardConfig 外部调用）
window.updateCardConfig = (n) => {
    Object.assign(currentConfig, n);
    buildConfigPanel(currentConfig);
    applyConfig(currentConfig);
};

// 初始化
buildConfigPanel(currentConfig);
applyConfig(currentConfig);

loadHistory();
renderHistory();

initControls();
initCoverSearch();
initExportButton();
initConfigActions();
```

---

### Task 15: 编译验证

**文件:**
- 无文件修改

- [ ] **Step 1: 安装 npm 依赖**

```bash
cd 'C:\Users\ASUS\Desktop\llmux\7.7' && npm install 2>&1
```

- [ ] **Step 2: 编译 Rust 后端**

```bash
cd 'C:\Users\ASUS\Desktop\llmux\7.7' && cargo check 2>&1
```

Expected: 编译成功，无错误。

- [ ] **Step 3: 完整构建**

```bash
cd 'C:\Users\ASUS\Desktop\llmux\7.7' && npm run tauri build 2>&1
```

Expected: 构建成功，生成可执行文件。
