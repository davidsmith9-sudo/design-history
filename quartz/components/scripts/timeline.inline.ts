// 互動橫向時間軸 v2 — filter chips + per-decade density chart
// 渲染到 <div class="eye-timeline"></div>

type Era = "ancient" | "industrial" | "modern" | "postmodern"
type Category = "movement" | "work"

interface TimelineEntry {
  year: number
  endYear?: number
  label: string
  href: string
  category: Category
  era: Era
}

const eras: Record<Era, { tc: string; en: string; start: number; end: number }> = {
  ancient: { tc: "古代 · 中世紀", en: "Ancient — Medieval", start: 1200, end: 1799 },
  industrial: { tc: "工業革命末期", en: "Late Industrial Era", start: 1800, end: 1909 },
  modern: { tc: "現代主義", en: "Modernism", start: 1910, end: 1959 },
  postmodern: { tc: "後現代 · 當代", en: "Postmodern — Contemporary", start: 1960, end: 2020 },
}

const data: TimelineEntry[] = [
  { year: 1860, endYear: 1910, label: "工藝美術運動", href: "/40-流派/工藝美術運動", category: "movement", era: "industrial" },
  { year: 1890, endYear: 1910, label: "新藝術運動", href: "/40-流派/新藝術運動", category: "movement", era: "industrial" },
  { year: 1897, endYear: 1905, label: "維也納分離派", href: "/40-流派/維也納分離派", category: "movement", era: "industrial" },
  { year: 1913, endYear: 1930, label: "構成主義", href: "/40-流派/構成主義", category: "movement", era: "modern" },
  { year: 1916, endYear: 1924, label: "達達主義", href: "/40-流派/達達主義", category: "movement", era: "modern" },
  { year: 1917, endYear: 1931, label: "風格派", href: "/40-流派/風格派", category: "movement", era: "modern" },
  { year: 1919, endYear: 1933, label: "包浩斯", href: "/40-流派/包浩斯", category: "movement", era: "modern" },
  { year: 1920, endYear: 1939, label: "裝飾藝術", href: "/40-流派/裝飾藝術", category: "movement", era: "modern" },
  { year: 1920, endYear: 1970, label: "國際樣式", href: "/40-流派/國際樣式", category: "movement", era: "modern" },
  { year: 1950, endYear: 1970, label: "瑞士國際主義", href: "/40-流派/瑞士國際主義", category: "movement", era: "modern" },
  { year: 1955, endYear: 1970, label: "普普藝術", href: "/40-流派/普普藝術", category: "movement", era: "postmodern" },
  { year: 1980, endYear: 2010, label: "解構主義", href: "/40-流派/解構主義", category: "movement", era: "postmodern" },
  { year: 1981, endYear: 1987, label: "孟菲斯設計", href: "/40-流派/孟菲斯設計", category: "movement", era: "postmodern" },
  { year: 1238, label: "阿罕布拉宮", href: "/60-作品/阿罕布拉宮", category: "work", era: "ancient" },
  { year: 1831, label: "神奈川衝浪裏", href: "/60-作品/神奈川衝浪裏", category: "work", era: "industrial" },
  { year: 1859, label: "紅屋", href: "/60-作品/紅屋", category: "work", era: "industrial" },
  { year: 1882, label: "聖家堂", href: "/60-作品/聖家堂", category: "work", era: "industrial" },
  { year: 1918, label: "紅藍椅", href: "/60-作品/紅藍椅", category: "work", era: "modern" },
  { year: 1925, label: "包浩斯德紹校舍", href: "/60-作品/包浩斯德紹校舍", category: "work", era: "modern" },
  { year: 1929, label: "巴塞隆納德國館", href: "/60-作品/巴塞隆納德國館", category: "work", era: "modern" },
  { year: 1931, label: "薩伏伊別墅", href: "/60-作品/薩伏伊別墅", category: "work", era: "modern" },
  { year: 1937, label: "落水山莊", href: "/60-作品/落水山莊", category: "work", era: "modern" },
  { year: 1956, label: "Eames Lounge Chair", href: "/60-作品/Eames Lounge Chair", category: "work", era: "modern" },
  { year: 1957, label: "Helvetica", href: "/60-作品/Helvetica", category: "work", era: "modern" },
  { year: 1973, label: "雪梨歌劇院", href: "/60-作品/雪梨歌劇院", category: "work", era: "postmodern" },
  { year: 1989, label: "光之教堂", href: "/60-作品/光之教堂", category: "work", era: "postmodern" },
  { year: 1997, label: "畢爾包古根漢美術館", href: "/60-作品/畢爾包古根漢美術館", category: "work", era: "postmodern" },
  { year: 2007, label: "iPhone", href: "/60-作品/iPhone", category: "work", era: "postmodern" },
  { year: 2012, label: "中央電視台總部大樓", href: "/60-作品/中央電視台總部大樓", category: "work", era: "postmodern" },
]

