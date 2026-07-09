import { hexToRgba } from './color'
import { FA_ICONS } from './icons'

function drawFaIcon(ctx, el, cx, cy, size) {
  if (!el) return
  const cs = getComputedStyle(el)
  const font = cs.fontWeight + ' ' + size + 'px ' + cs.fontFamily
  for (const [cls, icon] of Object.entries(FA_ICONS)) {
    if (el.classList.contains(cls)) {
      ctx.font = font
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(icon.ch, cx, cy + 1)
      return
    }
  }
}

function roundPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

async function imgToDataUrl(url) {
  // 用 fetch 跨域获取图片 → blob → FileReader → data URL（不会污染 canvas）
  const response = await fetch(url)
  if (!response.ok) throw new Error('HTTP ' + response.status)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('FileReader 读取失败'))
    reader.readAsDataURL(blob)
  })
}

export async function exportImage(currentConfig) {
  const card = document.getElementById('musicCard')
  if (!card || !currentConfig) return null
  const origShadow = card.style.boxShadow
  card.style.boxShadow = 'none'
  const SCALE = 6
  const w = card.offsetWidth
  const h = card.offsetHeight
  try {
    function rel(el) {
      if (!el) return { x: 0, y: 0, w: 0, h: 0 }
      const r = el.getBoundingClientRect()
      const c = card.getBoundingClientRect()
      return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }
    }
    const albumImgEl = card.querySelector('.album-img')
    let coverImage = null
    if (albumImgEl) {
      const bg = getComputedStyle(albumImgEl).backgroundImage
      const m = bg.match(/url\(["']?(.+?)["']?\)/)
      if (m && m[1] && m[1] !== 'none' && m[1] !== 'none') {
        try {
          // 先转成 data URL 避免跨域 canvas 污染
          const dataUrl = await imgToDataUrl(m[1])
          if (dataUrl) coverImage = await loadImage(dataUrl)
        } catch (e2) { console.warn('封面加载失败', e2) }
      }
    }
    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('图片加载失败: ' + src))
        img.src = src
      })
    }
    const canvas = document.createElement('canvas')
    canvas.width = w * SCALE
    canvas.height = h * SCALE
    const ctx = canvas.getContext('2d')
    ctx.scale(SCALE, SCALE)

    // 1. 卡片背景
    const cardRadius = parseFloat(getComputedStyle(card).borderRadius) || 16
    ctx.fillStyle = currentConfig.cardBg || '#8B1A35'
    roundPath(ctx, 0, 0, w, h, cardRadius)
    ctx.fill()
    // 2. 封面
    if (coverImage) {
      const ir = rel(albumImgEl)
      const imgRadius = parseFloat(getComputedStyle(albumImgEl).borderRadius) || 8
      ctx.save()
      roundPath(ctx, ir.x, ir.y, ir.w, ir.h, imgRadius)
      ctx.clip()
      const sc = Math.max(ir.w / coverImage.width, ir.h / coverImage.height)
      ctx.drawImage(coverImage, ir.x + (ir.w - coverImage.width * sc) / 2, ir.y + (ir.h - coverImage.height * sc) / 2, coverImage.width * sc, coverImage.height * sc)
      ctx.restore()
    }
    // 3. 覆盖层渐变
    const ovEl = card.querySelector('.overlay')
    if (ovEl) {
      const or_ = rel(ovEl)
      const bgHex = (currentConfig.cardBg || '#8B1A35').replace('#', '')
      const r_ = parseInt(bgHex.substring(0, 2), 16)
      const g_ = parseInt(bgHex.substring(2, 4), 16)
      const b_ = parseInt(bgHex.substring(4, 6), 16)
      const grad = ctx.createLinearGradient(0, or_.y + or_.h, 0, or_.y)
      grad.addColorStop(0, `rgba(${r_},${g_},${b_},0.8)`)
      grad.addColorStop(1, `rgba(${r_},${g_},${b_},0)`)
      ctx.fillStyle = grad
      ctx.fillRect(or_.x, or_.y, or_.w, or_.h)
    }
    // 4. 操作按钮
    card.querySelectorAll('.action-btn').forEach(btn => {
      const br = rel(btn)
      const active = btn.classList.contains('active')
      ctx.fillStyle = active ? (currentConfig.actionActiveColor || '#ff6b6b') : hexToRgba(currentConfig.actionBtnBg || '#ffffff', parseFloat(currentConfig.actionBtnOpacity || 20) / 100)
      ctx.beginPath()
      ctx.arc(br.x + br.w / 2, br.y + br.h / 2, br.w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = currentConfig.textColor || '#ffffff'
      drawFaIcon(ctx, btn.querySelector('i'), br.x + br.w / 2, br.y + br.h / 2, br.w * 0.48)
    })
    // 5. 文字
    const titleEl = card.querySelector('.song-title')
    const artistEl = card.querySelector('.song-artist')
    if (titleEl) {
      const tr = rel(titleEl)
      ctx.fillStyle = currentConfig.textColor || '#ffffff'
      ctx.font = '600 ' + (getComputedStyle(titleEl).fontSize || '14px') + ' sans-serif'
      ctx.textBaseline = 'top'
      ctx.fillText(currentConfig.songTitle || '', tr.x, tr.y)
    }
    if (artistEl) {
      const ar = rel(artistEl)
      ctx.fillStyle = currentConfig.textColor || '#ffffff'
      ctx.globalAlpha = parseFloat(currentConfig.artistOpacity) || 0.9
      ctx.font = '400 ' + (getComputedStyle(artistEl).fontSize || '11px') + ' sans-serif'
      ctx.textBaseline = 'top'
      ctx.fillText(currentConfig.songArtist || '', ar.x, ar.y)
      ctx.globalAlpha = 1
    }
    // 6. 时间
    const curEl = card.querySelector('#currentTime')
    const totEl = card.querySelector('#totalTime')
    if (curEl) {
      const cr = rel(curEl)
      ctx.fillStyle = currentConfig.progressTextColor || '#a0a0c0'
      ctx.font = (currentConfig.timeSize || '10px') + ' sans-serif'
      ctx.textBaseline = 'top'
      ctx.fillText(currentConfig.currentTime || '', cr.x, cr.y)
    }
    if (totEl) {
      const tr = rel(totEl)
      ctx.fillStyle = currentConfig.progressTextColor || '#a0a0c0'
      ctx.font = (currentConfig.timeSize || '10px') + ' sans-serif'
      ctx.textBaseline = 'top'
      ctx.textAlign = 'right'
      ctx.fillText(currentConfig.totalTime || '', tr.x + tr.w, tr.y)
    }
    // 7. 进度条
    const barEl = card.querySelector('.progress-bar')
    if (barEl) {
      const pr = rel(barEl)
      const ph = parseFloat(getComputedStyle(barEl).height) || 3
      const col = getComputedStyle(barEl).backgroundColor || 'rgba(255,255,255,0.1)'
      const pct = parseFloat(currentConfig.progressPercent) / 100 || 0
      ctx.fillStyle = col
      ctx.beginPath()
      roundPath(ctx, pr.x, pr.y, pr.w, ph, ph / 2)
      ctx.fill()
      const fillEl = card.querySelector('.progress-fill')
      const fillCol = fillEl ? getComputedStyle(fillEl).backgroundColor : (currentConfig.progressFillColor || '#ff6b6b')
      ctx.fillStyle = fillCol
      ctx.beginPath()
      roundPath(ctx, pr.x, pr.y, pr.w * pct, ph, ph / 2)
      ctx.fill()
    }
    // 8. 控制按钮
    card.querySelectorAll('.control-btn').forEach(btn => {
      const br = rel(btn)
      if (btn.classList.contains('play-btn')) {
        ctx.fillStyle = currentConfig.playBtnBg || '#ffffff'
        ctx.beginPath()
        ctx.arc(br.x + br.w / 2, br.y + br.h / 2, br.w / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = currentConfig.playBtnColor || '#8B1A35'
      } else {
        ctx.fillStyle = currentConfig.textColor || '#ffffff'
        ctx.globalAlpha = parseFloat(currentConfig.sideBtnOpacity) || 0.8
      }
      drawFaIcon(ctx, btn.querySelector('i'), br.x + br.w / 2, br.y + br.h / 2, br.w * 0.45)
      ctx.globalAlpha = 1
    })
    card.style.boxShadow = origShadow
    return canvas.toDataURL('image/png')
  } catch (err) {
    card.style.boxShadow = origShadow
    console.error('导出失败:', err)
    alert('导出图片失败: ' + err.message)
    return null
  }
}
