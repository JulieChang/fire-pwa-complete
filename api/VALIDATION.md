# 驗證記錄

日期：2026-09-09。執行環境：Node 24.19.0；React 18.3.1、Vite 5.4.11（依原專案宣告版本）。

## 安裝

- 原始 `npm ci` 失敗：package.json 宣告 React 18／Vite 5，鎖檔卻是 React 19／Vite 8。
- 依 package.json 宣告重新產生一致鎖檔，Node 更新為 Vercel 支援的 24.x。
- 最終 `npm ci --ignore-scripts --no-audit --no-fund` 成功。

## 程式測試

`npm test`：12 項通過。

- 年終與年度收入不增加本月可用現金。
- 預設案例：月餘額 15,000，補現金 9,000，投資 6,000，旅遊 0。
- 月餘額為零或負數時沒有新投入。
- 120 組分配情境（現金水位、收入、小數、最低投入及退休目標組合）均沒有超支；整數分配加總等於可分配整數金額。
- 使用者更高的現金目標能影響分配。
- 0% 年報酬時本金＋月投入正確；負報酬、異常儲存值不產生 NaN／Infinity。
- 已到或超過退休年齡不繼續增加投入。
- 旅遊基金在總淨資產只計一次，不計入預備金月數或退休本金。
- 投資上下限與輸入範圍驗證。
- 扶養責任與收入穩定性影響現金基準。
- 未設定 CRON_SECRET 時拒絕發文入口；正確 header／query／body secret 仍相容。

## 建置與靜態輸出

`npm run build` 及 `npm run verify` 通過。

- 15 個正式公開路由與 404 頁面。
- 每頁 HTML 含 h1 與正文，獨立 title、description、canonical、Open Graph、JSON-LD。
- 所有渲染頁的站內連結及靜態資產均能在產物中解析。
- sitemap 包含全部正式頁面。
- ads.txt 為既有 publisher ID 的正確格式；meta verification 已加入。
- 未提前載入 AdSense 廣告腳本。
- 舊短網址 redirect 目標存在；未知頁面有 noindex 404 內容，不再把任意 URL 導向存錢文章。
- dist 不含舊 ZIP、package.json、鎖檔、vercel.json、vite.config.js 等不應公開的檔案。
- Analytics 保留既有 G-ID 與 UTM 白名單；一般 query 參數不送入 page_location。未新增傳送財務數值的事件。

## 未在本次驗證的範圍

- 真實手機或桌面瀏覽器的端到端操作與視覺驗收。
- 正式站 HTTP、Vercel 部署路由與設定是否被後台覆蓋。
- Google 實際索引、AdSense 帳戶 publisher ID、審核通過或廣告收入。
- 真實 Threads 發文、OAuth、Redis、OpenAI API 及金流。
- 依賴套件的完整弱點稽核；付費上線前應另安排相容性與資安維護。

以上未驗證項目不能由本機建置成功推論已完成；請依 README 的預覽部署與正式站檢查步驟驗收。