const SVG_NS = "http://www.w3.org/2000/svg"
const XLINK_NS = "http://www.w3.org/1999/xlink"

type CatFilter = "all" | Category
type EraFilter = "all" | Era

interface State {
  cat: CatFilter
  era: EraFilter
}

function applyFilter(state: State): TimelineEntry[] {
  return data.filter((d) => {
    if (state.cat !== "all" && d.category !== state.cat) return false
    if (state.era !== "all" && d.era !== state.era) return false
    return true
  })
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  for (const c of children) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  return e
}

function svgEl(tag: string, attrs: Record<string, string> = {}): SVGElement {
  const e = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  return e
}

function renderDensity(svg: SVGElement, filtered: TimelineEntry[], startYear: number, endYear: number, pxPerYear: number, height: number) {
  const bucketSize = 10 // 每 10 年一格
  const buckets = new Map<number, number>()
  for (const d of filtered) {
    // 流派計入起始年份的桶 + 持續時間每十年也加 0.4(讓長持續時間有貢獻)
    const startBucket = Math.floor(d.year / bucketSize) * bucketSize
    buckets.set(startBucket, (buckets.get(startBucket) ?? 0) + 1)
    if (d.endYear) {
      for (let y = startBucket + bucketSize; y <= d.endYear; y += bucketSize) {
        buckets.set(y, (buckets.get(y) ?? 0) + 0.4)
      }
    }
  }
  const maxVal = Math.max(1, ...buckets.values())
  const barWidth = bucketSize * pxPerYear - 1
  for (let y = Math.ceil(startYear / bucketSize) * bucketSize; y <= endYear; y += bucketSize) {
    const v = buckets.get(y) ?? 0
    const h = Math.round((v / maxVal) * (height - 4))
    const x = (y - startYear) * pxPerYear
    const bar = svgEl("rect", {
      x: String(x),
      y: String(height - h),
      width: String(barWidth),
      height: String(h),
      class: "eye-timeline-density-bar",
    })
    svg.appendChild(bar)
  }
}

