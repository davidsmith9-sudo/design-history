# 使用速查

## 一次性安裝

```powershell
cd D:\design-history-website\scrapers
D:\Python\python.exe -m pip install -r requirements.txt
```

### 可選:API keys 與 proxy

複製 `.env.example` 為 `.env` 並填入需要的項目:

- `EUROPEANA_API_KEY` — 免費,申請於 https://pro.europeana.eu/page/apis
- `SMITHSONIAN_API_KEY` — 免費,申請於 https://api.data.gov/signup/
- `BAIDU_PROXY` — 透過 proxy 走百度百科(境外 IP 直接連會 403)
  - 範例:`BAIDU_PROXY=http://localhost:7890`
  - 只有 Baidu 走 proxy,其他來源不受影響

每項都是 optional — 沒設就跳過該來源,其他照常運作。

### 可選:下載 MoMA 資料(~30 MB)

```powershell
D:\Python\python.exe run.py moma-import
```

跑一次後,所有後續 fetch 都會自動帶 MoMA 結果。

## 常用流程

### 1. 找 QID

```powershell
D:\Python\python.exe run.py lookup "包浩斯"
D:\Python\python.exe run.py lookup "Bauhaus" --lang en
```

輸出範例:
```
Search 'Bauhaus' (lang=en):
  Q124354     Bauhaus  —  school in Germany that combined crafts and the fine arts
  Q83341071   Bauhaus  —  family name
  ...
```

確認哪個 QID 才是你要的(例如包浩斯學校是 Q124354,不是樂團 Q180582)。

### 2. 抓單一實體

```powershell
D:\Python\python.exe run.py all Q124354
```

`all` = `fetch`(抓資料)+ `to-markdown`(轉成 markdown)一次跑完。

輸出:
- `data/raw/wikidata/Q124354.json` — Wikidata 原始
- `data/raw/wikipedia/Q124354.json` — 三語 Wikipedia 原始
- `data/merged/Q124354.json` — 合併實體記錄
- `data/markdown/包浩斯.md` — 最終 markdown 預覽

### 3. 批次跑 topics.yaml

把要抓的 QID 都列進 `config/topics.yaml`,然後:

```powershell
D:\Python\python.exe run.py fetch-all
```

### 4. 只重新轉 markdown(不重抓)

改了 `to_markdown.py` 邏輯後,不用重抓網路資料,直接:

```powershell
D:\Python\python.exe run.py to-markdown Q124354
```

## 審稿合併進 content/

`data/markdown/` 裡的檔案是「草稿」,要進線上網站需要:

1. 開檔審稿、修字 — 特別注意:
   - description 是否合理(Wikidata 的描述有時抓到的是 tangential 面向)
   - `[[wiki-link]]` 內的人物/作品名是否用台灣繁體
   - extract 是否需要剪裁、改寫
   - 「英文資料」section 要不要翻譯或刪除
2. 移到對應子資料夾:
   - 流派 → `content/40-流派/`
   - 人物 → `content/50-人物/`
   - 作品 → `content/60-作品/`
3. 圖片可以從 markdown 內 Wikimedia URL 下載後存到 `content/99-素材/images/...`
4. 把 frontmatter `status: draft` 改成 `stub` 或拿掉

## 偵錯

如果某個 QID 抓不到 Wikipedia(例如它沒有中文條目),`fetch` 不會 fail,只會缺對應語言 — 看 stderr 的 `→ Wikipedia ...` 訊息確認哪幾語抓到了。

如果 console 出現亂碼,確認用的是 `D:\Python\python.exe`(不是其他舊版),且 `run.py` 開頭的 `sys.stdout.reconfigure(encoding='utf-8')` 有跑到。
