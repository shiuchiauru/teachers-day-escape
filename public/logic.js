/* 時光黑板上的神秘留信 — 遊戲規則與答案判斷（純函式，瀏覽器與 Node 共用） */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GameLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var RIDDLES = [
    { id: 'a', tag: '謎一', q: '一人一張口，下面長隻手', options: ['拿', '合', '捉', '攀'], answer: '拿', strokes: 10,
      hint: '「人、一、口」合起來是「合」，下面再加一隻「手」。' },
    { id: 'b', tag: '謎二', q: '日光加月光，照亮全世界', options: ['星', '明', '晴', '朝'], answer: '明', strokes: 8,
      hint: '左邊一個「日」，右邊一個「月」。' },
    { id: 'c', tag: '謎三', q: '十口心思，思國思家思社稷', options: ['想', '念', '思', '恩'], answer: '思', strokes: 9,
      hint: '「十」和「口」疊成「田」，下面加一顆「心」。' }
  ];
  var STAGE1_CODE = RIDDLES.reduce(function (s, r) { return s + r.strokes; }, 0); // 27

  var TOOLS = { chalk: 8, globe: 4, ruler: 12 };
  var STAGE2_CODE = (TOOLS.chalk + TOOLS.ruler) * TOOLS.globe; // 80

  var IDIOMS = [
    { chars: ['桃', '李', '滿', null], answer: '門' },
    { chars: ['春', '風', null, '雨'], answer: '化' },
    { chars: ['良', '師', null, '友'], answer: '益' },
    { chars: ['誨', '人', null, '倦'], answer: '不' }
  ];
  var TILES = ['心', '化', '門', '道', '不', '益'];

  var TARGET_TIME = { h: 9, m: 28 };
  var ANGLE_AT_NINE = 90;

  var KEYS = [
    { ch: '智', name: '字謎', color: '#f2d479' },
    { ch: '仁', name: '天平', color: '#f4a9a0' },
    { ch: '勇', name: '成語', color: '#9fd0ea' },
    { ch: '德', name: '時鐘', color: '#b9e3a6' }
  ];

  var HINTS = {
    1: [RIDDLES[0].hint, RIDDLES[1].hint, RIDDLES[2].hint, '找到三個字以後，一筆一筆數清楚，再把三個筆畫數加起來。'],
    2: ['先看線索 1 和線索 2：兩個數加起來是 12、相減是 4。', '哪兩個數加起來 12、相差 4？大的是粉筆盒，小的是地球儀。', '三角尺是地球儀的 3 倍。最後記得先算括號裡面！'],
    3: ['老師教過的學生很多，就像桃樹李樹種滿了大「？」。', '好老師的教導像春天的風、及時的雨，讓學生慢慢變好。', '對我們有幫助的老師，也可以像朋友一樣。', '教人教不完、也不覺得累，就是「誨人不倦」。'],
    4: ['先按「時」把時針撥到 9，再按「分」把分針撥到 28。', '9 點整時，分針指著 12、時針指著 9。', '時鐘一圈 360 度，分成 12 大格，一大格是 30 度。從 12 到 9 較近的那邊有幾大格？']
  };

  function toInt(v) {
    if (v === null || v === undefined) return NaN;
    var s = String(v).trim().replace(/[０-９]/g, function (d) { return String.fromCharCode(d.charCodeAt(0) - 0xFEE0); });
    if (!/^-?\d+$/.test(s)) return NaN;
    return parseInt(s, 10);
  }

  /** picks: {a:'拿', b:'明', c:'思'}, code: 使用者輸入 */
  function checkStage1(picks, code) {
    picks = picks || {};
    var wrong = RIDDLES.filter(function (r) { return picks[r.id] !== r.answer; });
    var missing = RIDDLES.filter(function (r) { return !picks[r.id]; });
    if (missing.length) return { ok: false, message: '還有 ' + missing.length + ' 題字謎沒選字喔！' };
    if (wrong.length) return { ok: false, message: wrong.map(function (r) { return r.tag; }).join('、') + '的字再想一想。' };
    var n = toInt(code);
    if (isNaN(n)) return { ok: false, message: '請在下面輸入三個字的筆畫總和。' };
    if (n !== STAGE1_CODE) return { ok: false, message: '字都選對了！筆畫再數一次看看。' };
    return { ok: true, message: '答對了！拿到「智」之鑰。' };
  }

  /** vals: {chalk, globe, ruler, code} */
  function checkStage2(vals) {
    vals = vals || {};
    var code = toInt(vals.code);
    if (isNaN(code)) return { ok: false, message: '請算出最後的開鎖密碼。' };
    if (code === STAGE2_CODE) return { ok: true, message: '天平平衡了！拿到「仁」之鑰。' };
    var names = { chalk: '粉筆盒', globe: '地球儀', ruler: '三角尺' };
    var off = Object.keys(TOOLS).filter(function (k) {
      var n = toInt(vals[k]);
      return !isNaN(n) && n !== TOOLS[k];
    });
    if (off.length) return { ok: false, message: off.map(function (k) { return names[k]; }).join('、') + '的數字再檢查一次。' };
    return { ok: false, message: '密碼不對喔，記得先算括號裡面。' };
  }

  /** slots: 四個格子各放了哪個字（字串或 null） */
  function checkStage3(slots) {
    slots = slots || [];
    var filled = slots.filter(function (s) { return !!s; }).length;
    if (filled < IDIOMS.length) return { ok: false, message: '還有 ' + (IDIOMS.length - filled) + ' 格沒有填喔！' };
    var wrong = [];
    IDIOMS.forEach(function (it, i) { if (slots[i] !== it.answer) wrong.push(i + 1); });
    if (wrong.length) return { ok: false, message: '第 ' + wrong.join('、') + ' 句不太對，點格子可以把字拿回來。' };
    return { ok: true, message: '法陣亮起來了！拿到「勇」之鑰。' };
  }

  function normalizeTime(h, m) {
    while (m < 0) { m += 60; h -= 1; }
    while (m >= 60) { m -= 60; h += 1; }
    h = ((h - 1) % 12 + 12) % 12 + 1;
    return { h: h, m: m };
  }

  function handAngles(h, m) {
    return { hour: (h % 12) * 30 + m * 0.5, minute: m * 6 };
  }

  function smallerAngle(h, m) {
    var a = handAngles(h, m);
    var d = Math.abs(a.hour - a.minute) % 360;
    return d > 180 ? 360 - d : d;
  }

  function isTargetTime(h, m) { return h === TARGET_TIME.h && m === TARGET_TIME.m; }

  function checkStage4(time, angle) {
    time = time || {};
    if (!isTargetTime(time.h, time.m)) return { ok: false, message: '時鐘還沒撥到 9 點 28 分喔！' };
    var n = toInt(angle);
    if (isNaN(n)) return { ok: false, message: '請回答夾角是幾度。' };
    if (n !== ANGLE_AT_NINE) return { ok: false, message: '再想想：一大格是 30 度，數數看有幾大格。' };
    return { ok: true, message: '時光之門打開了！拿到「德」之鑰。' };
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  return {
    RIDDLES: RIDDLES, STAGE1_CODE: STAGE1_CODE, TOOLS: TOOLS, STAGE2_CODE: STAGE2_CODE,
    IDIOMS: IDIOMS, TILES: TILES, TARGET_TIME: TARGET_TIME, ANGLE_AT_NINE: ANGLE_AT_NINE,
    KEYS: KEYS, HINTS: HINTS,
    toInt: toInt, checkStage1: checkStage1, checkStage2: checkStage2, checkStage3: checkStage3,
    checkStage4: checkStage4, normalizeTime: normalizeTime, handAngles: handAngles,
    smallerAngle: smallerAngle, isTargetTime: isTargetTime, pad2: pad2
  };
});
