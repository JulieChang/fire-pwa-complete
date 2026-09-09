# Personal FinOps Planner 修正版

2026-09-09｜可產品化基礎版。保留原本 Vercel 網站與 Threads 自動發文架構。這份交付未部署到正式站，也未申請 AdSense 複審或啟用收費。

## 已修正

1. 本月可分配金額只使用固定實領月收入；獎金仍用於全年收入與收入倍數。
2. 三個資金桶不超過本月可用現金。現金目標生效，投資上下限有驗證，零報酬與負報酬情境有測試。
3. 投資資產作為退休目前進度與預估的同一本金口徑；預備金不自動當作退休投資本金。
4. 每頁生成完整 HTML、專屬 title／description／canonical／Open Graph 和結構化資料，包含 15 個公開頁及 404。舊文章短網址永久轉向正式文章網址。
5. 保留 `public/ads.txt` 既有 publisher ID，加入 AdSense 所有權 meta 驗證。沒有注入廣告腳本，避免尚未完成審核就放置廣告。
6. 補強 8 篇文章的情境案例、加入計算方法、資料來源與限制頁，更新關於本站和隱私權說明。
7. 修復 package.json 與 package-lock.json 不一致的安裝問題；Node 指定 24.x。移除 public 裡會對外發布的舊 ZIP 與重複設定。
8. Threads 發文授權改為缺少 CRON_SECRET 就拒絕存取。既有帶正確 secret 的 header／query／body 方式繼續相容。未呼叫真實 OpenAI、Threads 或 Redis，未發出任何貼文。

## 資料口徑變更，請注意

- 現金存款：填可當緊急預備金的部分。
- 目前旅遊基金：獨立用途的現金，另行填寫；計入總淨資產，但不重複計入緊急預備金或可投資資產。
- 若以前將旅遊基金也算在現金存款裡，升級後請手動拆開金額。沿用舊的本機儲存鍵，資料不會自動刪除。
- 退休目前進度改用投資資產，所以可能比舊版低；這是統一計算口徑，不是資產減少。
- 貸款未填實際本金時仍以月繳乘剩餘期數估算；已明確提示這包含未來利息，會低估淨資產。
- 自訂 A 階層、收入倍數與綜合分數不是官方或驗證過的個人排名。家庭統計為 2021 年底的歷史參考。

## 不安裝 GitHub 連接器，也能上傳更新

1. 解壓縮 ZIP。打開 `fire-pwa-complete-main`，其中 `package.json`、`vercel.json`、`src`、`public`、`api`、`scripts` 都屬於專案。
2. 在 GitHub 網站開啟原專案，先建立修正分支；用 Add file → Upload files 上傳修改與新增檔案，保留相同目錄。不要只把 ZIP 放進儲存庫，也不要額外包一層目錄。
3. 網頁上傳不會刪除舊檔。請依 `CHANGES.json` 的 `removed` 清單刪除已移除的檔案，尤其 public 裡的舊 ZIP、index.html 與 package 設定副本。避免舊 index.html 或公開 ZIP 留在部署裡。
4. 讓 Vercel 產生預覽部署。專案根目錄應為 package.json 所在目錄；Build Command 為 `npm run build`，Output Directory 為 `dist`，Node 為 24.x。若 Vercel 設定手動覆蓋這些值，請同步調整。
5. 原有環境變數留在 Vercel；確認 CRON_SECRET 已設定成足夠長的隨機值，否則新版會拒絕自動發文。不要把正式 API key、token 或 `.env` 上傳 GitHub。既有 secret 如曾出現在公開分享網址，請更新並同步調整呼叫端。
6. 預覽驗收後再合併到正式分支。可用 Vercel 的上一個成功部署回復舊版。未連接你的帳號，所以本次沒有代你完成以上外部操作。

## 本機驗證

需要 Node 24.x。未新增 React 或 Vite 套件版本；依原 package.json 修復鎖檔。

```sh
npm ci
npm test
npm run build
npm run verify
```

本次包含的 `dist` 是靜態前端產物；僅部署 dist 不包含 `api` 的 Threads 發文與 token 功能。要維持完整網站，請使用整個專案由 Vercel 建置。`dist` 不需要上傳 GitHub，正式部署會重新產生。

## 正式站與 AdSense 驗收

- 首頁與文章可直接開啟；「檢視原始碼」可看到 h1 與文章正文，而非只有空 root。
- 每篇文章 canonical 指向自己，舊 `/monthly-saving-rate` 轉向 `/blog/monthly-saving-rate`。
- `/ads.txt` 回傳純文字一行，publisher ID 應與你的 AdSense 帳戶完全相同：`pub-8822390092931181`。本次沿用原始碼的 ID，未登入帳戶驗證所有權。
- `/robots.txt`、`/sitemap.xml` 可以公開讀取；不存在的文章回傳 404，不再顯示另一篇文章。
- 確認原有聯絡頁 Facebook 連結是你可接收訊息的頁面；本次沒有登入驗證頁面管理權。
- 手機與桌面各操作一次：填入數字、按計算、重新整理、確認本機保存、分享與列印。
- 在 Search Console 檢查首頁及至少一篇文章、提交 sitemap，查看 Google 實際讀到的內容。技術修復不保證一定索引。
- AdSense → Sites → 你的網站，確認所有權／ads.txt 狀態、檢視低價值內容問題；確認正式站已有修正版後再 Request review。截圖上方若仍要求付款資料，請在自己的帳戶中完成。
- 若未來啟用廣告，另行設定廣告版位、適用的 Google 認證 CMP 與政策，避免廣告遮擋輸入與結果。這版未承諾或取得 AdSense 批准。

## 產品化

請閱讀 `PRODUCT-ROADMAP.md`：包含免費與付費功能分界、方案比較、按月事件模型、回訪驗證、帳號／資料／金流依賴與 AI 成本品質管理。尚未實作的功能不會在網站上假裝可以購買。

## 官方參考

- Google AdSense 審核：https://support.google.com/adsense/answer/12176698?hl=en
- 所有權驗證方式：https://support.google.com/adsense/answer/12169212?hl=en
- 隱私權揭露：https://support.google.com/adsense/answer/1348695?hl=en
- JavaScript 與搜尋：https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Vercel Node 版本：https://vercel.com/docs/functions/runtimes/node-js/node-js-versions

## 驗證範圍

測試詳見 `VALIDATION.md`。本次未登入 AdSense／Vercel，未測試真實金流、OAuth 授權、OpenAI 費用或 Threads 發文，也未完成真實手機瀏覽器端到端驗收。
