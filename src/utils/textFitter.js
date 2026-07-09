import { DEFAULT_CONFIG } from '../configData'

export function clampTextWidth(el, defaultSize, fontWeight) {
  if (!el || !el.textContent) return
  const card = document.getElementById('musicCard')
  if (!card) return
  void card.offsetHeight
  const actionBtns = card.querySelector('.action-buttons')
  const elRect = el.getBoundingClientRect()
  let availWidth
  if (actionBtns) {
    availWidth = actionBtns.getBoundingClientRect().left - elRect.left - 5
  } else {
    availWidth = card.getBoundingClientRect().width - 130
  }
  if (availWidth <= 20) return -1
  el.style.maxWidth = availWidth + 'px'
  el.style.boxSizing = 'border-box'
  const baseSize = parseFloat(defaultSize) || 12
  const weight = fontWeight || 400
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.font = `${weight} ${baseSize}px sans-serif`
  if (ctx.measureText(el.textContent).width <= availWidth) {
    el.style.fontSize = baseSize + 'px'
    el.style.whiteSpace = 'nowrap'
    el.style.overflow = 'hidden'
    el.style.textOverflow = 'ellipsis'
    el.style.lineHeight = '1.3'
    el.style.display = ''
    el.style.webkitLineClamp = ''
    el.style.webkitBoxOrient = ''
    el.style.maxHeight = ''
    return baseSize
  }
  let low = 8, high = baseSize, best = 8
  while (low <= high) {
    const mid = (low + high) / 2
    ctx.font = `${weight} ${mid}px sans-serif`
    if (ctx.measureText(el.textContent).width <= availWidth) { best = mid; low = mid + 0.5 }
    else { high = mid - 0.5 }
  }
  el.style.webkitLineClamp = ''
  el.style.webkitBoxOrient = ''
  el.style.maxHeight = ''
  el.style.display = ''
  if (best >= 10) {
    el.style.fontSize = best + 'px'
    el.style.whiteSpace = 'nowrap'
    el.style.overflow = 'hidden'
    el.style.textOverflow = 'ellipsis'
    el.style.lineHeight = '1.3'
    return best
  } else {
    el.style.fontSize = '8px'
    el.style.whiteSpace = 'normal'
    el.style.overflow = 'hidden'
    el.style.textOverflow = 'ellipsis'
    el.style.lineHeight = '1.2'
    el.style.maxHeight = '2.4em'
    el.style.display = '-webkit-box'
    el.style.webkitLineClamp = '2'
    el.style.webkitBoxOrient = 'vertical'
    return 8
  }
}

export function fitTitle(c) {
  if (c._manualFont) {
    ;['songTitle', 'songArtist'].forEach(id => {
      const e = document.getElementById(id)
      if (!e) return
      e.style.fontSize = ''
      e.style.whiteSpace = ''
      e.style.overflow = ''
      e.style.textOverflow = ''
      e.style.lineHeight = ''
      e.style.display = ''
      e.style.webkitLineClamp = ''
      e.style.webkitBoxOrient = ''
      e.style.maxHeight = ''
    })
    const card = document.getElementById('musicCard')
    if (card) {
      void card.offsetHeight
      const actionBtns = card.querySelector('.action-buttons')
      ;['songTitle', 'songArtist'].forEach(id => {
        const e = document.getElementById(id)
        if (!e) return
        const r = e.getBoundingClientRect()
        if (actionBtns) {
          const w = actionBtns.getBoundingClientRect().left - r.left - 5
          if (w > 20) e.style.maxWidth = w + 'px'
        }
      })
    }
    return
  }
  const defaultTitleSize = parseFloat(DEFAULT_CONFIG.titleSize) || 14
  const defaultArtistSize = parseFloat(DEFAULT_CONFIG.artistSize) || 11
  const usedTitle = clampTextWidth(document.getElementById('songTitle'), defaultTitleSize, 600)
  const usedArtist = clampTextWidth(document.getElementById('songArtist'), defaultArtistSize, 400)
  if (usedTitle && usedTitle > 0) {
    c.titleSize = usedTitle + 'px'
    const inp = document.getElementById('c-titleSize')
    if (inp) inp.value = usedTitle
  }
  if (usedArtist && usedArtist > 0) {
    c.artistSize = usedArtist + 'px'
    const inp = document.getElementById('c-artistSize')
    if (inp) inp.value = usedArtist
  }
}
