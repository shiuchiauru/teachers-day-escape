const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../../public/logic.js');

const RIGHT = { a: '拿', b: '明', c: '思' };

test('答案常數正確：筆畫 10+8+9=27、(8+12)×4=80', () => {
  assert.equal(G.STAGE1_CODE, 27);
  assert.equal(G.STAGE2_CODE, 80);
  assert.equal(G.TOOLS.chalk + G.TOOLS.globe, 12);
  assert.equal(G.TOOLS.chalk - G.TOOLS.globe, 4);
  assert.equal(G.TOOLS.ruler, G.TOOLS.globe * 3);
});

test('每題字謎的答案都在選項裡', () => {
  G.RIDDLES.forEach((r) => assert.ok(r.options.includes(r.answer)));
});

test('toInt 支援全形數字與空白，拒絕非數字', () => {
  assert.equal(G.toInt(' 27 '), 27);
  assert.equal(G.toInt('２７'), 27);
  assert.ok(Number.isNaN(G.toInt('')));
  assert.ok(Number.isNaN(G.toInt('2a')));
  assert.ok(Number.isNaN(G.toInt(null)));
  assert.ok(Number.isNaN(G.toInt(undefined)));
});

test('第 1 關：各種錯誤與正確情況', () => {
  assert.match(G.checkStage1({}, '27').message, /3 題/);
  assert.match(G.checkStage1(undefined, '27').message, /3 題/);
  assert.match(G.checkStage1({ a: '合', b: '明', c: '思' }, '27').message, /謎一/);
  assert.match(G.checkStage1(RIGHT, '').message, /輸入/);
  assert.match(G.checkStage1(RIGHT, '26').message, /筆畫/);
  assert.equal(G.checkStage1(RIGHT, '27').ok, true);
  assert.equal(G.checkStage1(RIGHT, '２７').ok, true);
});

test('第 2 關：密碼正確即過關，錯誤時指出哪個教具算錯', () => {
  assert.equal(G.checkStage2({ code: '80' }).ok, true);
  assert.equal(G.checkStage2({ chalk: '8', globe: '4', ruler: '12', code: '80' }).ok, true);
  assert.match(G.checkStage2({}).message, /密碼/);
  assert.match(G.checkStage2(undefined).message, /密碼/);
  assert.match(G.checkStage2({ chalk: '9', globe: '4', ruler: '12', code: '84' }).message, /粉筆盒/);
  assert.match(G.checkStage2({ chalk: '8', globe: '4', ruler: '12', code: '56' }).message, /括號/);
});

test('第 3 關：未填滿、填錯、全對', () => {
  assert.match(G.checkStage3([null, null, null, null]).message, /4 格/);
  assert.match(G.checkStage3(undefined).message, /4 格/);
  assert.match(G.checkStage3(['門', '化', '不', '益']).message, /第 3、4 句/);
  assert.equal(G.checkStage3(['門', '化', '益', '不']).ok, true);
  assert.equal(G.TILES.length, 6);
  G.IDIOMS.forEach((it) => assert.ok(G.TILES.includes(it.answer)));
});

test('時間正規化：分鐘進位、借位與 12 小時循環', () => {
  assert.deepEqual(G.normalizeTime(9, 60), { h: 10, m: 0 });
  assert.deepEqual(G.normalizeTime(9, -1), { h: 8, m: 59 });
  assert.deepEqual(G.normalizeTime(12, 60), { h: 1, m: 0 });
  assert.deepEqual(G.normalizeTime(1, -5), { h: 12, m: 55 });
  assert.deepEqual(G.normalizeTime(0, 0), { h: 12, m: 0 });
  assert.deepEqual(G.normalizeTime(13, 0), { h: 1, m: 0 });
});

test('指針角度與較小夾角', () => {
  assert.deepEqual(G.handAngles(9, 0), { hour: 270, minute: 0 });
  assert.equal(G.smallerAngle(9, 0), 90);
  assert.equal(G.smallerAngle(3, 0), 90);
  assert.equal(G.smallerAngle(6, 0), 180);
  assert.equal(G.smallerAngle(12, 0), 0);
  assert.equal(G.smallerAngle(9, 28), 116);
  assert.equal(G.ANGLE_AT_NINE, G.smallerAngle(9, 0));
});

test('第 4 關：時間與角度都要對', () => {
  assert.match(G.checkStage4({ h: 9, m: 0 }, '90').message, /9 點 28 分/);
  assert.match(G.checkStage4(undefined, '90').message, /9 點 28 分/);
  assert.match(G.checkStage4({ h: 9, m: 28 }, '').message, /幾度/);
  assert.match(G.checkStage4({ h: 9, m: 28 }, '45').message, /30 度/);
  assert.equal(G.checkStage4({ h: 9, m: 28 }, '90').ok, true);
});

test('提示與鑰匙資料完整', () => {
  [1, 2, 3, 4].forEach((n) => assert.ok(G.HINTS[n].length >= 3));
  assert.deepEqual(G.KEYS.map((k) => k.ch), ['智', '仁', '勇', '德']);
  assert.equal(G.pad2(5), '05');
  assert.equal(G.pad2(28), '28');
  assert.equal(G.isTargetTime(9, 28), true);
  assert.equal(G.isTargetTime(9, 27), false);
});

test('提示不能直接說出答案數字', () => {
  const all = Object.values(G.HINTS).flat().join('');
  ['27', '80', '90 度'].forEach((s) => assert.ok(!all.includes(s), '提示裡出現了 ' + s));
});
