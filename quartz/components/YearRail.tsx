import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/yearRail.scss"

// 招牌設計:常駐右側垂直年代軸,把每一頁定位在 774 年設計史的座標上
//   - 詳情頁(作品/流派/人物):依 frontmatter 在軸上點 marker
//   - landing / list 頁:顯示空軸(ambient 背景),不點 marker
//   - 手機:隱藏

const RAIL_START = 1200
const RAIL_END = 2030
const RAIL_SPAN = RAIL_END - RAIL_START

// Era boundaries(start year)
const eras = [
  { key: "ancient", label: "古代", start: 1200 },
  { key: "industrial", label: "工業末", start: 1800 },
  { key: "modern", label: "現代", start: 1910 },
  { key: "postmodern", label: "後現代", start: 1960 },
] as const

function yearToPct(y: number): number {
  const clamped = Math.max(RAIL_START, Math.min(RAIL_END, y))
  return ((clamped - RAIL_START) / RAIL_SPAN) * 100
}

const YearRail: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const fm: any = fileData.frontmatter ?? {}
  const type = fm.type

  // 推導 marker 年份
  let year: number | null = null
  let yearEnd: number | null = null
  let markerLabel = ""
  if (type === "作品" && fm.year != null) {
    const y = parseInt(String(fm.year), 10)
    if (!isNaN(y)) {
      year = y
      markerLabel = String(y)
    }
  } else if (type === "流派") {
    const ys = parseInt(String(fm.year_start ?? ""), 10)
    const ye = parseInt(String(fm.year_end ?? ""), 10)
    if (!isNaN(ys)) {
      year = ys
      if (!isNaN(ye)) yearEnd = ye
      markerLabel = !isNaN(ye) ? `${ys}–${ye}` : String(ys)
    }
  } else if (type === "人物") {
    const b = parseInt(String(fm.birth ?? ""), 10)
    const d = parseInt(String(fm.death ?? ""), 10)
    if (!isNaN(b)) {
      year = b
      if (!isNaN(d)) yearEnd = d
      markerLabel = !isNaN(d) ? `${b}–${d}` : `${b}–`
    }
  } else if (type === "理論" && fm.year != null) {
    const y = parseInt(String(fm.year), 10)
    if (!isNaN(y)) {
      year = y
      markerLabel = String(y)
    }
  }

  const markerPct = year != null ? yearToPct(year) : null
  const rangeStart = year != null ? yearToPct(year) : null
  const rangeEnd = yearEnd != null ? yearToPct(yearEnd) : null

  // 每 100 年的 tick
  const ticks: number[] = []
  for (let y = 1200; y <= 2000; y += 100) ticks.push(y)

  return (
    <aside class="year-rail" aria-hidden="true">
      <div class="year-rail-track">
        {/* Era bands */}
        {eras.map((era, idx) => {
          const next = eras[idx + 1]
          const start = yearToPct(era.start)
          const end = next ? yearToPct(next.start) : 100
          return (
            <div
              class={`year-rail-era era-${era.key}`}
              style={`top: ${start}%; height: ${end - start}%;`}
            >
              <span class="year-rail-era-label">{era.label}</span>
            </div>
          )
        })}

        {/* Year ticks every 100 years */}
        {ticks.map((y) => (
          <span class="year-rail-tick" style={`top: ${yearToPct(y)}%;`} data-year={String(y)} />
        ))}

        {/* Range bar(流派 / 人物) */}
        {rangeStart != null && rangeEnd != null && (
          <div
            class="year-rail-range"
            style={`top: ${rangeStart}%; height: ${rangeEnd - rangeStart}%;`}
          />
        )}

        {/* Active marker */}
        {markerPct != null && (
          <div class="year-rail-marker" style={`top: ${markerPct}%;`}>
            <span class="year-rail-marker-dot" />
            <span class="year-rail-marker-label">{markerLabel}</span>
          </div>
        )}
      </div>

      {/* Rail caption(底部) */}
      <div class="year-rail-caption">
        <span class="year-rail-caption-end">1200</span>
        <span class="year-rail-caption-end">2030</span>
      </div>
    </aside>
  )
}

YearRail.css = style

export default (() => YearRail) satisfies QuartzComponentConstructor
