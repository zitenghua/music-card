// ============================================================
// 默认配置
// ============================================================
const DEFAULT_CONFIG = {
    cardWidth: '270px',
    cardAspectRatio: '54 / 85',
    cardBg: '#8B1A35',
    cardRadius: '16px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",

    albumImageUrl: 'covers/花鳥風月-1400.jpg',
    albumHeight: '55%',
    albumPadding: '1cm 1cm 0',
    albumImgRadius: '8px',

    textColor: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    titleSize: '14px',
    artistSize: '11px',
    artistOpacity: '0.9',

    songInfoGap: '8px',
    contentBottom: 'calc(1.3cm + 60px)',
    contentPaddingX: '1cm',

    progressTextColor: '#a0a0c0',
    timeSize: '10px',
    progressHeight: '3px',
    progressTrackColor: 'rgba(255,255,255,0.1)',
    progressFillColor: '#ff6b6b',
    progressPercent: 35,

    songTitle: '月 feat. ヰ世界情緒',
    songArtist: 'Guiano/ヰ世界情緒',
    currentTime: '1:23',
    totalTime: '3:34',

    controlsBottom: '1cm',
    controlsGap: '18px',
    sideBtnSize: '36px',
    sideBtnIconSize: '16px',
    sideBtnOpacity: '0.8',
    playBtnSize: '48px',
    playBtnIconSize: '20px',
    playBtnBg: '#ffffff',
    playBtnColor: '#8B1A35',
    playBtnShadow: '0 2px 8px rgba(255,255,255,0.2)',

    actionTop: 'calc(55% + 24px)',
    actionRight: '1cm',
    actionGap: '12px',
    actionBtnSize: '28px',
    actionBtnIconSize: '14px',
    actionBtnBg: '#ffffff',
    actionBtnOpacity: 20,
    actionActiveColor: '#ff6b6b',

    isFavorite: false,
    printWidth: '5.4cm',
    printHeight: '8.5cm',
};

// ============================================================
// 字段元信息
// ============================================================
const FIELD_META = {
    cardBg:{label:'卡片背景',type:'color'}, textColor:{label:'文字颜色',type:'color'},
    progressFillColor:{label:'进度条填充',type:'color'}, progressTrackColor:{label:'进度条轨道',type:'color'},
    progressTextColor:{label:'时间文字',type:'color'}, playBtnBg:{label:'播放键背景',type:'color'},
    playBtnColor:{label:'播放键图标',type:'color'}, actionBtnBg:{label:'操作按钮底色',type:'color'},
    actionActiveColor:{label:'收藏激活色',type:'color'},
    cardWidth:{label:'卡片宽度',type:'text',unit:'px'}, cardAspectRatio:{label:'宽高比',type:'text'},
    cardRadius:{label:'卡片圆角',type:'text',unit:'px'}, progressPercent:{label:'进度百分比',type:'range',min:0,max:100,step:1},
    titleSize:{label:'标题字号',type:'text',unit:'px'}, artistSize:{label:'歌手字号',type:'text',unit:'px'},
    sideBtnSize:{label:'侧按钮大小',type:'text',unit:'px'}, playBtnSize:{label:'播放键大小',type:'text',unit:'px'},
    actionBtnSize:{label:'操作按钮大小',type:'text',unit:'px'}, actionBtnOpacity:{label:'按钮透明度',type:'range',min:0,max:100,step:1}, controlsGap:{label:'按钮间距',type:'text',unit:'px'},
    albumHeight:{label:'封面高度占比',type:'text'}, albumImgRadius:{label:'封面圆角',type:'text',unit:'px'},
    songTitle:{label:'歌曲名',type:'text'}, songArtist:{label:'歌手名',type:'text'},
    currentTime:{label:'当前时间',type:'text'}, totalTime:{label:'总时长',type:'text'},
    albumImageUrl:{label:'封面图片',type:'image'}, isFavorite:{label:'默认收藏',type:'checkbox'},
    playBtnShadow:{label:'播放键阴影',type:'text'}, textShadow:{label:'文字阴影',type:'text'},
};

const HIDDEN_FIELDS = new Set([
    'fontFamily','artistOpacity','songInfoGap','contentBottom','contentPaddingX','timeSize',
    'progressHeight','sideBtnIconSize','sideBtnOpacity','playBtnIconSize','controlsBottom',
    'actionTop','actionRight','actionGap','actionBtnIconSize','albumPadding','printWidth','printHeight',
    'overlayGradient'
]);

const FIELD_SECTIONS = [
    { title:'颜色', keys:['cardBg','textColor','progressFillColor','progressTrackColor','progressTextColor','playBtnBg','playBtnColor','actionBtnBg','actionBtnOpacity','actionActiveColor'] },
    { title:'尺寸', keys:['cardWidth','cardAspectRatio','cardRadius','progressPercent','titleSize','artistSize','sideBtnSize','playBtnSize','actionBtnSize','controlsGap','albumHeight','albumImgRadius'] },
    { title:'内容', keys:['songTitle','songArtist','currentTime','totalTime','albumImageUrl'] },
    { title:'状态', keys:['isFavorite'] },
    { title:'高级', keys:['playBtnShadow','textShadow'] },
];

// ============================================================
// 核心逻辑
// ============================================================
let currentConfig = { ...DEFAULT_CONFIG };

function hexToRgba(hex, a) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
}

