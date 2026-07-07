# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

音乐卡片配置工具 — 通过左侧配置面板实时调整样式参数，右侧预览，支持导出为 PNG 图片。

## Key Files

- `yue2.html` — HTML 结构（DOM），无内联样式或脚本
- `yue2.css` — 卡片 CSS 变量驱动样式 + 布局/配置面板样式
- `yue2.js` — 全部 JavaScript（配置、交互、Canvas 导出）

## Architecture

**数据流**: `DEFAULT_CONFIG` → `FIELD_META` 驱动 `buildConfigPanel()` 生成配置面板 → `sync()` → `readConfig()` → `applyConfig()` 写入 CSS 变量

### 配置系统

- `DEFAULT_CONFIG`: 所有可调参数的默认值
- `FIELD_META`: 字段元信息（标签、控件类型、范围），type 支持: color / text / range / checkbox
- `FIELD_SECTIONS`: 字段分组（颜色、尺寸、内容、状态、高级）
- `HIDDEN_FIELDS`: 在配置面板中隐藏的字段
- 所有配置通过 CSS 变量 (`--xxx`) 应用到卡片，无需手动更新 DOM

### Canvas 导出

`exportImage()` 在 Canvas 上直接逐层绘制卡片，不使用 SVG foreignObject：
1. 卡片背景（圆角矩形）
2. 封面图片（圆角裁剪，cover 缩放）
3. 覆盖层渐变
4. 操作按钮（Font Awesome 字体绘制）
5. 歌曲标题/歌手
6. 时间文字 + 进度条
7. 控制按钮（Font Awesome 字体绘制）

图标用 Font Awesome 6 的 Unicode 码点 + 计算后的 font-family 在 Canvas 上渲染。

### 辅助函数

- `hexToRgba(hex, a)` — hex 颜色转 rgba 字符串
- `imgToDataUrl(url)` — 图片转 data URL（fetch + FileReader，失败降级到 canvas）
- `drawFaIcon(ctx, el, cx, cy, size)` — 用 Font Awesome 字体绘制图标到 Canvas
- `roundPath(ctx, x, y, w, h, r)` — Canvas 圆角矩形路径
- `autoCalcTime(c)` — 根据 totalTime + progressPercent 自动计算 currentTime
