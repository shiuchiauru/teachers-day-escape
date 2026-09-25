# 時光黑板上的神秘留信

教師節（9 月 28 日）國語 × 數學解謎遊戲，手機直式版。學生解開四道關卡、集齊「智、仁、勇、德」四把鑰匙，最後打開時光寶盒，寫一張謝師卡下載送給老師。

## 功能

| 關卡 | 內容 | 答案 |
| --- | --- | --- |
| 第 1 關 · 智 | 三道字謎，選字、數筆畫、加總 | 拿（10）＋明（8）＋思（9）＝ **27** |
| 第 2 關 · 仁 | 教具天平，推算數值 | 粉筆盒 8、地球儀 4、三角尺 12；（8＋12）× 4 ＝ **80** |
| 第 3 關 · 勇 | 補完敬師成語 | 桃李滿**門**、春風**化**雨、良師**益**友、誨人**不**倦 |
| 第 4 關 · 德 | 撥時鐘到 9:28，回答 9 點整的夾角 | **90** 度 |

- 每關都有分段提示，一次只給一個，提示裡不會直接寫出答案
- 答錯會告訴學生錯在哪裡（例如「謎一的字再想一想」），不會只說「錯了」
- 答對會跳出拿到鑰匙的動畫，頁首的鑰匙進度也會亮起來
- 重新整理頁面後，會記得已經拿到的鑰匙和寫到一半的卡片
- 謝師卡會即時預覽，可以下載成 PNG 圖片（1080×1350）
- 「分享遊戲」在手機上會開啟系統分享，電腦上會複製連結

## 專案結構

```
public/          要部署的靜態網站
  index.html     畫面與樣式
  app.js         畫面互動
  logic.js       題目、答案與判斷規則（純函式，可單元測試）
tests/unit/      logic.js 的單元測試（node:test）
tests/e2e/       Playwright 端對端測試（iPhone 13 尺寸）
scripts/serve.mjs  本機預覽伺服器
wrangler.jsonc   Cloudflare Workers 靜態資產設定
```

要改題目或答案，只要改 `public/logic.js`。

## 本機預覽

需要 Node.js 20 以上（建議用 nvm 安裝）。

```bash
npm install
npm start          # 開啟 http://localhost:8787
```

## 測試

```bash
npm test           # 單元測試＋覆蓋率，接著跑端對端測試
npm run test:unit
npm run test:e2e
```

目前 `logic.js` 的行覆蓋率 99%、函式覆蓋率 100%，端對端測試包含完整通關、答錯回饋、提示、進度保存、卡片下載、手機寬度不出現水平捲軸。

## 部署到 Cloudflare Workers

沿用原本的 Worker 名稱 `teachers-day-escape`，部署後會直接取代 <https://teachers-day-escape.friends69096.workers.dev/> 上的舊版：

```bash
npx wrangler login
npm run deploy
```

如果原本的 Worker 有自己的 `wrangler` 設定或 Worker 程式碼，請先備份，再把 `public/` 裡的三個檔案放到原專案的靜態資產資料夾。

## 授權

MIT
