import defaultCover from './assets/default-cover.jpg'

export const DEFAULT_CONFIG = {
  cardWidth: '270px', cardAspectRatio: '54 / 85', cardBg: '#8B1A35', cardRadius: '16px',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  albumImageUrl: defaultCover,
  albumHeight: '55%', albumPadding: '1cm 1cm 0', albumImgRadius: '8px',
  textColor: '#ffffff', titleSize: '14px', artistSize: '11px', artistOpacity: '0.9',
  songInfoGap: '8px', contentBottom: 'calc(1.3cm + 60px)', contentPaddingX: '1cm',
  progressTextColor: '#a0a0c0', timeSize: '10px', progressHeight: '3px',
  progressTrackColor: '#ffffff', progressFillColor: '#ff6b6b', progressPercent: 35,
  songTitle: '月 feat. ヰ世界情緒', songArtist: 'Guiano/ヰ世界情緒',
  currentTime: '1:23', totalTime: '3:34',
  controlsBottom: '1cm', controlsGap: '18px', sideBtnSize: '36px',
  sideBtnIconSize: '16px', sideBtnOpacity: '0.8', playBtnSize: '48px',
  playBtnIconSize: '20px', playBtnBg: '#ffffff', playBtnColor: '#8B1A35',
  actionTop: 'calc(55% + 24px)', actionRight: '1cm', actionGap: '12px',
  actionBtnSize: '28px', actionBtnIconSize: '14px', actionBtnBg: '#ffffff',
  actionBtnOpacity: 20, actionActiveColor: '#ff6b6b',
  isFavorite: false, darkMode: false,
  _coverFileName: '花鳥風月-1400.jpg',
  printWidth: '5.4cm', printHeight: '8.5cm',
}

export const FIELD_META = {
  cardBg:{label:'卡片背景',type:'color'}, textColor:{label:'文字颜色',type:'color'},
  progressFillColor:{label:'进度条填充',type:'color'}, progressTrackColor:{label:'进度条轨道',type:'color'},
  progressTextColor:{label:'时间文字',type:'color'}, playBtnBg:{label:'播放键背景',type:'color'},
  playBtnColor:{label:'播放键图标',type:'color'}, actionBtnBg:{label:'操作按钮底色',type:'color'},
  actionActiveColor:{label:'收藏激活色',type:'color'},
  cardWidth:{label:'卡片宽度',type:'text',unit:'px'}, cardAspectRatio:{label:'宽高比',type:'text'},
  cardRadius:{label:'卡片圆角',type:'text',unit:'px'}, progressPercent:{label:'进度百分比',type:'range',min:0,max:100,step:1},
  titleSize:{label:'标题字号',type:'text',unit:'px'}, artistSize:{label:'歌手字号',type:'text',unit:'px'},
  sideBtnSize:{label:'侧按钮大小',type:'text',unit:'px'}, playBtnSize:{label:'播放键大小',type:'text',unit:'px'},
  actionBtnSize:{label:'操作按钮大小',type:'text',unit:'px'}, actionBtnOpacity:{label:'按钮透明度',type:'range',min:0,max:100,step:1},
  controlsGap:{label:'按钮间距',type:'text',unit:'px'},
  albumHeight:{label:'封面高度占比',type:'text'}, albumImgRadius:{label:'封面圆角',type:'text',unit:'px'},
  songTitle:{label:'歌曲名',type:'text'}, songArtist:{label:'歌手名',type:'text'},
  currentTime:{label:'当前时间',type:'text'}, totalTime:{label:'总时长',type:'text'},
  albumImageUrl:{label:'封面图片',type:'image'}, isFavorite:{label:'默认收藏',type:'checkbox'}, darkMode:{label:'深色模式',type:'checkbox'},
}

export const HIDDEN_FIELDS = new Set([
  'fontFamily','artistOpacity','songInfoGap','contentBottom','contentPaddingX','timeSize',
  'progressHeight','sideBtnIconSize','sideBtnOpacity','playBtnIconSize','controlsBottom',
  'actionTop','actionRight','actionGap','actionBtnIconSize','albumPadding','printWidth','printHeight',
  'overlayGradient'
])

export const READONLY_FIELDS = new Set(['cardWidth', 'cardAspectRatio', 'cardRadius'])

export const FIELD_SECTIONS = [
  { title:'颜色', keys:['cardBg','textColor','progressFillColor','progressTrackColor','progressTextColor','playBtnBg','playBtnColor','actionBtnBg','actionBtnOpacity','actionActiveColor'] },
  { title:'尺寸', keys:['cardWidth','cardAspectRatio','cardRadius','progressPercent','titleSize','artistSize','sideBtnSize','playBtnSize','actionBtnSize','controlsGap','albumHeight','albumImgRadius'] },
  { title:'内容', keys:['songTitle','songArtist','currentTime','totalTime','albumImageUrl'] },
  { title:'状态', keys:['isFavorite','darkMode'] },
]
