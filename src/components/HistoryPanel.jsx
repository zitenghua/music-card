import { useState, useEffect } from 'react'
import { DEFAULT_CONFIG } from '../configData'

const HISTORY_KEY = 'musicCardHistory'

export default function HistoryPanel({ config, setConfig, historyEntries, setHistoryEntries, showToast, readFromDOM }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      setHistoryEntries(stored ? JSON.parse(stored) : [])
    } catch { setHistoryEntries([]) }
  }, [])

  const save = (entries) => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)) }
    catch {
      while (entries.length > 0) {
        entries.shift()
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)); return }
        catch { /* continue */ }
      }
    }
  }

  const saveCurrent = () => {
    const cfg = readFromDOM()
    const entry = {
      id: Date.now(), name: '', time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      date: new Date().toLocaleDateString('zh-CN'), config: JSON.parse(JSON.stringify(cfg))
    }
    const entries = [...historyEntries, entry]
    setHistoryEntries(entries)
    save(entries)
  }

  const del = (id) => {
    const entries = historyEntries.filter(h => h.id !== id)
    setHistoryEntries(entries)
    save(entries)
  }

  const restore = (id) => {
    const entry = historyEntries.find(h => h.id === id)
    if (!entry) return
    setConfig(prev => ({ ...prev, ...JSON.parse(JSON.stringify(entry.config)) }))
    setOpen(false)
  }

  const rename = (id, name) => {
    const entries = historyEntries.map(h => h.id === id ? { ...h, name } : h)
    setHistoryEntries(entries)
    save(entries)
  }

  return (
    <div className="history-section">
      <div className="history-header" onClick={() => setOpen(!open)}>
        <span className="history-title">历史记录</span>
        <span className="history-badge">{historyEntries.length}</span>
        <span className="history-arrow">{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div className="history-body">
          <button className="history-save-btn" onClick={saveCurrent}>+ 保存当前配置</button>
          {historyEntries.length === 0 && <div className="history-empty">暂无保存记录</div>}
          <div className="history-list">
            {[...historyEntries].reverse().map(h => (
              <div key={h.id} className="history-item" data-id={h.id}>
                <input className="history-name-input" defaultValue={h.name} placeholder="未命名"
                  onBlur={e => rename(h.id, e.target.value.trim())}
                  onKeyDown={e => e.key === 'Enter' && e.target.blur()} />
                <span className="history-item-time">{h.time}</span>
                <div className="history-item-actions">
                  <button className="history-restore-btn" onClick={() => restore(h.id)}>应用</button>
                  <button className="history-del-btn" onClick={() => del(h.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
