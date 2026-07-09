import { useState, useRef } from 'react'

export default function CoverSearch({ config, setConfig, showToast }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('song')
  const [country, setCountry] = useState('CN')
  const abortRef = useRef(null)

  const doSearch = async (query) => {
    if (!query.trim()) return
    setConfig(prev => { const n = { ...prev }; delete n._manualFont; return n })
    setLoading(true)
    if (abortRef.current) abortRef.current.abort()
    const abort = new AbortController()
    abortRef.current = abort
    const entityMap = { song: 'song', album: 'album', artist: 'musicArtist' }
    try {
      let url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entityMap[type] || 'song'}&limit=200`
      if (country) url += '&country=' + country
      const res = await fetch(url, { signal: abort.signal })
      if (!res.ok) throw new Error('请求失败 (' + res.status + ')')
      const data = await res.json()
      const items = (data.results || []).filter((item, idx, arr) => {
        if (!item.artworkUrl100) return false
        return arr.findIndex(i => i.artworkUrl100 === item.artworkUrl100) === idx
      })
      setResults(items)
    } catch (err) {
      if (err.name === 'AbortError') return
      setResults([])
      showToast('搜索失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectItem = (item) => {
    const bigUrl = item.artworkUrl100.replace('100x100bb', '600x600bb')
    const name = item.trackName || item.collectionName || item.artistName || ''
    const sub = item.artistName || ''
    const patch = { albumImageUrl: bigUrl, _noAutoFont: undefined }
    if (type === 'song' || type === 'album') {
      patch.songTitle = name
      patch.songArtist = sub
    } else if (type === 'artist') {
      patch.songArtist = name
    }
    if (item.trackTimeMillis) {
      const totalSec = Math.round(item.trackTimeMillis / 1000)
      patch.totalTime = Math.floor(totalSec / 60) + ':' + String(totalSec % 60).padStart(2, '0')
    }
    setConfig(prev => ({ ...prev, ...patch, _manualFont: undefined }))
  }

  return (
    <div className="cover-browser" id="coverBrowser">
      <span className="right-section-label">封面搜索</span>
      <div className="cover-search-bar">
        <div className="cover-search-types">
          {['song', 'album', 'artist'].map(t => (
            <button key={t} className={`cover-type-btn${type === t ? ' active' : ''}`} data-type={t} onClick={() => setType(t)}>{t === 'song' ? '歌曲' : t === 'album' ? '专辑' : '歌手'}</button>
          ))}
        </div>
        <div className="cover-search-row">
          <input type="text" id="coverSearchInput" placeholder="输入关键词搜索..."
            onKeyDown={e => e.key === 'Enter' && doSearch(e.target.value)} />
          <select id="coverCountrySelect" value={country} onChange={e => setCountry(e.target.value)}>
            <option value="">所有国家</option>
            <option value="CN">中国</option>
            <option value="JP">日本</option>
            <option value="KR">韩国</option>
            <option value="US">美国</option>
            <option value="GB">英国</option>
            <option value="TW">台湾</option>
            <option value="HK">香港</option>
          </select>
          <button onClick={() => doSearch(document.getElementById('coverSearchInput')?.value)}><i className="fas fa-search"></i> 搜索</button>
        </div>
      </div>
      <div className="cover-results" id="coverResults">
        {loading ? (
          <div className="cover-loading" style={{ gridColumn: '1 / -1' }}>搜索中...</div>
        ) : results.length === 0 ? (
          <div className="cover-results-empty" style={{ gridColumn: '1 / -1' }}>
            <i className="fas fa-music"></i>
            <p>输入歌曲名或歌手，搜索封面</p>
          </div>
        ) : results.map((item, i) => (
          <div key={i} className="cover-result-item" onClick={() => selectItem(item)}>
            <img src={item.artworkUrl100} alt="" loading="lazy" />
            <div className="cover-result-label">
              {(item.trackName || item.collectionName || item.artistName || '') + (item.artistName ? ' — ' + item.artistName : '')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
