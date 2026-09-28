/* 時光黑板上的神秘留信 — 畫面互動 */
(function () {
  'use strict';
  var G = window.GameLogic;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var SCREENS = ['intro', 's1', 's2', 's3', 's4', 'final'];
  var STORE_KEY = 'teachers-day-escape:v2';

  var ICONS = {
    chalk: { color: '#f2d479', label: '粉筆盒', body: '<rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M7.5 10V5M11.5 10V4M15.5 10V6"/>' },
    globe: { color: '#9fd0ea', label: '地球儀', body: '<circle cx="12" cy="10" r="6"/><path d="M6 10h12M12 4c2.2 2.4 2.2 9.6 0 12M12 4c-2.2 2.4-2.2 9.6 0 12M12 16v4M8 20h8"/>' },
    ruler: { color: '#f4a9a0', label: '三角尺', body: '<path d="M4 20h16L4 4z"/><path d="M8 16h4l-4-4z"/>' }
  };

  var state = {
    solved: 0,            // 已拿到幾把鑰匙
    picks: {},            // 第 1 關選的字
    slots: [null, null, null, null], // 第 3 關每格放的字
    time: { h: 9, m: 0 }, // 第 4 關時鐘
    hintShown: { 1: 1, 2: 1, 3: 1, 4: 1 },
    card: { teacher: '', student: '', msg: '' }
  };
  var current = 'intro';

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ solved: state.solved, card: state.card })); } catch (e) { /* 無痕模式等情況略過 */ }
  }
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (d && typeof d.solved === 'number') { state.solved = Math.max(0, Math.min(4, d.solved)); }
      if (d && d.card) state.card = Object.assign(state.card, d.card);
    } catch (e) { /* ignore */ }
  }

  function stageNo(id) { return SCREENS.indexOf(id); } // s1 → 1

  function show(id) {
    current = id;
    SCREENS.forEach(function (s) { $('#' + s).classList.toggle('active', s === id); });
    renderKeys();
    var h = $('#' + id + ' h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }

  function renderKeys() {
    var cur = stageNo(current);
    $$('[data-keys]').forEach(function (box) {
      box.innerHTML = '';
      box.setAttribute('aria-label', '鑰匙進度 ' + state.solved + '/4');
      G.KEYS.forEach(function (k, i) {
        var d = document.createElement('div');
        d.className = 'key' + (i < state.solved ? ' done' : (i + 1 === cur ? ' current' : ''));
        d.style.setProperty('--c', k.color);
        d.textContent = k.ch;
        box.appendChild(d);
      });
    });
  }

  function feedback(msg, ok) {
    var el = $('#' + current + ' [data-feedback]');
    if (!el) return;
    el.textContent = msg;
    el.style.color = ok ? 'var(--green)' : 'var(--bad)';
    if (!ok) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- 開場 ---------- */
  function renderIntro() {
    var box = $('#bigKeys'); box.innerHTML = '';
    G.KEYS.forEach(function (k) {
      var w = document.createElement('div');
      w.innerHTML = '<div class="big-key" style="--c:' + k.color + '">' + k.ch + '</div><span style="font-size:13px;color:var(--chalk-dim)">' + k.name + '</span>';
      box.appendChild(w);
    });
    var resume = state.solved > 0;
    $('#startBtn').firstChild.textContent = resume ? (state.solved >= 4 ? '打開時光寶盒' : '繼續第 ' + (state.solved + 1) + ' 關') : '開始解謎';
    $('#resetBtn').hidden = !resume;
  }

  /* ---------- 第 1 關 ---------- */
  function renderRiddles() {
    var box = $('#riddles'); box.innerHTML = '';
    G.RIDDLES.forEach(function (r) {
      var card = document.createElement('div');
      card.className = 'card-dash';
      card.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><span class="tag">' + r.tag + '</span><span class="riddle-q">' + r.q + '</span></div>';
      var row = document.createElement('div'); row.className = 'opt-row'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', r.tag + '的選項');
      r.options.forEach(function (ch) {
        var b = document.createElement('button');
        b.className = 'opt'; b.textContent = ch; b.dataset.testid = 'opt-' + r.id + '-' + ch;
        b.setAttribute('data-testid', 'opt-' + r.id + '-' + ch);
        b.setAttribute('aria-pressed', state.picks[r.id] === ch ? 'true' : 'false');
        b.addEventListener('click', function () {
          state.picks[r.id] = ch;
          $$('.opt', row).forEach(function (o) { o.setAttribute('aria-pressed', o.textContent === ch ? 'true' : 'false'); });
        });
        row.appendChild(b);
      });
      var st = document.createElement('label'); st.className = 'stroke';
      st.innerHTML = '<input class="num-input" type="text" inputmode="numeric" autocomplete="off" placeholder="?" aria-label="' + r.tag + '的筆畫數">畫';
      row.appendChild(st);
      card.appendChild(row);
      box.appendChild(card);
    });
  }

  /* ---------- 第 2 關 ---------- */
  function renderIcons() {
    $$('svg[data-icon]').forEach(function (svg) {
      var ic = ICONS[svg.getAttribute('data-icon')];
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', ic.color);
      svg.setAttribute('stroke-width', '1.8'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', ic.label);
      svg.innerHTML = ic.body;
    });
  }

  /* ---------- 第 3 關 ---------- */
  function renderIdioms() {
    var box = $('#idioms'); box.innerHTML = '';
    G.IDIOMS.forEach(function (it, ri) {
      var row = document.createElement('div'); row.className = 'idiom';
      row.innerHTML = '<span class="idiom-no">' + (ri + 1) + '</span>';
      var cells = document.createElement('div'); cells.className = 'cells';
      it.chars.forEach(function (ch) {
        if (ch) { var c = document.createElement('div'); c.className = 'cell'; c.textContent = ch; cells.appendChild(c); return; }
        var v = state.slots[ri];
        var s = document.createElement('button');
        s.className = 'cell slot' + (v ? ' filled' : '');
        s.setAttribute('data-testid', 'slot-' + ri);
        s.textContent = v || '？';
        s.setAttribute('aria-label', v ? '第 ' + (ri + 1) + ' 句填了「' + v + '」，點一下拿回來' : '第 ' + (ri + 1) + ' 句的空格');
        s.addEventListener('click', function () { if (state.slots[ri]) { state.slots[ri] = null; renderStage3(); } });
        cells.appendChild(s);
      });
      row.appendChild(cells);
      box.appendChild(row);
    });
  }
  function renderTiles() {
    var box = $('#tiles'); box.innerHTML = '';
    G.TILES.forEach(function (ch) {
      var b = document.createElement('button');
      b.className = 'tile'; b.textContent = ch; b.setAttribute('data-testid', 'tile-' + ch);
      var used = state.slots.indexOf(ch) !== -1;
      b.disabled = used;
      if (used) b.setAttribute('aria-label', '「' + ch + '」已放上');
      b.addEventListener('click', function () {
        var k = state.slots.findIndex(function (v) { return !v; });
        if (k === -1) { feedback('四格都填滿了，點格子可以把字拿回來。', false); return; }
        state.slots[k] = ch; renderStage3();
      });
      box.appendChild(b);
    });
    $('#filledCount').textContent = state.slots.filter(Boolean).length;
  }
  function renderStage3() { renderIdioms(); renderTiles(); }

  /* ---------- 第 4 關 ---------- */
  function renderTicks() {
    var g = $('#ticks'); var html = '';
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6, r2 = i % 3 === 0 ? 72 : 79;
      html += '<line x1="' + (100 + 86 * Math.sin(a)).toFixed(1) + '" y1="' + (100 - 86 * Math.cos(a)).toFixed(1) + '" x2="' + (100 + r2 * Math.sin(a)).toFixed(1) + '" y2="' + (100 - r2 * Math.cos(a)).toFixed(1) + '" stroke-width="' + (i % 3 === 0 ? 3 : 2) + '"/>';
    }
    g.innerHTML = html;
  }
  function renderClock() {
    var t = state.time, a = G.handAngles(t.h, t.m);
    $('#hourHand').style.transform = 'rotate(' + a.hour + 'deg)';
    $('#minHand').style.transform = 'rotate(' + a.minute + 'deg)';
    var txt = G.pad2(t.h) + ':' + G.pad2(t.m);
    $('#timeText').textContent = txt;
    $('#clock').setAttribute('aria-label', '時鐘顯示 ' + t.h + ' 點 ' + t.m + ' 分');
    $('#timeStatus').innerHTML = G.isTargetTime(t.h, t.m)
      ? '<span class="ok-chip"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>撥對了！</span>'
      : '目標：<b style="color:var(--green)">09:28</b>';
  }

  /* ---------- 驗證 ---------- */
  function checkCurrent() {
    var r;
    if (current === 's1') r = G.checkStage1(state.picks, $('#s1code').value);
    else if (current === 's2') r = G.checkStage2({ chalk: $('#s2chalk').value, globe: $('#s2globe').value, ruler: $('#s2ruler').value, code: $('#s2code').value });
    else if (current === 's3') r = G.checkStage3(state.slots);
    else if (current === 's4') r = G.checkStage4(state.time, $('#s4angle').value);
    if (!r) return;
    if (!r.ok) { feedback(r.message, false); return; }
    feedback('', true);
    var n = stageNo(current);
    if (current === 's3') $('#idioms').classList.add('glow');
    state.solved = Math.max(state.solved, n);
    save();
    renderKeys();
    var k = G.KEYS[n - 1];
    var rk = $('#rewardKey'); rk.textContent = k.ch; rk.style.setProperty('--c', k.color);
    $('#rewardMsg').textContent = r.message;
    $('#rewardNext').textContent = n === 4 ? '打開時光寶盒' : '前往第 ' + (n + 1) + ' 關';
    openOverlay('#rewardOverlay', '#rewardNext');
  }

  /* ---------- 提示 ---------- */
  function renderHints() {
    var n = stageNo(current), list = G.HINTS[n] || [], shown = state.hintShown[n] || 1;
    var ol = $('#hintList'); ol.innerHTML = '';
    list.slice(0, shown).forEach(function (h) { var li = document.createElement('li'); li.textContent = h; ol.appendChild(li); });
    $('#hintMore').hidden = shown >= list.length;
  }

  var lastFocus = null;
  function openOverlay(sel, focusSel) {
    lastFocus = document.activeElement;
    $(sel).classList.add('open');
    var f = $(focusSel); if (f) f.focus();
  }
  function closeOverlay(sel) {
    $(sel).classList.remove('open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- 謝師卡 ---------- */
  var DEFAULT_MSG = '謝謝老師春風化雨、悉心教導！\n祝您教師節快樂，天天順心！';
  function cardData() {
    return {
      teacher: state.card.teacher.trim() || '老師',
      student: state.card.student.trim() || '學生',
      msg: state.card.msg.trim() || DEFAULT_MSG
    };
  }
  function renderCard() {
    var d = cardData();
    $('#pvTeacher').textContent = d.teacher;
    $('#pvStudent').textContent = d.student;
    $('#pvMsg').textContent = d.msg;
  }

  function wrapLines(ctx, text, maxW) {
    var out = [];
    text.split('\n').forEach(function (para) {
      var line = '';
      Array.from(para).forEach(function (ch) {
        if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; }
        else line += ch;
      });
      out.push(line);
    });
    return out;
  }

  function drawCard() {
    var d = cardData();
    var W = 1080, H = 1350, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    var hand = '"Iansui", "Noto Sans TC", serif';
    x.fillStyle = '#1d3629'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#6b4428'; x.fillRect(0, H - 110, W, 110);
    x.fillStyle = '#8b5e3c'; x.fillRect(0, H - 110, W, 14);
    x.fillStyle = '#f2d479'; x.font = '52px ' + hand; x.textAlign = 'center';
    x.fillText('教師節快樂', W / 2, 130);
    var keyColors = G.KEYS.map(function (k) { return k.color; });
    G.KEYS.forEach(function (k, i) {
      var cx = W / 2 - 180 + i * 120, cy = 215;
      x.beginPath(); x.arc(cx, cy, 42, 0, Math.PI * 2); x.fillStyle = keyColors[i]; x.fill();
      x.fillStyle = '#1d3629'; x.font = '44px ' + hand; x.fillText(k.ch, cx, cy + 15);
    });
    // 卡片
    var px = 90, py = 310, pw = W - 180, ph = 800;
    x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 40; x.shadowOffsetY = 16;
    x.fillStyle = '#f2d479'; x.fillRect(px - 16, py - 16, pw + 32, ph + 32); x.restore();
    x.fillStyle = '#f7f1e1'; x.fillRect(px, py, pw, ph);
    x.textAlign = 'left'; x.fillStyle = '#7a5134'; x.font = '56px ' + hand;
    x.fillText('親愛的 ' + d.teacher + '：', px + 60, py + 120);
    x.fillStyle = '#2b2a26'; x.font = '50px ' + hand;
    var lines = wrapLines(x, d.msg, pw - 120).slice(0, 8);
    lines.forEach(function (l, i) { x.fillText(l, px + 60, py + 230 + i * 78); });
    x.textAlign = 'right'; x.fillStyle = '#7a5134'; x.font = '50px ' + hand;
    x.fillText('—— ' + d.student + ' 敬上', px + pw - 60, py + ph - 70);
    x.textAlign = 'center'; x.fillStyle = '#fbf6ec'; x.font = '32px ' + hand;
    x.fillText('時光黑板上的神秘留信 · 國小教材／巧茹老師製作', W / 2, H - 42);
    return c;
  }

  function downloadCard() {
    var ready = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('50px "Iansui"'), document.fonts.ready]) : Promise.resolve();
    ready.catch(function () {}).then(function () {
      var c = drawCard();
      var name = 'teachers-day-card.png'; // 部分瀏覽器不支援中文檔名，改用英文避免變成「download」
      c.toBlob(function (blob) {
        if (!blob) { toast('卡片產生失敗，請再試一次'); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = name;
        document.body.appendChild(a); a.click();
        setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 4000);
        toast('卡片已下載！');
      }, 'image/png');
    });
  }

  function shareGame() {
    var url = location.href.split('#')[0];
    var data = { title: '時光黑板上的神秘留信', text: '教師節解謎遊戲，一起來集齊四把鑰匙！', url: url };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast('遊戲連結已複製！'); }, function () { window.prompt('複製這個連結：', url); });
    } else window.prompt('複製這個連結：', url);
  }

  function resetAll() {
    state.solved = 0; state.picks = {}; state.slots = [null, null, null, null]; state.time = { h: 9, m: 0 };
    state.hintShown = { 1: 1, 2: 1, 3: 1, 4: 1 };
    $$('input.num-input').forEach(function (i) { i.value = ''; });
    $$('[data-feedback]').forEach(function (f) { f.textContent = ''; });
    $('#idioms').classList.remove('glow');
    save(); renderRiddles(); renderStage3(); renderClock(); renderIntro();
  }

  /* ---------- 綁定 ---------- */
  function bind() {
    $('#startBtn').addEventListener('click', function () { show(SCREENS[Math.min(state.solved + 1, 5)]); });
    $('#resetBtn').addEventListener('click', function () { resetAll(); show('s1'); });
    $('#restartBtn').addEventListener('click', function () { resetAll(); show('intro'); });
    $$('[data-back]').forEach(function (b) { b.addEventListener('click', function () { renderIntro(); show('intro'); }); });
    $$('[data-check]').forEach(function (b) { b.addEventListener('click', checkCurrent); });
    $$('[data-hint]').forEach(function (b) { b.addEventListener('click', function () { renderHints(); openOverlay('#hintOverlay', '#hintClose'); }); });
    $('#hintClose').addEventListener('click', function () { closeOverlay('#hintOverlay'); });
    $('#hintMore').addEventListener('click', function () { var n = stageNo(current); state.hintShown[n] = (state.hintShown[n] || 1) + 1; renderHints(); });
    $('#rewardNext').addEventListener('click', function () {
      closeOverlay('#rewardOverlay');
      show(SCREENS[Math.min(state.solved + 1, 5)]);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if ($('#hintOverlay').classList.contains('open')) closeOverlay('#hintOverlay');
    });
    $$('.overlay').forEach(function (o) { o.addEventListener('click', function (e) { if (e.target === o && o.id === 'hintOverlay') closeOverlay('#hintOverlay'); }); });
    $$('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-step').split(','), d = parseInt(p[1], 10);
        state.time = p[0] === 'h' ? G.normalizeTime(state.time.h + d, state.time.m) : G.normalizeTime(state.time.h, state.time.m + d);
        renderClock();
      });
    });
    // Enter 直接驗證
    $$('input.num-input').forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); checkCurrent(); } }); });
    [['#inTeacher', 'teacher'], ['#inStudent', 'student'], ['#inMsg', 'msg']].forEach(function (p) {
      var el = $(p[0]); el.value = state.card[p[1]] || '';
      el.addEventListener('input', function () { state.card[p[1]] = el.value; renderCard(); save(); });
    });
    $('#downloadBtn').addEventListener('click', downloadCard);
    $('#shareBtn').addEventListener('click', shareGame);
  }

  load();
  renderIcons(); renderTicks(); renderRiddles(); renderStage3(); renderClock(); renderCard(); renderIntro(); renderKeys();
  bind();
  window.__game = { state: state, show: show }; // 測試用
})();
