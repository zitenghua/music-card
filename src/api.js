import { invoke } from '@tauri-apps/api/core'

// Tauri 原生对话框 — 选封面
export async function selectCoverFile() {
  return await invoke('select_cover_file')
}

// Tauri 原生对话框 — 导出配置
export async function exportConfigFile(fileName, content) {
  return await invoke('export_config_file', { fileName, content })
}

// Tauri 原生对话框 — 导入配置
export async function importConfigFile() {
  return await invoke('import_config_file')
}

// Tauri 原生对话框 — 导出 PNG
export async function exportPngFile(dataUrl, fileName) {
  return await invoke('export_png_file', { dataUrl, fileName })
}
