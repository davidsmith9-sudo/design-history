---
title: 設計史筆記
---

# 設計史筆記

> 一套涵蓋全時間軸、全地理範圍的設計演變視覺化筆記系統。

![[流派拼貼地圖.svg]]

## 入口

### 🕰️ 依時代瀏覽
- [[古代設計]] · [[中世紀設計]] · [[文藝復興設計]] · [[工業革命與設計]]
- [[現代主義]] · [[後現代主義]] · [[當代設計]]

### 🌏 依地區瀏覽
- [[東亞設計史]] · [[歐洲設計史]] · [[美洲設計史]] · [[其他地區設計史]]

### 🎨 依領域瀏覽
- [[平面設計史]] · [[工業設計史]] · [[建築史]]
- [[家具設計史]] · [[字體設計史]] · [[UI/UX 設計史]]

## 流派影響譜系

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

    classDef pre fill:#f4e4d4,stroke:#8b6f47,color:#3d2817
    classDef mod fill:#d4e4f4,stroke:#476f8b,color:#17283d
    classDef pomo fill:#f4d4e4,stroke:#8b476f,color:#3d1728

    class AC,AN,VS pre
    class CO,DD,DS,BH,AD,IS,SI mod
    class PA,DE,ME pomo
```

> 顏色分組:工業革命末期 / 現代主義 / 後現代

---

## 進一步瀏覽

- [[時間軸|完整時間軸 →]] (含 Mermaid gantt 與年代表)
- [[首頁|全站索引 →]] (流派 13 / 人物 26 / 作品 22 / 理論 2)
