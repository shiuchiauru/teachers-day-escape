import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function solveStage1(page) {
  await page.getByTestId('opt-a-拿').click();
  await page.getByTestId('opt-b-明').click();
  await page.getByTestId('opt-c-思').click();
  await page.getByTestId('s1-code').fill('27');
  await page.getByTestId('s1-check').click();
  await page.getByTestId('reward-next').click();
}
async function solveStage2(page) {
  await page.getByTestId('s2-chalk').fill('8');
  await page.getByTestId('s2-globe').fill('4');
  await page.getByTestId('s2-ruler').fill('12');
  await page.getByTestId('s2-code').fill('80');
  await page.getByTestId('s2-check').click();
  await page.getByTestId('reward-next').click();
}
async function solveStage3(page) {
  for (const ch of ['門', '化', '益', '不']) await page.getByTestId('tile-' + ch).click();
  await page.getByTestId('s3-check').click();
  await page.getByTestId('reward-next').click();
}
async function solveStage4(page) {
  for (let i = 0; i < 5; i++) await page.getByTestId('m5-plus').click();
  for (let i = 0; i < 3; i++) await page.getByTestId('m1-plus').click();
  await expect(page.getByTestId('s4-time')).toHaveText('09:28');
  await page.getByTestId('s4-angle').fill('90');
  await page.getByTestId('s4-check').click();
  await page.getByTestId('reward-next').click();
}

test('完整通關流程：四把鑰匙 → 時光寶盒 → 下載謝師卡', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /時光黑板上的/ })).toBeVisible();
  await page.getByTestId('start').click();
  await expect(page.getByRole('heading', { name: '三道字謎' })).toBeVisible();
  await solveStage1(page);
  await expect(page.getByRole('heading', { name: '講台上的天平' })).toBeVisible();
  await solveStage2(page);
  await expect(page.getByRole('heading', { name: '敬師成語法陣' })).toBeVisible();
  await solveStage3(page);
  await expect(page.getByRole('heading', { name: '時光時鐘' })).toBeVisible();
  await solveStage4(page);
  await expect(page.getByRole('heading', { name: '時光寶盒打開了！' })).toBeVisible();
  await expect(page.locator('#final [data-keys] .key.done')).toHaveCount(4);

  await page.getByTestId('in-teacher').fill('林老師');
  await page.getByTestId('in-student').fill('小明');
  await expect(page.getByTestId('postcard')).toContainText('親愛的 林老師');
  await expect(page.getByTestId('postcard')).toContainText('小明 敬上');

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download').click()]);
  expect(download.suggestedFilename()).toBe('teachers-day-card.png');
});

test('第 1 關答錯會顯示提示訊息，不會進下一關', async ({ page }) => {
  await page.getByTestId('start').click();
  await page.getByTestId('s1-check').click();
  await expect(page.locator('#s1 [data-feedback]')).toHaveText(/3 題字謎沒選字/);
  await page.getByTestId('opt-a-合').click();
  await page.getByTestId('opt-b-明').click();
  await page.getByTestId('opt-c-思').click();
  await page.getByTestId('s1-code').fill('27');
  await page.getByTestId('s1-check').click();
  await expect(page.locator('#s1 [data-feedback]')).toHaveText(/謎一/);
  await expect(page.locator('#rewardOverlay')).not.toHaveClass(/open/);
});

test('第 2 關畫面不會洩漏答案數值', async ({ page }) => {
  await page.getByTestId('start').click();
  await solveStage1(page);
  const text = await page.locator('#s2').innerText();
  expect(text).not.toMatch(/粉筆盒\s*[:：=＝]\s*8/);
  expect(text).not.toContain('80');
});

test('第 3 關：點格子可以把字拿回來', async ({ page }) => {
  await page.evaluate(() => { window.__game.state.solved = 2; window.__game.show('s3'); });
  await page.getByTestId('tile-心').click();
  await expect(page.getByTestId('slot-0')).toHaveText('心');
  await expect(page.getByTestId('tile-心')).toBeDisabled();
  await page.getByTestId('slot-0').click();
  await expect(page.getByTestId('slot-0')).toHaveText('？');
  await expect(page.getByTestId('tile-心')).toBeEnabled();
});

test('第 4 關：題目不再寫出「直角」，時間沒撥對不能過關', async ({ page }) => {
  await page.evaluate(() => { window.__game.state.solved = 3; window.__game.show('s4'); });
  await expect(page.locator('#s4 .question')).not.toContainText('直角');
  await page.getByTestId('s4-angle').fill('90');
  await page.getByTestId('s4-check').click();
  await expect(page.locator('#s4 [data-feedback]')).toHaveText(/9 點 28 分/);
  await page.getByTestId('h-plus').click();
  await expect(page.getByTestId('s4-time')).toHaveText('10:00');
});

test('提示可以一個一個打開', async ({ page }) => {
  await page.getByTestId('start').click();
  await page.locator('#s1 [data-hint]').click();
  await expect(page.getByTestId('hint-list').locator('li')).toHaveCount(1);
  await page.locator('#hintMore').click();
  await expect(page.getByTestId('hint-list').locator('li')).toHaveCount(2);
  await page.locator('#hintClose').click();
  await expect(page.locator('#hintOverlay')).not.toHaveClass(/open/);
});

test('重新整理後會記得進度，可以繼續或從頭開始', async ({ page }) => {
  await page.getByTestId('start').click();
  await solveStage1(page);
  await page.reload();
  await expect(page.getByTestId('start')).toContainText('繼續第 2 關');
  await page.getByTestId('start').click();
  await expect(page.getByRole('heading', { name: '講台上的天平' })).toBeVisible();
});

test('手機寬度下沒有水平捲軸', async ({ page }) => {
  for (const id of ['intro', 's1', 's2', 's3', 's4', 'final']) {
    await page.evaluate((s) => window.__game.show(s), id);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, id).toBeLessThanOrEqual(0);
  }
});
