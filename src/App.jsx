import { useState, useCallback, useRef, useEffect } from 'react'
import { DEFAULT_CONFIG, FIELD_META } from './configData'
import { hexToRgba } from './utils/color'
import { exportConfigFile, importConfigFile, exportPngFile } from './api'
import { fitTitle } from './utils/textFitter'
import { exportImage as canvasExport } from './utils/exportImage'
import ConfigPanel from './components/ConfigPanel'
import CardPreview from './components/CardPreview'
import CoverSearch from './components/CoverSearch'
import HistoryPanel from './components/HistoryPanel'
import ConfigActions from './components/ConfigActions'

export default function App() {
  const [config, setConfig] = useState(() => ({ ...DEFAULT_CONFIG }))
  const [historyEntries, setHistoryEntries] = useState([])
  const configRef = useRef(config)
  configRef.current = config

  // 深色模式同步
  useEffect(() => {
    document.body.classList.toggle('dark', !!config.darkMode)
  }, [config.darkMode])

  // 自动计算当前时间：totalTime 或 progressPercent 变化时重算
  useEffect(() => {
    setConfig(prev => {
      const m = prev.totalTime.match(/^(\d+):(\d+)$/)
      if (!m) return prev
      const totalSec = parseInt(m[1]) * 60 + parseInt(m[2])
      const curSec = Math.round(totalSec * (parseFloat(prev.progressPercent) / 100))
      const newTime = Math.floor(curSec / 60) + ':' + String(curSec % 60).padStart(2, '0')
      if (prev.currentTime === newTime) return prev
      return { ...prev, currentTime: newTime }
    })
  }, [config.totalTime, config.progressPercent])

  const updateConfig = useCallback((patch) => {
    setConfig(prev => ({ ...prev, ...patch }))
  }, [])

  const readFromDOM = useCallback(() => {
    const cfg = {}
    Object.keys(FIELD_META).forEach(key => {
      if (FIELD_META[key].type === 'image') return
      const el = document.getElementById(`c-${key}`)
      if (!el) return
      cfg[key] = FIELD_META[key].type === 'checkbox' ? el.checked : el.value
      const unit = FIELD_META[key].unit
      if (unit && typeof cfg[key] === 'string' && !cfg[key].endsWith(unit) && cfg[key] !== '') {
        cfg[key] = cfg[key] + unit
      }
    })
    Object.keys(DEFAULT_CONFIG).forEach(k => {
      if (!(k in cfg)) cfg[k] = configRef.current[k] ?? DEFAULT_CONFIG[k]
    })
    return cfg
  }, [])

  const showToast = useCallback((msg) => {
    let t = document.getElementById('toastMsg')
    if (!t) {
      t = document.createElement('div')
      t.id = 'toastMsg'
      t.className = 'toast'
      document.body.appendChild(t)
    }
    t.textContent = msg
    t.classList.add('show')
    clearTimeout(t._hide)
    t._hide = setTimeout(() => t.classList.remove('show'), 2000)
  }, [])

  const handleExport = useCallback(async () => {
    const cfg = readFromDOM()
    const json = JSON.stringify(cfg, null, 2)
    const name = cfg.songTitle ? cfg.songTitle.replace(/[\\/:*?"<>|]/g, '_') : '卡片配置'
    if (window.__TAURI__) {
      const ok = await exportConfigFile(`${name}.json`, json)
      if (ok) showToast('配置已导出')
    } else {
      const blob = new Blob([json], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${name}.json`
      a.click()
      URL.revokeObjectURL(a.href)
      showToast('配置已导出')
    }
  }, [readFromDOM, showToast])

  const handleImport = useCallback(async () => {
    const c = configRef.current
    if (window.__TAURI__) {
      const content = await importConfigFile()
      if (!content) return
      try {
        const cfg = JSON.parse(content)
        setConfig(prev => {
          const next = { ...prev }
          Object.keys(DEFAULT_CONFIG).forEach(k => {
            if (cfg[k] !== undefined) next[k] = cfg[k]
          })
          return next
        })
        showToast('配置已导入')
      } catch { showToast('导入失败：文件格式不正确') }
    } else {
      document.getElementById('importFileInput').click()
    }
  }, [showToast])

  const handleImportFile = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const cfg = JSON.parse(ev.target.result)
        setConfig(prev => {
          const next = { ...prev }
          Object.keys(DEFAULT_CONFIG).forEach(k => {
            if (cfg[k] !== undefined) next[k] = cfg[k]
          })
          return next
        })
        showToast('配置已导入')
      } catch { showToast('导入失败：文件格式不正确') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [showToast])

  const handleReset = useCallback(() => {
    const c = configRef.current
    delete c._manualFont
    setConfig({ ...DEFAULT_CONFIG })
  }, [])

  const handleExportPng = useCallback(async () => {
    const c = configRef.current
    const dataUrl = await canvasExport(c)
    if (!dataUrl) return
    const safeName = (c.songTitle || 'music-card').replace(/[\\/:*?"<>|]/g, '_')
    const safeArtist = (c.songArtist || '').replace(/[\\/:*?"<>|]/g, '_')
    const pngFileName = safeArtist ? `${safeName}-${safeArtist}.png` : `${safeName}.png`
    if (window.__TAURI__) {
      const ok = await exportPngFile(dataUrl, pngFileName)
      if (ok) showToast('PNG 已保存')
      else showToast('已取消')
    } else {
      const a = document.createElement('a')
      a.download = pngFileName
      a.href = dataUrl
      a.click()
    }
  }, [showToast])

  return (
    <div className="app-container">
      <div className="config-panel">
        <div className="config-scroll">
          <div className="config-header">
            <h3>卡片配置</h3>
            <div className="sub">调整参数 · 实时预览</div>
          </div>

          <HistoryPanel
            config={config}
            setConfig={setConfig}
            historyEntries={historyEntries}
            setHistoryEntries={setHistoryEntries}
            showToast={showToast}
            readFromDOM={readFromDOM}
          />

          <ConfigPanel
            config={config}
            onChange={updateConfig}
          />
        </div>

        <ConfigActions
          onReset={handleReset}
          onExport={handleExport}
          onImport={handleImport}
          onExportPng={handleExportPng}
        />

        <input type="file" id="importFileInput" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
      </div>

      <div className="right-panel">
        <CardPreview config={config} />
        <CoverSearch config={config} setConfig={setConfig} showToast={showToast} />
      </div>
    </div>
  )
}
