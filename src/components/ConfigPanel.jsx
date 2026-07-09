import { FIELD_SECTIONS, FIELD_META, HIDDEN_FIELDS, READONLY_FIELDS } from '../configData'
import { selectCoverFile } from '../api'

export default function ConfigPanel({ config, onChange }) {

  const handleInput = (key, meta) => (e) => {
    const val = meta.type === 'checkbox' ? e.target.checked : e.target.value
    const patch = { [key]: val }
    if ((key === 'titleSize' || key === 'artistSize') && meta.type === 'text') {
      patch._manualFont = true
    }
    onChange(patch)
  }

  const handleNumInput = (key, meta) => (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, '')
    const patch = { [key]: e.target.value + (meta.unit || '') }
    if ((key === 'titleSize' || key === 'artistSize')) {
      patch._manualFont = true
    }
    onChange(patch)
  }

  // 封面点击上传
  const handleImageClick = () => {
    if (window.__TAURI__) {
      selectCoverFile().then(result => {
        if (result && result.data_url) {
          onChange({ albumImageUrl: result.data_url, _coverFileName: result.file_name })
        }
      })
    } else {
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.accept = 'image/*'
      fileInput.onchange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => onChange({ albumImageUrl: ev.target.result, _coverFileName: file.name })
        reader.readAsDataURL(file)
      }
      fileInput.click()
    }
  }

  // 获取封面显示名称
  const getCoverName = (val) => {
    if (config._coverFileName) return config._coverFileName
    if (!val || val === 'none') return '点击或拖拽选择封面图片'
    return val.split('/').pop().split('\\').pop()
  }

  return (
    <div className="config-grid" id="configGrid">
      {FIELD_SECTIONS.flatMap(section => {
        const keys = section.keys.filter(k => !HIDDEN_FIELDS.has(k))
        if (!keys.length) return []
        return [
          <div key={`label-${section.title}`} className="section-label">{section.title}</div>,
          ...keys.map(key => {
            const meta = FIELD_META[key]
            const val = config[key] ?? ''
            const isReadonly = READONLY_FIELDS.has(key)
            const isWide = key === 'songTitle' || key === 'songArtist' || meta.type === 'image'
            return (
              <div key={key} className="config-group" style={isWide ? { gridColumn: '1 / -1' } : {}}>
                <label htmlFor={`c-${key}`}>{meta.label}</label>
                {meta.type === 'color' ? (
                  <input type="color" id={`c-${key}`} value={val} onInput={handleInput(key, meta)} />
                ) : meta.type === 'checkbox' ? (
                  <input type="checkbox" id={`c-${key}`} checked={!!val} onChange={handleInput(key, meta)} />
                ) : meta.type === 'range' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <input type="range" id={`c-${key}`} min={meta.min} max={meta.max} step={meta.step} value={val} onInput={handleInput(key, meta)} />
                    <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#666', marginLeft: '3px' }}>{val}</span>
                  </div>
                ) : meta.type === 'image' ? (
                  <div className="image-drop-zone" onClick={handleImageClick} style={{ cursor: 'pointer' }}>
                    <div className="drop-zone-icon"><i className="fas fa-image"></i></div>
                    <div className="drop-zone-texts">
                      <span className="drop-zone-name">{getCoverName(val)}</span>
                      <span className="drop-zone-hint">支持 PNG / JPG / WebP</span>
                    </div>
                  </div>
                ) : meta.unit ? (
                  <div className="config-unit-row">
                    <input type="text" id={`c-${key}`} value={val.replace(meta.unit, '')}
                      onInput={handleNumInput(key, meta)}
                      disabled={isReadonly}
                      inputMode="decimal" />
                    <span className="config-unit-badge">{meta.unit}</span>
                  </div>
                ) : (
                  <input type="text" id={`c-${key}`} value={val} onInput={handleInput(key, meta)} disabled={isReadonly} />
                )}
              </div>
            )
          })
        ]
      })}
    </div>
  )
}