function render(container: HTMLElement, state: State) {
  const pxPerYear = 5
  const startYear = 1230
  const endYear = 2020
  const yearSpan = endYear - startYear
  const width = yearSpan * pxPerYear
  const densityHeight = 36
  const padTop = 24
  const mainHeight = 480
  const totalHeight = densityHeight + padTop + mainHeight
  const axisY = densityHeight + padTop + 380

  // 第一次 render:建立 toolbar + scroller
  let toolbar = container.querySelector<HTMLElement>(".eye-timeline-toolbar")
  let scroller = container.querySelector<HTMLElement>(".eye-timeline-scroller")
  const isFirst = !toolbar
  if (isFirst) {
    container.innerHTML = ""
    container.classList.add("is-rendered")

    toolbar = el("div", { class: "eye-timeline-toolbar" })

    // Filter chips
    const filterRow = el("div", { class: "eye-timeline-filters" })
    const groupCat = el("div", { class: "eye-timeline-filter-group", "data-key": "cat" }, [
      el("span", { class: "eye-timeline-filter-label" }, ["Show"]),
    ])
    const catOptions: { val: CatFilter; tc: string; en: string }[] = [
      { val: "all", tc: "全部", en: "All" },
      { val: "movement", tc: "流派", en: "Movements" },
      { val: "work", tc: "作品", en: "Works" },
    ]
    for (const opt of catOptions) {
      const btn = el(
        "button",
        {
          class: `eye-timeline-chip${opt.val === state.cat ? " is-active" : ""}`,
          "data-key": "cat",
          "data-val": opt.val,
          type: "button",
        },
        [opt.tc, " ", el("em", {}, [opt.en])],
      )
      groupCat.appendChild(btn)
    }
    filterRow.appendChild(groupCat)

    const groupEra = el("div", { class: "eye-timeline-filter-group", "data-key": "era" }, [
      el("span", { class: "eye-timeline-filter-label" }, ["Era"]),
    ])
    const eraOptions: { val: EraFilter; tc: string }[] = [
      { val: "all", tc: "全部" },
      { val: "ancient", tc: "古代" },
      { val: "industrial", tc: "工業末" },
      { val: "modern", tc: "現代" },
      { val: "postmodern", tc: "後現代" },
    ]
    for (const opt of eraOptions) {
      const btn = el(
        "button",
        {
          class: `eye-timeline-chip${opt.val === state.era ? " is-active" : ""}`,
          "data-key": "era",
          "data-val": opt.val,
          type: "button",
        },
        [opt.tc],
      )
      groupEra.appendChild(btn)
    }
    filterRow.appendChild(groupEra)
    toolbar.appendChild(filterRow)

    // Legend + meta(右側)
    const meta = el("div", { class: "eye-timeline-meta" })
    meta.innerHTML = `<span class="eye-timeline-meta-range">1238 — 2012</span><span class="eye-timeline-meta-sep">·</span><span class="eye-timeline-meta-count" data-count>${data.length} entries</span>`
    toolbar.appendChild(meta)

    container.appendChild(toolbar)

    scroller = el("div", { class: "eye-timeline-scroller" })
    container.appendChild(scroller)

    // 點 chip 變狀態
    toolbar.addEventListener("click", (ev) => {
      const target = ev.target as HTMLElement
      const btn = target.closest<HTMLElement>(".eye-timeline-chip")
      if (!btn) return
      const key = btn.dataset.key as "cat" | "era"
      const val = btn.dataset.val
      if (!key || !val) return
      ;(state as any)[key] = val
      render(container, state)
    })
  } else {
    // 後續 render:更新 chip 高亮
    toolbar!.querySelectorAll<HTMLElement>(".eye-timeline-chip").forEach((b) => {
      const key = b.dataset.key as keyof State
      const val = b.dataset.val
      b.classList.toggle("is-active", state[key] === val)
    })
  }

  const filtered = applyFilter(state)
  const countEl = toolbar!.querySelector<HTMLElement>("[data-count]")
  if (countEl) countEl.textContent = `${filtered.length} entries`

  // 重繪 SVG
  scroller!.innerHTML = ""
  const svg = svgEl("svg", {
    xmlns: SVG_NS,
    width: String(width),
    height: String(totalHeight),
    viewBox: `0 0 ${width} ${totalHeight}`,
    role: "img",
    "aria-label": `設計史時間軸,${filtered.length} 個事件,可橫向捲動點擊節點。`,
  }) as unknown as SVGSVGElement
  svg.classList.add("eye-timeline-svg")
  scroller!.appendChild(svg)

  // ── 1. 上方 density chart ──
  renderDensity(svg, filtered, startYear, endYear, pxPerYear, densityHeight)
  const densitySep = svgEl("line", {
    x1: "0",
    x2: String(width),
    y1: String(densityHeight + 1),
    y2: String(densityHeight + 1),
    class: "eye-timeline-density-axis",
  })
  svg.appendChild(densitySep)
  const densityLabel = svgEl("text", {
    x: "12",
    y: "14",
    class: "eye-timeline-density-label",
  })
  densityLabel.textContent = "Density · 每十年活動量"
  svg.appendChild(densityLabel)

  // ── 2. 時期帶狀背景 + 標籤 ──
  const yearX = (y: number) => (y - startYear) * pxPerYear
  const bandTopY = densityHeight + padTop
  const eraOrder: Era[] = ["ancient", "industrial", "modern", "postmodern"]
  eraOrder.forEach((eraKey, idx) => {
    const era = eras[eraKey]
    const x1 = yearX(Math.max(era.start, startYear))
    const x2 = yearX(Math.min(era.end, endYear))
    const dimmed = state.era !== "all" && state.era !== eraKey
    const band = svgEl("rect", {
      x: String(x1),
      y: String(bandTopY),
      width: String(x2 - x1),
      height: String(axisY - bandTopY),
      class: `eye-timeline-era-band era-${eraKey}${dimmed ? " is-dimmed" : ""}`,
    })
    svg.appendChild(band)
    const lbl = svgEl("text", {
      x: String(x1 + 12),
      y: String(bandTopY + 22),
      class: "eye-timeline-era-label",
    })
    lbl.textContent = era.tc
    svg.appendChild(lbl)
    const lblEn = svgEl("text", {
      x: String(x1 + 12),
      y: String(bandTopY + 40),
      class: "eye-timeline-era-label-en",
    })
    lblEn.textContent = era.en
    svg.appendChild(lblEn)
    if (idx > 0) {
      const line = svgEl("line", {
        x1: String(x1),
        x2: String(x1),
        y1: String(bandTopY),
        y2: String(axisY),
        class: "eye-timeline-era-divider",
      })
      svg.appendChild(line)
    }
  })

  // ── 3. 主軸 + 刻度 ──
  const axisLine = svgEl("line", {
    x1: "0",
    x2: String(width),
    y1: String(axisY),
    y2: String(axisY),
    class: "eye-timeline-axis",
  })
  svg.appendChild(axisLine)
  for (let y = Math.ceil(startYear / 50) * 50; y <= endYear; y += 50) {
    const x = yearX(y)
    const tick = svgEl("line", {
      x1: String(x),
      x2: String(x),
      y1: String(axisY),
      y2: String(axisY + 8),
      class: "eye-timeline-tick",
    })
    svg.appendChild(tick)
    const tickLabel = svgEl("text", {
      x: String(x),
      y: String(axisY + 26),
      "text-anchor": "middle",
      class: "eye-timeline-tick-label",
    })
    tickLabel.textContent = String(y)
    svg.appendChild(tickLabel)
  }

  // ── 4. 節點 ──
  const movementLanes = 6
  const workLanes = 3
  const laneHeight = 38
  const movementBaseY = axisY - 30
  const workBaseY = axisY + 56
  const lastEndInLane: Record<Category, number[]> = {
    movement: new Array(movementLanes).fill(-Infinity),
    work: new Array(workLanes).fill(-Infinity),
  }

  const sorted = [...filtered].sort((a, b) => a.year - b.year)
  sorted.forEach((entry) => {
    const x = yearX(entry.year)
    const xEnd = entry.endYear ? yearX(entry.endYear) : x + 80
    const lanes = entry.category === "movement" ? movementLanes : workLanes
    const lanesArr = lastEndInLane[entry.category]
    let lane = 0
    for (let l = 0; l < lanes; l++) {
      if (lanesArr[l] < x) {
        lane = l
        lanesArr[l] = xEnd + 60
        break
      }
      if (l === lanes - 1) {
        lane = 0
        lanesArr[0] = xEnd + 60
      }
    }
    const baseY = entry.category === "movement" ? movementBaseY : workBaseY
    const direction = entry.category === "movement" ? -1 : 1
    const y = baseY + direction * lane * laneHeight

    const stem = svgEl("line", {
      x1: String(x),
      x2: String(x),
      y1: String(axisY),
      y2: String(y),
      class: `eye-timeline-stem cat-${entry.category}`,
    })
    svg.appendChild(stem)
    if (entry.endYear) {
      const bar = svgEl("rect", {
        x: String(x),
        y: String(y - 1),
        width: String(xEnd - x),
        height: "2",
        class: `eye-timeline-bar cat-${entry.category} era-${entry.era}`,
      })
      svg.appendChild(bar)
    }
    const dot = svgEl("circle", {
      cx: String(x),
      cy: String(y),
      r: entry.category === "movement" ? "4" : "3",
      class: `eye-timeline-dot cat-${entry.category} era-${entry.era}`,
    })
    svg.appendChild(dot)

    const link = svgEl("a", {
      href: entry.href,
      tabindex: "0",
      class: "eye-timeline-link",
      "aria-label": `${entry.label}${entry.endYear ? ` (${entry.year}–${entry.endYear})` : ` (${entry.year})`}`,
    })
    link.setAttributeNS(XLINK_NS, "href", entry.href)
    const label = svgEl("text", {
      x: String(x + 8),
      y: String(y + (entry.category === "movement" ? -6 : 4)),
      class: `eye-timeline-label cat-${entry.category}`,
    })
    label.textContent = entry.label
    link.appendChild(label)
    const yearLabel = svgEl("text", {
      x: String(x + 8),
      y: String(y + (entry.category === "movement" ? -20 : 18)),
      class: "eye-timeline-year",
    })
    yearLabel.textContent =
      entry.endYear && entry.category === "movement"
        ? `${entry.year}—${entry.endYear}`
        : String(entry.year)
    link.appendChild(yearLabel)
    svg.appendChild(link)
  })

  if (isFirst) {
    requestAnimationFrame(() => {
      scroller!.scrollLeft = Math.max(0, yearX(1850) - 100)
    })
  }
}

function init() {
  const containers = document.querySelectorAll<HTMLElement>(".eye-timeline:not(.is-rendered)")
  containers.forEach((c) => render(c, { cat: "all", era: "all" }))
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
document.addEventListener("nav", () => init())
