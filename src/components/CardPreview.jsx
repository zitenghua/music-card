import { useMemo, useEffect } from 'react'
import { hexToRgba } from '../utils/color'
import { fitTitle } from '../utils/textFitter'

export default function CardPreview({ config }) {
  const cssVars = useMemo(() => {
    const overlayGrad = `linear-gradient(to top, ${hexToRgba(config.cardBg, 0.8)} 0%, ${hexToRgba(config.cardBg, 0)} 100%)`
    return {
      '--card-width': config.cardWidth,
      '--card-aspect-ratio': config.cardAspectRatio,
      '--card-bg': config.cardBg,
      '--card-radius': config.cardRadius,
      '--font-family': config.fontFamily,
      '--album-height': config.albumHeight,
      '--album-padding': config.albumPadding,
      '--album-img-radius': config.albumImgRadius,
      '--overlay-gradient': overlayGrad,
      '--text-color': config.textColor,
      '--title-size': config.titleSize,
      '--artist-size': config.artistSize,
      '--artist-opacity': config.artistOpacity,
      '--song-info-gap': config.songInfoGap,
      '--content-bottom': config.contentBottom,
      '--content-padding-x': config.contentPaddingX,
      '--progress-text-color': config.progressTextColor,
      '--time-size': config.timeSize,
      '--progress-height': config.progressHeight,
      '--progress-track-color': config.progressTrackColor,
      '--progress-fill-color': config.progressFillColor,
      '--progress-fill-width': config.progressPercent + '%',
      '--controls-bottom': config.controlsBottom,
      '--controls-gap': config.controlsGap,
      '--side-btn-size': config.sideBtnSize,
      '--side-btn-icon-size': config.sideBtnIconSize,
      '--side-btn-opacity': config.sideBtnOpacity,
      '--play-btn-size': config.playBtnSize,
      '--play-btn-icon-size': config.playBtnIconSize,
      '--play-btn-bg': config.playBtnBg,
      '--play-btn-color': config.playBtnColor,
      '--action-top': config.actionTop,
      '--action-right': config.actionRight,
      '--action-gap': config.actionGap,
      '--action-btn-size': config.actionBtnSize,
      '--action-btn-icon-size': config.actionBtnIconSize,
      '--action-btn-bg': hexToRgba(config.actionBtnBg, parseFloat(config.actionBtnOpacity) / 100),
      '--action-active-color': config.actionActiveColor,
      '--print-width': config.printWidth,
      '--print-height': config.printHeight,
    }
  }, [config])

  useEffect(() => {
    requestAnimationFrame(() => fitTitle(config))
    setTimeout(() => fitTitle(config), 50)
  }, [config.songTitle, config.songArtist, config.titleSize, config.artistSize])

  return (
    <div className="preview-section">
      <span className="right-section-label">预览</span>
      <div className="music-card" id="musicCard" style={cssVars}>
        <div className="album-cover">
          <div className="album-img" id="albumImage" style={{ backgroundImage: `url('${config.albumImageUrl}')` }}></div>
        </div>
        <div className="overlay"></div>
        <div className="content-group">
          <div className="song-info">
            <div className="song-title" id="songTitle">{config.songTitle}</div>
            <div className="song-artist" id="songArtist">{config.songArtist}</div>
          </div>
          <div className="progress-container">
            <div className="time-display">
              <span id="currentTime">{config.currentTime}</span>
              <span id="totalTime">{config.totalTime}</span>
            </div>
            <div className="progress-bar" style={{ backgroundColor: config.progressTrackColor, height: config.progressHeight }}>
              <div className="progress-fill" id="progressFill" style={{ width: config.progressPercent + '%', backgroundColor: config.progressFillColor }}></div>
            </div>
          </div>
        </div>
        <div className="control-buttons">
          <button className="control-btn prev-btn" title="上一首"><i className="fas fa-step-backward"></i></button>
          <button className="control-btn play-btn" id="playBtn" title="播放/暂停"><i className="fas fa-play" id="playIcon"></i></button>
          <button className="control-btn next-btn" title="下一首"><i className="fas fa-step-forward"></i></button>
        </div>
        <div className="action-buttons">
          <button className={`action-btn${config.isFavorite ? ' active' : ''}`} id="favoriteBtn" title="收藏"><i className="fas fa-heart"></i></button>
          <button className="action-btn" id="commentBtn" title="评论区"><i className="fas fa-comment-dots"></i></button>
        </div>
      </div>
    </div>
  )
}
