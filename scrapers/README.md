# design-history scrapers

設計史內容多語爬蟲 — 抓取 Wikipedia(繁體 / 簡體 / 英文)、Wikidata、百度百科、文化遺產開放資料、學術開放資源,輸出 JSON 中介格式,再轉換為 Quartz markdown 供人工審稿後合併進 `content/`。

## 目錄結構

```
scrapers/
├── config/
│   └── topics.yaml         # 要抓的主題清單(以 Wikidata QID 為主鍵)
├── src/
│   ├── sources/            # 各資料來源實作(Wikipedia, Wikidata, 百度百科, ...)
│   └── pipeline/           # fetch → merge → to_markdown
├── data/
│   ├── raw/                # 各來源原始 JSON
│   ├── merged/             # 合併後實體 JSON(供轉換)
│   └── markdown/           # 最終 markdown 預覽輸出(尚未進 content/)
├── tests/
├── run.py                  # CLI 入口
└── requirements.txt
```

## 流程

```
topics.yaml (QID list)
   ↓
[fetch] 各來源 scraper 並行抓取 → data/raw/{source}/{qid}.json
   ↓
[merge] 跨來源合併為單一實體記錄 → data/merged/{qid}.json
   ↓
[to_markdown] 根據 type(流派/人物/作品) → data/markdown/{slug}.md
   ↓
人工審稿 → 移入 content/ 對應子資料夾
```

## 設計原則

- **Wikidata QID 作為跨語/跨來源的主鍵** — 不靠標題字串匹配,避免「Bauhaus / 包浩斯 / 包豪斯」三種寫法錯位
- **永遠不直接寫入 `content/`** — 所有輸出進 `data/markdown/`,由使用者人工挑選後合併
- **每個 source 是獨立可換 module** — 失敗一個不影響其他
- **rate limit + retry** — 對所有來源禮貌請求,遵守 robots.txt

## 安裝

```bash
cd D:\design-history-website\scrapers
python -m pip install -r requirements.txt
```

## 使用

```bash
# 抓單一實體(以 Wikidata QID)
python run.py fetch Q19799

# 抓 topics.yaml 中所有主題
python run.py fetch-all

# 將 merged JSON 轉成 markdown 預覽
python run.py to-markdown Q19799
```

## 來源優先級

| 來源 | 狀態 | API key | 備註 |
|---|---|---|---|
| Wikidata | ✓ | 無 | 結構化骨幹(QID、claims、跨語連結) |
| Wikipedia (zh-Hant / zh-Hans / en) | ✓ | 無 | 主要敘事文字 |
| 百度百科 | ⚠ | 無 | 境外 IP 通常 403,要 VPN/proxy 或中國 IP |
| Met Museum | ✓ | 無 | 公開 API,搜尋可能不精準 |
| V&A | ✓ | 無 | 公開 API,搜尋通常精準 |
| Europeana | ✓ | `EUROPEANA_API_KEY` | 歐洲文化遺產聚合,免費申請 |
| Smithsonian Open Access | ✓ | `SMITHSONIAN_API_KEY` | 含 Cooper Hewitt 設計典藏,免費申請 |
| DOAJ | ✓ | 無 | 開放取用學術期刊 |
| Internet Archive | ✓ | 無 | 電子書 + 歷史文獻 |
| MoMA | ✓ | 無(需下載資料) | 跑 `run.py moma-import` 一次性下載 ~30MB |
| Design Museum London | ✓ | 無 | HTML scrape,主要是展覽/活動/文章 |
| Vitra Design Museum | stub | — | SPA + 無公開 API → 需 Playwright 才能爬 |

## 已知限制

1. **大陸繁體 → 台灣繁體自動轉換已啟用**:OpenCC `s2twp` + 自訂設計史譯名字典(`src/utils/zh_convert.py`)。覆蓋已知:勒·柯布西耶 → 勒·柯比意、包豪斯 → 包浩斯、康定斯基 → 康丁斯基、弗蘭克·勞埃德·賴特 → 弗蘭克·洛伊·萊特、安迪·沃霍爾 → 安迪·沃荷,等等。沒覆蓋到的請加進 `CUSTOM_TW` dict。

2. **type 偵測**:目前只覆蓋常見類型(`流派 / 人物 / 作品`)的 instance_of QID 子集,落在「未分類」的請手動補規則或加入 `TYPE_RULES`。

3. **不直接寫入 `content/`**:所有輸出都進 `data/markdown/` 供審稿,刻意不自動覆蓋線上內容。

4. **百度百科需 proxy**:Baidu Baike 對境外 IP 回 403 Forbidden(IP geofencing + 瀏覽器指紋)。要啟用請其中一種:
   - 在中國境內執行
   - `.env` 設定 `BAIDU_PROXY=http://your-china-proxy:port`(只 Baidu 走 proxy,其他來源不受影響)
   - 或設 `HTTPS_PROXY=...`(全部來源都走 proxy)
   - 不啟用也沒關係 — Wikipedia 的 `zh-hans` variant 已涵蓋大部分簡體內容

5. **Vitra Design Museum 是 stub**:他們的數位 collection 是純 SPA(`<div id="app"></div>` + JS bundles),沒有可發現的 backend API。要實作需 Playwright/Selenium。詳細註解在 `src/sources/vitra.py`。

6. **Met / V&A 搜尋結果可能不相關**:博物館 API 的關鍵字搜尋是廣義的 — 例如搜「Le Corbusier」,Met 可能回傳「Charles Le Brun」「Le Nain」(姓氏含 "Le")。V&A 比 Met 精確得多。審稿時請挑選真正相關的條目,其餘刪除。

7. **MoMA 需先下載資料**:跑 `python run.py moma-import`(一次性 ~30 MB)才會把 MoMA 結果納入。沒下載則自動跳過。

8. **Europeana / Smithsonian 需 API key**:免費申請,把 key 放進 `.env`(複製 `.env.example`)。沒設則自動跳過。
