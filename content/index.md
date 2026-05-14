---
title: 設計史筆記
---

<div class="eye-hero">

# 設計史筆記

從 1238 年的阿罕布拉宮,到 2012 年的中央電視台總部 — 一套跨越 774 年、依時代/地區/領域/流派/人物/作品交叉索引的設計演變視覺化筆記。21 流派 × 47 人物 × 34 作品 × 6 條跨領域影響鏈。

<div class="eye-stats">
<div><strong>21</strong><span>流派</span></div>
<div><strong>47</strong><span>人物</span></div>
<div><strong>34</strong><span>作品</span></div>
<div><strong>4</strong><span>理論</span></div>
<div><strong>7</strong><span>時代</span></div>
</div>

</div>

<span class="eye-section-label">分類入口</span>

<ul class="eye-grid">
<li><a href="40-流派"><strong>流派<span class="eye-count">21</span></strong><span class="eye-desc">古希臘 / 哥德式 / 包浩斯 / 國際樣式 / 解構主義 等</span></a></li>
<li><a href="50-人物"><strong>人物<span class="eye-count">47</span></strong><span class="eye-desc">莫里斯 / 葛羅培斯 / 密斯 / 柯比意 / 安藤忠雄 等</span></a></li>
<li><a href="60-作品"><strong>作品<span class="eye-count">34</span></strong><span class="eye-desc">阿罕布拉宮 / 紅屋 / 薩伏伊別墅 / Helvetica / iPhone 等</span></a></li>
<li><a href="70-理論"><strong>理論<span class="eye-count">4</span></strong><span class="eye-desc">形式追隨功能 / 裝飾與罪惡 / 有機建築 / 包浩斯宣言</span></a></li>
<li><a href="10-時代"><strong>時代<span class="eye-count">7</span></strong><span class="eye-desc">古代 → 中世紀 → 文藝復興 → 現代 → 當代</span></a></li>
<li><a href="20-地區"><strong>地區<span class="eye-count">4</span></strong><span class="eye-desc">歐洲 / 美洲 / 東亞 / 其他地區</span></a></li>
<li><a href="30-領域"><strong>領域<span class="eye-count">6</span></strong><span class="eye-desc">平面 / 工業 / 建築 / 家具 / 字體 / UI/UX</span></a></li>
<li><a href="80-視覺化"><strong>視覺化<span class="eye-count">5</span></strong><span class="eye-desc">時間軸 / 譜系 / 拼貼地圖 / 跨領域連結</span></a></li>
</ul>

<span class="eye-section-label">流派影響譜系</span>

```mermaid
flowchart TD
    AC["工藝美術運動<br/>1860"]
    AN["新藝術運動<br/>1890"]
    VS["維也納分離派<br/>1897"]
    CO["構成主義<br/>1913"]
    DD["達達主義<br/>1916"]
    DS["風格派<br/>1917"]
    BH["包浩斯<br/>1919"]
    AD["裝飾藝術<br/>1920"]
    IS["國際樣式<br/>1920s"]
    SI["瑞士國際主義<br/>1950s"]
    PA["普普藝術<br/>1955"]
    DE["解構主義<br/>1980"]
    ME["孟菲斯設計<br/>1981"]

    AC --> AN
    AC --> BH
    AN --> VS
    AN --> AD
    CO --> BH
    DD --> PA
    DS --> BH
    DS --> IS
    BH --> IS
    BH --> SI
    IS --> DE
    PA --> ME

    classDef pre fill:#07655A,stroke:#054539,color:#fafaf6,stroke-width:2px
    classDef mod fill:#3E347C,stroke:#2a2356,color:#fafaf6,stroke-width:2px
    classDef pomo fill:#D64C1B,stroke:#a3380f,color:#fafaf6,stroke-width:2px

    class AC,AN,VS pre
    class CO,DD,DS,BH,AD,IS,SI mod
    class PA,DE,ME pomo

    click AC "/40-流派/工藝美術運動" "工藝美術運動"
    click AN "/40-流派/新藝術運動" "新藝術運動"
    click VS "/40-流派/維也納分離派" "維也納分離派"
    click CO "/40-流派/構成主義" "構成主義"
    click DD "/40-流派/達達主義" "達達主義"
    click DS "/40-流派/風格派" "風格派"
    click BH "/40-流派/包浩斯" "包浩斯"
    click AD "/40-流派/裝飾藝術" "裝飾藝術"
    click IS "/40-流派/國際樣式" "國際樣式"
    click SI "/40-流派/瑞士國際主義" "瑞士國際主義"
    click PA "/40-流派/普普藝術" "普普藝術"
    click DE "/40-流派/解構主義" "解構主義"
    click ME "/40-流派/孟菲斯設計" "孟菲斯設計"
```

> 顏色分組:工業革命末期 / 現代主義 / 後現代

<span class="eye-section-label">深入探索</span>

**視覺化**:
- [[時間軸]] — Mermaid gantt + 年代序表
- [[流派譜系]] — 13 節點可點 flowchart
- [[流派拼貼地圖|拼貼地圖]] — SVG 圓形拼貼
- [[跨領域連結]] — 6 條重要設計史影響鏈 **★ 新**

**參考**:
- [[首頁|完整全站索引]]
- [[關於|關於本站]] — 範圍、方法論、資料來源、引用方式
- [[參考書目]] — 全站書籍、論文、博物館、線上資源整理

> 持續更新中。最新進展見 [GitHub repo](https://github.com/davidsmith9-sudo/design-history) 或訂閱 [RSS](/index.xml)。