function applyConfig(c) {
    const card = document.getElementById('musicCard');
    const overlayGrad = `linear-gradient(to top, ${hexToRgba(c.cardBg, 0.8)} 0%, ${hexToRgba(c.cardBg, 0)} 100%)`;

    const vars = {
        '--card-width':           c.cardWidth,
        '--card-aspect-ratio':    c.cardAspectRatio,
        '--card-bg':              c.cardBg,
        '--card-radius':          c.cardRadius,
        '--font-family':          c.fontFamily,
        '--album-height':         c.albumHeight,
        '--album-padding':        c.albumPadding,
        '--album-img-radius':     c.albumImgRadius,
        '--overlay-gradient':     overlayGrad,
        '--text-color':           c.textColor,
        '--text-shadow':          c.textShadow,
        '--title-size':           c.titleSize,
        '--artist-size':          c.artistSize,
        '--artist-opacity':       c.artistOpacity,
        '--song-info-gap':        c.songInfoGap,
        '--content-bottom':       c.contentBottom,
        '--content-padding-x':    c.contentPaddingX,
        '--progress-text-color':  c.progressTextColor,
        '--time-size':            c.timeSize,
        '--progress-height':      c.progressHeight,
        '--progress-track-color': c.progressTrackColor,
        '--progress-fill-color':  c.progressFillColor,
        '--progress-fill-width':  c.progressPercent + '%',
        '--controls-bottom':      c.controlsBottom,
        '--controls-gap':         c.controlsGap,
        '--side-btn-size':        c.sideBtnSize,
        '--side-btn-icon-size':   c.sideBtnIconSize,
        '--side-btn-opacity':     c.sideBtnOpacity,
        '--play-btn-size':        c.playBtnSize,
        '--play-btn-icon-size':   c.playBtnIconSize,
        '--play-btn-bg':          c.playBtnBg,
        '--play-btn-color':       c.playBtnColor,
        '--play-btn-shadow':      c.playBtnShadow,
        '--action-top':           c.actionTop,
        '--action-right':         c.actionRight,
        '--action-gap':           c.actionGap,
        '--action-btn-size':      c.actionBtnSize,
        '--action-btn-icon-size': c.actionBtnIconSize,
        '--action-btn-bg':        hexToRgba(c.actionBtnBg, parseFloat(c.actionBtnOpacity) / 100),
        '--action-active-color':  c.actionActiveColor,
        '--print-width':          c.printWidth,
        '--print-height':         c.printHeight,
    };

    Object.entries(vars).forEach(([k, v]) => card.style.setProperty(k, v));

    document.getElementById('albumImage').style.backgroundImage = `url('${c.albumImageUrl}')`;
    document.getElementById('songTitle').textContent = c.songTitle;
    document.getElementById('songArtist').textContent = c.songArtist;
    document.getElementById('currentTime').textContent = c.currentTime;
    document.getElementById('totalTime').textContent = c.totalTime;
    document.getElementById('favoriteBtn').classList.toggle('active', c.isFavorite);
    // 延迟执行字号适应，确保 DOM 已渲染完成
    requestAnimationFrame(() => fitTitle());
    // 双保险：再延迟一次（部分浏览器 rAF 时机不一致）
    setTimeout(() => fitTitle(), 50);
}

