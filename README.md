# I-131 Ward Scheduler Demo

這個 repo 是 **碘-131 隔離病房排程系統的展示原型**。目前版本重點是把排程邏輯、畫面密度、管理流程與交接文件整理好，方便院內工程師接手評估與改版。

**Demo 網址**：https://purekboy-ui.github.io/I131-Ward-Scheduler/

## Demo 定位

- **用途**：展示排程流程、畫面配置、欄位需求與權限概念。
- **資料**：全部都是前端 mock data。
- **狀態**：可展示、可討論、可交接；**不是正式上線版**。
- **限制**：目前沒有正式後端、沒有正式登入、不能存放真實病患資料。

## 畫面總覽

| 畫面 | 作用 | 這版設計重點 |
| --- | --- | --- |
| 登入頁 | 進入 demo | 只保留最少資訊，方便院內工程師快速進站測試 |
| 預約排程 | 住院大劑量 / 門診小劑量月曆 | 預設一屏看完整月，優先讓人看到床位、病人、劑量、空床與未開床 |
| 預約管理 | 集中核對與收單 | 拿掉多餘裝飾，讓日期、病人、劑量、主治醫師更好掃描 |
| 報表中心 | 條件查詢與列印 | 讓工程師看清楚未來匯出需求與欄位組合 |
| 後台管理 | 醫師、床位開關、帳號 | 把日常維護入口集中，減少分散操作 |
| 操作紀錄 | 追蹤異動 | 保留誰改了什麼的概念，方便之後接正式稽核 |
| 訂藥管理 | 對照住院預約與訂藥狀態 | 劑量、劑型、Thyrogen、是否已訂藥集中顯示 |
| 小劑量預約 | 門診清單版操作 | 與住院分流，避免干擾床位月曆判讀 |

詳細畫面請看 [`docs/SCREEN_REFERENCE.md`](docs/SCREEN_REFERENCE.md)。

## 目前排程邏輯

1. **住院 / 門診新建預約一律先進待確認**。
2. **管理者核對病歷號、病人姓名、劑量、主治醫師後，才可收單改為已確認**。
3. **已確認後，一般使用者不能再編輯、刪除或移動該筆預約**。
4. **床位是否可排是日期 x 床位開關，不是只看星期**。
5. **門診小劑量預設可排任何未來日期**。
6. **主治醫師清單會同步反映在後台、預約表單、報表篩選**。

完整 SOP 請看 [`docs/SYSTEM_WORKFLOW.md`](docs/SYSTEM_WORKFLOW.md)。

## Demo 帳號

| 帳號 | 密碼 | 角色 | 用途 |
| --- | --- | --- | --- |
| `admin` | `admin` | 管理員 | 檢視完整功能、收單、後台維護 |
| `user` | `user` | 一般使用者 | 驗證一般排程與鎖定規則 |

> 程式內還保留 `super_editor`、`viewer` 角色結構，方便院內工程師後續擴充，但本 repo 預設只提供上面兩組 demo 帳號。

## 專案結構

目前瀏覽器實際載入的是下列三個檔案：

- `index.html`
- `styles.css`
- `app.js`

其他拆分的 JS 檔仍留在 repo 內當參考，但 **不是目前 demo live runtime**。

## 本地開啟方式

```bash
git clone https://github.com/purekboy-ui/I131-Ward-Scheduler.git
cd I131-Ward-Scheduler
npm install
npm run dev
```

如果只想快速打開靜態頁，也可以直接用任何靜態伺服器，例如：

```bash
npx http-server . -p 8080 -c-1
```

## 交接文件

- [`docs/ENGINEER_HANDOFF.md`](docs/ENGINEER_HANDOFF.md)：給院內工程師的技術交接總覽
- [`docs/SYSTEM_WORKFLOW.md`](docs/SYSTEM_WORKFLOW.md)：目前排程規則、權限與 SOP
- [`docs/SCREEN_REFERENCE.md`](docs/SCREEN_REFERENCE.md)：每個畫面用途、設計原因與截圖
- [`PROTOTYPE_HANDOFF_GUIDE.md`](PROTOTYPE_HANDOFF_GUIDE.md)：給非工程背景使用者看的白話版交接說明

## 這版刻意沒有放進 repo 的內容

- 正式後端實作
- 雲端資料庫連線設定
- 真實病患資料
- 正式帳號驗證
- 院內部署腳本

這樣做是為了把 repo 保持在 **安全、可展示、可交接** 的原型狀態。

## 院內正式版還需要補的事

1. 正式登入與帳號管理
2. 後端 API / 資料庫
3. 權限與稽核寫入後端
4. 真實備份、復原與日誌策略
5. 資安與法規審查
6. 去識別資料策略與正式上線流程

## GitHub Pages

這個 repo 可直接當靜態站展示，已補上 `.nojekyll` 以避免 Pages 對靜態資產做額外處理。
