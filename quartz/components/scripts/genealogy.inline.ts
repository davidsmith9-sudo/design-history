// 自訂譜系 SVG — 取代 mermaid,風格與 Norm/Frama 編輯感一致
// 渲染到 <div class="eye-genealogy"></div>

type Era = "pre" | "mod" | "pomo"

interface Node {
  id: string
  label: string
  year: number
  era: Era
  // 手動 lane 編號(0 = 最上,3 = 最下)
  lane: number
}

interface Edge {
  from: string
  to: string
}

const nodes: Node[] = [
  // pre-modern / industrial 末
  { id: "AC", label: "工藝美術運動", year: 1860, era: "pre", lane: 0 },
  { id: "AN", label: "新藝術運動", year: 1890, era: "pre", lane: 1 },
  { id: "VS", label: "維也納分離派", year: 1897, era: "pre", lane: 2 },
  // modernism
  { id: "CO", label: "構成主義", year: 1913, era: "mod", lane: 0 },
  { id: "DD", label: "達達主義", year: 1916, era: "mod", lane: 3 },
  { id: "DS", label: "風格派", year: 1917, era: "mod", lane: 1 },
  { id: "BH", label: "包浩斯", year: 1919, era: "mod", lane: 2 },
  { id: "AD", label: "裝飾藝術", year: 1920, era: "mod", lane: 0 },
  { id: "IS", label: "國際樣式", year: 1925, era: "mod", lane: 1 },
  { id: "SI", label: "瑞士國際主義", year: 1955, era: "mod", lane: 2 },
  // postmodernism
  { id: "PA", label: "普普藝術", year: 1955, era: "pomo", lane: 3 },
  { id: "DE", label: "解構主義", year: 1980, era: "pomo", lane: 1 },
  { id: "ME", label: "孟菲斯設計", year: 1981, era: "pomo", lane: 3 },
]

const edges: Edge[] = [
  { from: "AC", to: "AN" },
  { from: "AC", to: "BH" },
  { from: "AN", to: "VS" },
  { from: "AN", to: "AD" },
  { from: "CO", to: "BH" },
  { from: "DD", to: "PA" },
  { from: "DS", to: "BH" },
  { from: "DS", to: "IS" },
  { from: "BH", to: "IS" },
  { from: "BH", to: "SI" },
  { from: "IS", to: "DE" },
  { from: "PA", to: "ME" },
]

const SVG_NS = "http://www.w3.org/2000/svg"

const slugMap: Record<string, string> = {
  AC: "工藝美術運動",
  AN: "新藝術運動",
  VS: "維也納分離派",
  CO: "構成主義",
  DD: "達達主義",
  DS: "風格派",
  BH: "包浩斯",
  AD: "裝飾藝術",
  IS: "國際樣式",
  SI: "瑞士國際主義",
  PA: "普普藝術",
  DE: "解構主義",
  ME: "孟菲斯設計",
}

function svgEl(tag: string, attrs: Record<string, string> = {}): SVGElement {
  const e = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  return e
}