// 通用红线适配：限制元素宽度不超过收藏按钮左边沿，自动缩小字号或换行
function clampTextWidth(el, defaultSize, fontWeight) {
    if (!el || !el.textContent) return;

    const card = document.getElementById('musicCard');
    if (!card) return;

    // 强制浏览器重新计算布局
    void card.offsetHeight;

    const actionBtns = card.querySelector('.action-buttons');
    const elRect = el.getBoundingClientRect();

    let availWidth;
    if (actionBtns) {
        const btnLeft = actionBtns.getBoundingClientRect().left;
        availWidth = btnLeft - elRect.left - 5;
    } else {
        availWidth = card.getBoundingClientRect().width - 130;
    }
    if (availWidth <= 20) return -1;

    // ★★★ 红线原则：物理限制宽度
    el.style.maxWidth = availWidth + 'px';
    el.style.boxSizing = 'border-box';

    const baseSize = parseFloat(defaultSize) || 12;
    const weight = fontWeight || 400;

    // 测量文字宽度
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${weight} ${baseSize}px sans-serif`;

    if (ctx.measureText(el.textContent).width <= availWidth) {
        el.style.fontSize = baseSize + 'px';
        el.style.whiteSpace = 'nowrap';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.lineHeight = '1.3';
        el.style.display = '';
        el.style.webkitLineClamp = '';
        el.style.webkitBoxOrient = '';
        el.style.maxHeight = '';
        return baseSize;
    }

    // 二分查找最佳字号
    let low = 8, high = baseSize, best = 8;
    while (low <= high) {
        const mid = (low + high) / 2;
        ctx.font = `${weight} ${mid}px sans-serif`;
        if (ctx.measureText(el.textContent).width <= availWidth) {
            best = mid;
            low = mid + 0.5;
        } else {
            high = mid - 0.5;
        }
    }

    el.style.webkitLineClamp = '';
    el.style.webkitBoxOrient = '';
    el.style.maxHeight = '';
    el.style.display = '';

    if (best >= 10) {
        el.style.fontSize = best + 'px';
        el.style.whiteSpace = 'nowrap';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.lineHeight = '1.3';
        return best;
    } else {
        el.style.fontSize = '8px';
        el.style.whiteSpace = 'normal';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.lineHeight = '1.2';
        el.style.maxHeight = '2.4em';
        el.style.display = '-webkit-box';
        el.style.webkitLineClamp = '2';
        el.style.webkitBoxOrient = 'vertical';
        return 8;
    }
}

// 对歌名和歌手同时应用红线原则
function fitTitle() {
    // 用户手动改过字号 → 清除自适应内联样式，只用红线约束
    if (currentConfig._manualFont) {
        ['songTitle', 'songArtist'].forEach(id => {
            const e = document.getElementById(id);
            if (!e) return;
            e.style.fontSize = '';
            e.style.whiteSpace = '';
            e.style.overflow = '';
            e.style.textOverflow = '';
            e.style.lineHeight = '';
            e.style.display = '';
            e.style.webkitLineClamp = '';
            e.style.webkitBoxOrient = '';
            e.style.maxHeight = '';
        });
        // 重算红线
        const card = document.getElementById('musicCard');
        if (card) {
            void card.offsetHeight;
            const actionBtns = card.querySelector('.action-buttons');
            ['songTitle', 'songArtist'].forEach(id => {
                const e = document.getElementById(id);
                if (!e) return;
                const r = e.getBoundingClientRect();
                if (actionBtns) {
                    const w = actionBtns.getBoundingClientRect().left - r.left - 5;
                    if (w > 20) e.style.maxWidth = w + 'px';
                }
            });
        }
        return;
    }

    // 自适应模式：基准字号始终从 DEFAULT_CONFIG 取，不受之前适配干扰
    const defaultTitleSize = parseFloat(DEFAULT_CONFIG.titleSize) || 14;
    const defaultArtistSize = parseFloat(DEFAULT_CONFIG.artistSize) || 11;

    const usedTitle = clampTextWidth(document.getElementById('songTitle'), defaultTitleSize, 600);
    const usedArtist = clampTextWidth(document.getElementById('songArtist'), defaultArtistSize, 400);

    // 同步实际字号到左侧配置面板（只写数字，由输入框自动处理单位）
    if (usedTitle && usedTitle > 0) {
        currentConfig.titleSize = usedTitle + 'px';
        const inp = document.getElementById('c-titleSize');
        if (inp) inp.value = usedTitle;
    }
    if (usedArtist && usedArtist > 0) {
        currentConfig.artistSize = usedArtist + 'px';
        const inp = document.getElementById('c-artistSize');
        if (inp) inp.value = usedArtist;
    }
}

function buildConfigPanel(config) {
    const grid = document.getElementById('configGrid');
    grid.innerHTML = '';

    FIELD_SECTIONS.forEach(section => {
        const keys = section.keys.filter(k => !HIDDEN_FIELDS.has(k));
        if (!keys.length) return;

        const title = document.createElement('div');
        title.className = 'section-label';
        title.textContent = section.title;
        grid.appendChild(title);

        keys.forEach(key => {
            const meta = FIELD_META[key];
            const val = config[key] ?? '';

            const group = document.createElement('div');
            group.className = 'config-group';
            // 歌曲名、歌手名占整行
            if (key === 'songTitle' || key === 'songArtist') {
                group.style.gridColumn = '1 / -1';
            }

            const label = document.createElement('label');
            label.htmlFor = `c-${key}`;
            label.textContent = meta.label;
            group.appendChild(label);

            let input;
            if (meta.type === 'color') {
                input = document.createElement('input');
                input.type = 'color';
                input.value = val;
                input.addEventListener('input', sync);
            } else if (meta.type === 'checkbox') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = !!val;
                input.addEventListener('change', sync);
            } else if (meta.type === 'range') {
                input = document.createElement('input');
                input.type = 'range';
                input.min = meta.min;
                input.max = meta.max;
                input.step = meta.step;
                input.value = val;
                input.addEventListener('input', sync);

                const valSpan = document.createElement('span');
                valSpan.style.cssText = 'font-size:10.5px;color:#bbb;margin-left:2px;';
                valSpan.textContent = val;
                input.addEventListener('input', () => { valSpan.textContent = input.value; });
                group.appendChild(valSpan);
            } else if (meta.type === 'image') {
                group.style.gridColumn = '1 / -1';

                const dropZone = document.createElement('div');
                dropZone.className = 'image-drop-zone';

                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';

                const previewIcon = document.createElement('div');
                previewIcon.className = 'drop-zone-icon';
                previewIcon.innerHTML = '<i class="fas fa-image"></i>';

                const texts = document.createElement('div');
                texts.className = 'drop-zone-texts';

                const nameText = document.createElement('span');
                nameText.className = 'drop-zone-name';
                nameText.textContent = val && val !== 'none'
                    ? val.split('/').pop().split('\\').pop()
                    : '点击或拖拽选择封面图片';

                const hintText = document.createElement('span');
                hintText.className = 'drop-zone-hint';
                hintText.textContent = val && val !== 'none' ? '点击更换' : '支持 PNG / JPG / WebP';

                texts.appendChild(nameText);
                texts.appendChild(hintText);
                dropZone.appendChild(previewIcon);
                dropZone.appendChild(texts);
                dropZone.appendChild(fileInput);

                function handleFile(file) {
                    if (!file || !file.type.startsWith('image/')) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        currentConfig.albumImageUrl = ev.target.result;
                        nameText.textContent = file.name;
                        hintText.textContent = '点击更换';
                        previewIcon.innerHTML = '<i class="fas fa-check-circle" style="color:#2d7d46"></i>';
                        dropZone.classList.add('has-image');
                        sync();
                    };
                    reader.readAsDataURL(file);
                }

                dropZone.addEventListener('click', async () => {
                    // Electron 环境：用原生对话框打开 covers 文件夹
                    if (window.electronAPI) {
                        const result = await window.electronAPI.selectCoverFile();
                        if (result) {
                            currentConfig.albumImageUrl = result.dataUrl;
                            nameText.textContent = result.fileName;
                            hintText.textContent = '已选择';
                            previewIcon.innerHTML = '<i class="fas fa-check-circle" style="color:#2d7d46"></i>';
                            dropZone.classList.add('has-image');
                            sync();
                        }
                    } else {
                        // 浏览器环境：用普通文件输入
                        fileInput.click();
                    }
                });
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files[0]) handleFile(e.target.files[0]);
                    e.target.value = '';
                });

                ['dragenter', 'dragover'].forEach(evt => {
                    dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
                });
                ['dragleave', 'drop'].forEach(evt => {
                    dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); });
                });
                dropZone.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

                group.appendChild(dropZone);
                input = null;
            } else {
                input = document.createElement('input');
                input.type = 'text';
                // 带单位的字段：只显示数字，隐藏单位
                const displayVal = meta.unit ? val.replace(meta.unit, '') : val;
                input.value = displayVal;
                // 只允许数字输入
                if (meta.unit) {
                    input.inputMode = 'decimal';
                    input.addEventListener('input', (e) => {
                        e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                        sync();
                    });
                } else {
                    input.addEventListener('input', sync);
                }
                // 用户手动改字号 → 跳过 fitTitle 自动覆盖
                if (key === 'titleSize' || key === 'artistSize') {
                    input.addEventListener('input', () => { currentConfig._manualFont = true; });
                }
                // 显示单位后缀
                if (meta.unit) {
                    const unitSpan = document.createElement('span');
                    unitSpan.textContent = meta.unit;
                    unitSpan.style.cssText = 'font-size:11px;color:#bbb;margin-left:4px;flex-shrink:0;';
                    group.appendChild(unitSpan);
                    // 将输入和单位放在同一行
                    group.style.flexDirection = 'row';
                    group.style.alignItems = 'center';
                    group.style.flexWrap = 'wrap';
                    group.style.gap = '4px';
                    // 让输入框占剩余空间
                    input.style.flex = '1';
                    input.style.minWidth = '40px';
                }
            }

            if (input) {
                input.id = `c-${key}`;
                group.appendChild(input);
            }
            grid.appendChild(group);
        });
    });
}

function sync() {
    currentConfig = readConfig();
    autoCalcTime(currentConfig);
    applyConfig(currentConfig);
}

function autoCalcTime(c) {
    const m = c.totalTime.match(/^(\d+):(\d+)$/);
    if (m) {
        const totalSec = parseInt(m[1]) * 60 + parseInt(m[2]);
        const curSec = Math.round(totalSec * (parseFloat(c.progressPercent) / 100));
        c.currentTime = Math.floor(curSec / 60) + ':' + String(curSec % 60).padStart(2, '0');
        const input = document.getElementById('c-currentTime');
        if (input) input.value = c.currentTime;
    }
}

function readConfig() {
    const cfg = {};
    Object.keys(FIELD_META).forEach(key => {
        if (HIDDEN_FIELDS.has(key)) return;
        if (FIELD_META[key].type === 'image') return;
        const el = document.getElementById(`c-${key}`);
        if (!el) return;
        cfg[key] = FIELD_META[key].type === 'checkbox' ? el.checked : el.value;
        // 带单位的字段：值丢失单位时自动补回
        const unit = FIELD_META[key].unit;
        if (unit && typeof cfg[key] === 'string' && !cfg[key].endsWith(unit) && cfg[key] !== '') {
            cfg[key] = cfg[key] + unit;
        }
    });
    Object.keys(DEFAULT_CONFIG).forEach(k => {
        if (!(k in cfg)) cfg[k] = currentConfig[k] ?? DEFAULT_CONFIG[k];
    });
    return cfg;
}

// ============================================================
// 历史记录（手动保存 · 单独删除 · localStorage 持久化）
// ============================================================
const HISTORY_KEY = 'musicCardHistory';
let historyEntries = [];

function loadHistory() {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        historyEntries = stored ? JSON.parse(stored) : [];
    } catch { historyEntries = []; }
}

function saveHistory() {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historyEntries));
    } catch {
        // localStorage 存满时丢弃最旧条目
        while (historyEntries.length > 0) {
            historyEntries.shift();
            try { localStorage.setItem(HISTORY_KEY, JSON.stringify(historyEntries)); return; } catch { /* continue */ }
        }
    }
}

function saveCurrentConfig() {
    const config = readConfig();
    const entry = {
        id: Date.now(),
        name: '',
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        date: new Date().toLocaleDateString('zh-CN'),
        config: JSON.parse(JSON.stringify(config))
    };
    historyEntries.push(entry);
    saveHistory();
    renderHistory();
}

function deleteHistoryEntry(id) {
    historyEntries = historyEntries.filter(h => h.id !== id);
    saveHistory();
    renderHistory();
}

function restoreHistoryEntry(id) {
    const entry = historyEntries.find(h => h.id === id);
    if (!entry) return;
    currentConfig = JSON.parse(JSON.stringify(entry.config));
    buildConfigPanel(currentConfig);
    applyConfig(currentConfig);
}

function renameHistoryEntry(id) {
    const entry = historyEntries.find(h => h.id === id);
    if (!entry) return;
    const input = document.querySelector(`.history-name-input[data-id="${id}"]`);
    if (!input) return;
    const name = input.value.trim();
    entry.name = name;
    saveHistory();
}

function renderHistory() {
    const section = document.getElementById('historySection');
    if (!section) return;

    const count = historyEntries.length;
    section.innerHTML = `
      <div class="history-header" id="historyHeader">
        <span class="history-title">历史记录</span>
        <span class="history-badge">${count}</span>
        <span class="history-arrow">▶</span>
      </div>
      <div class="history-body" id="historyBody" style="display:none">
        <button class="history-save-btn" id="historySaveBtn">+ 保存当前配置</button>
        ${count === 0 ? '<div class="history-empty">暂无保存记录</div>' : ''}
        <div class="history-list" id="historyList">
          ${historyEntries.slice().reverse().map(h => `
            <div class="history-item" data-id="${h.id}">
              <input class="history-name-input" data-id="${h.id}" value="${h.name}" placeholder="未命名">
              <span class="history-item-time">${h.time}</span>
              <div class="history-item-actions">
                <button class="history-restore-btn" data-id="${h.id}">应用</button>
                <button class="history-del-btn" data-id="${h.id}">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    section.querySelector('#historySaveBtn').addEventListener('click', e => {
        e.stopPropagation();
        saveCurrentConfig();
    });

    const header = section.querySelector('#historyHeader');
    const body = section.querySelector('#historyBody');
    header.addEventListener('click', () => {
        const open = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        header.querySelector('.history-arrow').textContent = open ? '▶' : '▼';
    });

    section.querySelectorAll('.history-name-input').forEach(inp => {
        inp.addEventListener('blur', () => renameHistoryEntry(parseInt(inp.dataset.id)));
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') { inp.blur(); }
        });
    });

    section.querySelectorAll('.history-restore-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            restoreHistoryEntry(parseInt(btn.dataset.id));
            body.style.display = 'none';
            header.querySelector('.history-arrow').textContent = '▶';
        });
    });

    section.querySelectorAll('.history-del-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            deleteHistoryEntry(parseInt(btn.dataset.id));
        });
    });
}

// ============================================================
// 卡片交互
// ============================================================
document.getElementById('favoriteBtn').addEventListener('click', () => {
    currentConfig.isFavorite = !currentConfig.isFavorite;
    document.getElementById('favoriteBtn').classList.toggle('active');
    const cb = document.getElementById('c-isFavorite');
    if (cb) cb.checked = currentConfig.isFavorite;
});
document.getElementById('playBtn').addEventListener('click', () => {
    const icon = document.getElementById('playIcon');
    icon.classList.toggle('fa-play');
    icon.classList.toggle('fa-pause');
});
document.getElementById('commentBtn').addEventListener('click', () => alert('评论区'));

// ============================================================
// 配置操作
// ============================================================
document.getElementById('resetBtn').addEventListener('click', () => {
    delete currentConfig._manualFont;
    currentConfig = { ...DEFAULT_CONFIG };
    buildConfigPanel(currentConfig);
    applyConfig(currentConfig);
});
// Toast 消息提示
function showToast(msg) {
    let t = document.getElementById('toastMsg');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toastMsg';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.classList.remove('show'), 2000);
}

// 导出配置为 .json 文件
document.getElementById('exportBtn').addEventListener('click', async () => {
    const config = readConfig();
    const json = JSON.stringify(config, null, 2);
    const name = config.songTitle ? config.songTitle.replace(/[\\/:*?"<>|]/g, '_') : '卡片配置';

    if (window.electronAPI) {
        const ok = await window.electronAPI.exportConfigFile({ fileName: `${name}.json`, content: json });
        if (ok) showToast('配置已导出');
    } else {
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${name}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('配置已导出');
    }
});

// 导入配置
document.getElementById('importBtn').addEventListener('click', async () => {
    if (window.electronAPI) {
        const content = await window.electronAPI.importConfigFile();
        if (!content) return;
        try {
            const cfg = JSON.parse(content);
            Object.keys(DEFAULT_CONFIG).forEach(k => {
                if (cfg[k] !== undefined) currentConfig[k] = cfg[k];
            });
            buildConfigPanel(currentConfig);
            applyConfig(currentConfig);
            showToast('配置已导入');
        } catch (err) {
            showToast('导入失败：文件格式不正确');
        }
    } else {
        document.getElementById('importFileInput').click();
    }
});
document.getElementById('importFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const cfg = JSON.parse(ev.target.result);
            // 合并到当前配置（只取已有的字段）
            Object.keys(DEFAULT_CONFIG).forEach(k => {
                if (cfg[k] !== undefined) currentConfig[k] = cfg[k];
            });
            buildConfigPanel(currentConfig);
            applyConfig(currentConfig);
            showToast('配置已导入');
        } catch (err) {
            showToast('导入失败：文件格式不正确');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// ============================================================
// 封面搜索（iTunes API — 一次拉 200 张）
// ============================================================
let coverSearchAbort = null;

async function doCoverSearch(query) {
    if (!query.trim()) return;

    const type = document.querySelector('.cover-type-btn.active')?.dataset.type || 'song';
    const country = document.getElementById('coverCountrySelect')?.value || '';
    // 用户搜新歌 → 重置手动标记，让自动适配重新生效
    delete currentConfig._manualFont;

    const resultsEl = document.getElementById('coverResults');

    // 显示加载中
    resultsEl.innerHTML = '<div class="cover-loading">搜索中...</div>';

    // 取消上一次请求
    if (coverSearchAbort) coverSearchAbort.abort();
    coverSearchAbort = new AbortController();

    const entityMap = { song: 'song', album: 'album', artist: 'musicArtist' };
    const entity = entityMap[type] || 'song';

    try {
        let url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=200`;
        if (country) url += '&country=' + country;

        const res = await fetch(url, { signal: coverSearchAbort.signal });
        if (!res.ok) throw new Error('请求失败 (' + res.status + ')');
        const data = await res.json();
        const items = data.results || [];

        resultsEl.innerHTML = '';

        if (items.length === 0) {
            resultsEl.innerHTML = '<div class="cover-error">未找到结果，试试其他关键词</div>';
            return;
        }

        const seen = new Set();
        let count = 0;

        items.forEach(item => {
            let name = '';
            let sub = '';
            let artUrl = item.artworkUrl100;

            if (type === 'song') {
                name = item.trackName || '';
                sub = item.artistName || '';
            } else if (type === 'album') {
                name = item.collectionName || '';
                sub = item.artistName || '';
            } else if (type === 'artist') {
                name = item.artistName || '';
                if (!artUrl) return;
            }

            if (!artUrl || seen.has(artUrl)) return;
            seen.add(artUrl);
            const bigUrl = artUrl.replace('100x100bb', '600x600bb');

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cover-result-item';

            const img = document.createElement('img');
            img.src = artUrl;
            img.alt = name || '封面';
            img.loading = 'lazy';
            itemDiv.appendChild(img);

            const label = document.createElement('div');
            label.className = 'cover-result-label';
            label.textContent = sub ? `${name} — ${sub}` : name;
            itemDiv.appendChild(label);

            itemDiv.addEventListener('click', () => {
                // 用户选了新歌 → 恢复自适应
                delete currentConfig._manualFont;

                currentConfig.albumImageUrl = bigUrl;
                document.getElementById('albumImage').style.backgroundImage = `url('${bigUrl}')`;

                // 自动填充歌曲信息
                if (name) {
                    if (type === 'song' || type === 'album') {
                        currentConfig.songTitle = name;
                        currentConfig.songArtist = sub || '';
                    } else if (type === 'artist') {
                        currentConfig.songArtist = name;
                    }
                    // 更新配置面板的输入框
                    const titleInput = document.getElementById('c-songTitle');
                    const artistInput = document.getElementById('c-songArtist');
                    if (titleInput) titleInput.value = currentConfig.songTitle;
                    if (artistInput) artistInput.value = currentConfig.songArtist;

                    // 自动填充歌曲时长（iTunes 返回 trackTimeMillis）
                    if (item.trackTimeMillis) {
                        const totalSec = Math.round(item.trackTimeMillis / 1000);
                        const min = Math.floor(totalSec / 60);
                        const sec = totalSec % 60;
                        currentConfig.totalTime = min + ':' + String(sec).padStart(2, '0');
                        const timeInput = document.getElementById('c-totalTime');
                        if (timeInput) timeInput.value = currentConfig.totalTime;
                    }
                }

                const nameText = document.querySelector('.drop-zone-name');
                const hintText = document.querySelector('.drop-zone-hint');
                const icon = document.querySelector('.drop-zone-icon');
                const zone = document.querySelector('.image-drop-zone');
                if (nameText) nameText.textContent = name || '已选择封面';
                if (hintText) hintText.textContent = '点击更换';
                if (icon) icon.innerHTML = '<i class="fas fa-check-circle" style="color:#2d7d46"></i>';
                if (zone) zone.classList.add('has-image');

                resultsEl.querySelectorAll('.cover-result-item').forEach(d => d.classList.remove('selected'));
                itemDiv.classList.add('selected');
                sync();
            });

            resultsEl.appendChild(itemDiv);
            count++;
        });

        if (count === 0) {
            resultsEl.innerHTML = '<div class="cover-error">未找到结果，试试其他关键词</div>';
        }
    } catch (err) {
        if (err.name === 'AbortError') return;
        resultsEl.innerHTML = `<div class="cover-error">搜索失败：${err.message}</div>`;
    }
}

// ============================================================
// Canvas 导出 PNG
// ============================================================

// Font Awesome 6 图标的 Unicode 字码
const FA_ICONS = {
    'fa-step-backward': { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
    'fa-step-forward':  { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
    'fa-play':          { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
    'fa-pause':         { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
    'fa-heart':         { ch: '', font: 'Font Awesome 6 Free Solid', w: 900 },
    'fa-comment-dots':  { ch: '', font: 'Font Awesome 6 Free Regular', w: 400 },
};

function drawFaIcon(ctx, el, cx, cy, size) {
    if (!el) return;
    const cs = getComputedStyle(el);
    const font = cs.fontWeight + ' ' + size + 'px ' + cs.fontFamily;
    for (const [cls, icon] of Object.entries(FA_ICONS)) {
        if (el.classList.contains(cls)) {
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon.ch, cx, cy + 1);
            return;
        }
    }
}

async function imgToDataUrl(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('FileReader 读取失败'));
            reader.readAsDataURL(blob);
        });
    } catch (_fetchErr) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0);
                try {
                    resolve(c.toDataURL('image/png'));
                } catch (canvasErr) {
                    reject(new Error('Canvas 导出失败: ' + canvasErr.message));
                }
            };
            img.onerror = () => reject(new Error('图片加载失败: ' + url));
            img.src = url;
        });
    }
}

function roundPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

async function exportImage() {
    const card = document.getElementById('musicCard');
    const origShadow = card.style.boxShadow;
    card.style.boxShadow = 'none';

    const SCALE = 6;
    const w = card.offsetWidth;
    const h = card.offsetHeight;

    try {
        // 测量元素相对卡片位置
        function rel(el) {
            if (!el) return { x: 0, y: 0, w: 0, h: 0 };
            const r = el.getBoundingClientRect();
            const c = card.getBoundingClientRect();
            return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height };
        }

        // 加载封面图片
        const albumImgEl = card.querySelector('.album-img');
        let coverImage = null;
        if (albumImgEl) {
            const bg = getComputedStyle(albumImgEl).backgroundImage;
            const m = bg.match(/url\(["']?(.+?)["']?\)/);
            if (m && m[1] && m[1] !== 'none') {
                const imgUrl = m[1];
                // 先尝试直接加载原图（同源图片可用）
                try {
                    coverImage = await loadImage(imgUrl);
                } catch (_) {
                    console.warn('直接加载封面失败，尝试转 data URL', _.message);
                    try {
                        const dataUrl = await imgToDataUrl(imgUrl);
                        coverImage = await loadImage(dataUrl);
                    } catch (e2) {
                        console.warn('封面转 data URL 也失败', e2);
                    }
                }
            }
        }

        function loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('图片加载失败: ' + src));
                img.src = src;
            });
        }

        // 创建 Canvas
        const canvas = document.createElement('canvas');
        canvas.width = w * SCALE;
        canvas.height = h * SCALE;
        const ctx = canvas.getContext('2d');
        ctx.scale(SCALE, SCALE);

        // 1. 卡片背景（圆角矩形）
        const cardRadius = parseFloat(getComputedStyle(card).borderRadius) || 16;
        ctx.fillStyle = currentConfig.cardBg || '#8B1A35';
        roundPath(ctx, 0, 0, w, h, cardRadius);
        ctx.fill();

        // 2. 封面图片
        if (coverImage) {
            const ir = rel(albumImgEl);
            const imgRadius = parseFloat(getComputedStyle(albumImgEl).borderRadius) || 8;
            ctx.save();
            roundPath(ctx, ir.x, ir.y, ir.w, ir.h, imgRadius);
            ctx.clip();
            const sc = Math.max(ir.w / coverImage.width, ir.h / coverImage.height);
            const sw = coverImage.width * sc;
            const sh = coverImage.height * sc;
            ctx.drawImage(coverImage, ir.x + (ir.w - sw) / 2, ir.y + (ir.h - sh) / 2, sw, sh);
            ctx.restore();
        }

        // 3. 覆盖层渐变（底部实色 -> 顶部透明）
        const ovEl = card.querySelector('.overlay');
        if (ovEl) {
            const or = rel(ovEl);
            const bgHex = (currentConfig.cardBg || '#8B1A35').replace('#', '');
            const r_ = parseInt(bgHex.substring(0, 2), 16);
            const g_ = parseInt(bgHex.substring(2, 4), 16);
            const b_ = parseInt(bgHex.substring(4, 6), 16);
            const grad = ctx.createLinearGradient(0, or.y + or.h, 0, or.y);
            grad.addColorStop(0, `rgba(${r_},${g_},${b_},0.8)`);
            grad.addColorStop(1, `rgba(${r_},${g_},${b_},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(or.x, or.y, or.w, or.h);
        }

        // 4. 操作按钮（收藏 / 评论）
        card.querySelectorAll('.action-btn').forEach(btn => {
            const br = rel(btn);
            const active = btn.classList.contains('active');
            ctx.fillStyle = active
                ? (currentConfig.actionActiveColor || '#ff6b6b')
                : hexToRgba(currentConfig.actionBtnBg || '#ffffff', parseFloat(currentConfig.actionBtnOpacity || 20) / 100);
            ctx.beginPath();
            ctx.arc(br.x + br.w / 2, br.y + br.h / 2, br.w / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = currentConfig.textColor || '#ffffff';
            drawFaIcon(ctx, btn.querySelector('i'), br.x + br.w / 2, br.y + br.h / 2, br.w * 0.48);
        });

        // 5. 歌曲标题 & 歌手
        const titleEl = card.querySelector('.song-title');
        const artistEl = card.querySelector('.song-artist');
        if (titleEl) {
            const tr = rel(titleEl);
            const ts = getComputedStyle(titleEl).fontSize || '14px';
            ctx.fillStyle = currentConfig.textColor || '#ffffff';
            ctx.font = '600 ' + ts + ' sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText(currentConfig.songTitle || '', tr.x, tr.y);
        }
        if (artistEl) {
            const ar = rel(artistEl);
            const as_ = getComputedStyle(artistEl).fontSize || '11px';
            ctx.fillStyle = currentConfig.textColor || '#ffffff';
            ctx.globalAlpha = parseFloat(currentConfig.artistOpacity) || 0.9;
            ctx.font = '400 ' + as_ + ' sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText(currentConfig.songArtist || '', ar.x, ar.y);
            ctx.globalAlpha = 1;
        }

        // 6. 时间文字
        const curEl = card.querySelector('#currentTime');
        const totEl = card.querySelector('#totalTime');
        if (curEl) {
            const cr = rel(curEl);
            ctx.fillStyle = currentConfig.progressTextColor || '#a0a0c0';
            ctx.font = (currentConfig.timeSize || '10px') + ' sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText(currentConfig.currentTime || '', cr.x, cr.y);
        }
        if (totEl) {
            const tr = rel(totEl);
            ctx.fillStyle = currentConfig.progressTextColor || '#a0a0c0';
            ctx.font = (currentConfig.timeSize || '10px') + ' sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'right';
            ctx.fillText(currentConfig.totalTime || '', tr.x + tr.w, tr.y);
            ctx.textAlign = 'left';
        }

        // 7. 进度条
        const barEl = card.querySelector('.progress-bar');
        if (barEl) {
            const pr = rel(barEl);
            const ph = parseFloat(getComputedStyle(barEl).height) || 3;
            const col = getComputedStyle(barEl).backgroundColor || 'rgba(255,255,255,0.1)';
            const pct = parseFloat(currentConfig.progressPercent) / 100 || 0;

            ctx.fillStyle = col;
            ctx.beginPath();
            roundPath(ctx, pr.x, pr.y, pr.w, ph, ph / 2);
            ctx.fill();

            const fillEl = card.querySelector('.progress-fill');
            const fillCol = fillEl ? getComputedStyle(fillEl).backgroundColor : (currentConfig.progressFillColor || '#ff6b6b');
            ctx.fillStyle = fillCol;
            ctx.beginPath();
            roundPath(ctx, pr.x, pr.y, pr.w * pct, ph, ph / 2);
            ctx.fill();
        }

        // 8. 控制按钮
        card.querySelectorAll('.control-btn').forEach(btn => {
            const br = rel(btn);
            if (btn.classList.contains('play-btn')) {
                ctx.fillStyle = currentConfig.playBtnBg || '#ffffff';
                ctx.beginPath();
                ctx.arc(br.x + br.w / 2, br.y + br.h / 2, br.w / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = currentConfig.playBtnColor || '#8B1A35';
            } else {
                ctx.fillStyle = currentConfig.textColor || '#ffffff';
                ctx.globalAlpha = parseFloat(currentConfig.sideBtnOpacity) || 0.8;
            }
            drawFaIcon(ctx, btn.querySelector('i'), br.x + br.w / 2, br.y + br.h / 2, br.w * 0.45);
            ctx.globalAlpha = 1;
        });

        // 生成文件名：歌曲名-歌手名.png
        const safeName = (currentConfig.songTitle || 'music-card').replace(/[\\/:*?"<>|]/g, '_');
        const safeArtist = (currentConfig.songArtist || '').replace(/[\\/:*?"<>|]/g, '_');
        const pngFileName = safeArtist ? `${safeName}-${safeArtist}.png` : `${safeName}.png`;

        // 下载 PNG（Electron 弹出保存对话框→output/，浏览器直接下载）
        const pngDataUrl = canvas.toDataURL('image/png');
        if (window.electronAPI) {
          const ok = await window.electronAPI.exportPngFile({ dataUrl: pngDataUrl, fileName: pngFileName });
          if (ok) {
            const dirs = await window.electronAPI.getUserDirs();
            showToast(`PNG 已保存到 ${dirs.output}`);
          } else showToast('已取消');
        } else {
          const a = document.createElement('a');
          a.download = pngFileName;
          a.href = pngDataUrl;
          a.click();
        }

        card.style.boxShadow = origShadow;
    } catch (err) {
        card.style.boxShadow = origShadow;
        console.error('导出失败:', err);
        alert('导出图片失败: ' + err.message);
    }
}

document.getElementById('exportPngBtn').addEventListener('click', exportImage);

// ============================================================
// 封面搜索事件绑定
// ============================================================
// 搜索类型切换
document.querySelectorAll('.cover-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cover-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        coverSearchState.type = btn.dataset.type;
        // 如果搜索框有内容，自动重新搜索
        const input = document.getElementById('coverSearchInput');
        if (input.value.trim()) doCoverSearch(input.value.trim());
    });
});

// 国家切换
document.getElementById('coverCountrySelect').addEventListener('change', (e) => {
    coverSearchState.country = e.target.value;
    const input = document.getElementById('coverSearchInput');
    if (input.value.trim()) doCoverSearch(input.value.trim());
});

// 搜索按钮
document.getElementById('coverSearchBtn').addEventListener('click', () => {
    const input = document.getElementById('coverSearchInput');
    doCoverSearch(input.value);
});

// 回车搜索
document.getElementById('coverSearchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doCoverSearch(e.target.value);
});

// ============================================================
// 启动
// ============================================================
buildConfigPanel(DEFAULT_CONFIG);
applyConfig(DEFAULT_CONFIG);

loadHistory();
renderHistory();

window.updateCardConfig = (n) => { currentConfig = { ...currentConfig, ...n }; buildConfigPanel(currentConfig); applyConfig(currentConfig); };