function render(container: HTMLElement) {
  container.classList.add("is-rendered")
  container.innerHTML = ""

  const width = 1080
  const height = 460
  const padL = 40
  const padR = 40
  const padT = 60
  const padB = 60
  const minYear = 1855
  const maxYear = 1990
  const yearX = (y: number) => padL + ((y - minYear) / (maxYear - minYear)) * (width - padL - padR)
  const laneCount = 4
  const laneHeight = (height - padT - padB) / (laneCount - 1)
  const laneY = (lane: number) => padT + lane * laneHeight

  const idMap = new Map<string, Node>()
  for (const n of nodes) idMap.set(n.id, n)

  // ── 外框 ──
  const svg = svgEl("svg", {
    xmlns: SVG_NS,
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: "auto",
    role: "img",
    "aria-label": "設計流派影響譜系圖,13 個流派,12 條影響關係",
    class: "eye-genealogy-svg",
  })
  container.appendChild(svg)

  // ── 1. 時期帶狀區隔(三段:pre / mod / pomo) ──
  const eraBounds: Record<Era, [number, number]> = {
    pre: [minYear, 1910],
    mod: [1910, 1955],
    pomo: [1955, maxYear],
  }
  ;(["pre", "mod", "pomo"] as Era[]).forEach((era, idx) => {
    const [s, e] = eraBounds[era]
    const x1 = yearX(s)
    const x2 = yearX(e)
    const band = svgEl("rect", {
      x: String(x1),
      y: String(padT - 30),
      width: String(x2 - x1),
      height: String(height - padT - padB + 50),
      class: `gen-band gen-band--${era}`,
    })
    svg.appendChild(band)
    const lbl = svgEl("text", {
      x: String((x1 + x2) / 2),
      y: String(padT - 36),
      "text-anchor": "middle",
      class: "gen-band-label",
    })
    lbl.textContent =
      era === "pre" ? "INDUSTRIAL 工業末" : era === "mod" ? "MODERNISM 現代主義" : "POSTMODERN 後現代"
    svg.appendChild(lbl)
    if (idx > 0) {
      const div = svgEl("line", {
        x1: String(x1),
        x2: String(x1),
        y1: String(padT - 30),
        y2: String(height - padB + 20),
        class: "gen-band-divider",
      })
      svg.appendChild(div)
    }
  })

  // ── 2. 邊(箭頭) ──
  const defs = svgEl("defs")
  const marker = svgEl("marker", {
    id: "gen-arrow",
    viewBox: "0 0 6 6",
    refX: "5",
    refY: "3",
    markerWidth: "5",
    markerHeight: "5",
    orient: "auto",
    class: "gen-arrow-marker",
  })
  const arrowPath = svgEl("path", { d: "M 0 0 L 6 3 L 0 6 z", class: "gen-arrow-head" })
  marker.appendChild(arrowPath)
  defs.appendChild(marker)
  svg.appendChild(defs)

  for (const edge of edges) {
    const from = idMap.get(edge.from)
    const to = idMap.get(edge.to)
    if (!from || !to) continue
    const x1 = yearX(from.year)
    const y1 = laneY(from.lane)
    const x2 = yearX(to.year)
    const y2 = laneY(to.lane)
    // 開節點 r=8 → 起終點外推 10px
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const sx = x1 + ux * 9
    const sy = y1 + uy * 9
    const ex = x2 - ux * 12
    const ey = y2 - uy * 12
    // 用 quadratic curve 給點微弱的弧度,讓多條線不重疊
    const midX = (sx + ex) / 2
    const midY = (sy + ey) / 2 + (Math.abs(dy) > 30 ? 0 : (from.lane - to.lane) * 8)
    const path = svgEl("path", {
      d: `M ${sx} ${sy} Q ${midX} ${midY} ${ex} ${ey}`,
      class: "gen-edge",
      "marker-end": "url(#gen-arrow)",
      fill: "none",
    })
    svg.appendChild(path)
  }

  // ── 3. 節點 ──
  for (const n of nodes) {
    const cx = yearX(n.year)
    const cy = laneY(n.lane)

    const link = svgEl("a", {
      href: `/40-流派/${slugMap[n.id] ?? n.label}`,
      class: `gen-node gen-node--${n.era}`,
      tabindex: "0",
      "aria-label": `${n.label} (${n.year})`,
    })
    link.setAttributeNS("http://www.w3.org/1999/xlink", "href", `/40-流派/${slugMap[n.id] ?? n.label}`)

    const circle = svgEl("circle", {
      cx: String(cx),
      cy: String(cy),
      r: "8",
      class: "gen-node-circle",
    })
    link.appendChild(circle)

    // 標籤位置:交替放上下,避免重疊
    const labelAbove = n.lane % 2 === 0
    const labelY = labelAbove ? cy - 16 : cy + 24
    const yearY = labelAbove ? cy - 30 : cy + 38

    const label = svgEl("text", {
      x: String(cx),
      y: String(labelY),
      "text-anchor": "middle",
      class: "gen-node-label",
    })
    label.textContent = n.label
    link.appendChild(label)

    const yearLabel = svgEl("text", {
      x: String(cx),
      y: String(yearY),
      "text-anchor": "middle",
      class: "gen-node-year",
    })
    yearLabel.textContent = String(n.year)
    link.appendChild(yearLabel)

    svg.appendChild(link)
  }

  // ── 4. 圖例 ──
  const legend = document.createElement("div")
  legend.className = "eye-genealogy-legend"
  legend.innerHTML = `
    <span class="eye-genealogy-legend-item"><i class="gen-swatch gen-swatch--pre"></i>工業末期</span>
    <span class="eye-genealogy-legend-item"><i class="gen-swatch gen-swatch--mod"></i>現代主義</span>
    <span class="eye-genealogy-legend-item"><i class="gen-swatch gen-swatch--pomo"></i>後現代</span>
    <span class="eye-genealogy-legend-spacer"></span>
    <span class="eye-genealogy-legend-hint">點任一節點進入該流派 →</span>
  `
  container.appendChild(legend)
}

function init() {
  document
    .querySelectorAll<HTMLElement>(".eye-genealogy:not(.is-rendered)")
    .forEach(render)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
document.addEventListener("nav", () => init())
