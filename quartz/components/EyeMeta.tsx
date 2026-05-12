import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import styles from "./styles/eyeMeta.scss"
import { resolveRelative } from "../util/path"

// 從 frontmatter 抓 type 對應欄位顯示成 pill 表;能對到 vault 內筆記的 pill 自動變連結

type Item = { label: string; values: string[] }

function toArr(v: any): string[] {
  if (v == null) return []
  const arr = Array.isArray(v) ? v : [v]
  return arr
    .map((x) => (typeof x === "string" ? cleanWikilink(x) : x == null ? "" : String(x)))
    .filter((s) => s !== "")
}

function cleanWikilink(s: string): string {
  const m = s.match(/^\[\[(.+?)(?:\|(.+?))?\]\]$/)
  return m ? (m[2] ?? m[1]) : s
}

function yearRange(start: any, end: any): string {
  const s = start == null ? "?" : String(start)
  const e = end == null ? "現在" : String(end)
  return `${s} – ${e}`
}

const EyeMeta: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const fm: any = fileData.frontmatter ?? {}
  const type = fm.type as string | undefined
  if (!type) return null

  // 建 title → file 索引,讓 pill 能解析到對應頁
  const titleIndex = new Map<string, (typeof allFiles)[number]>()
  for (const f of allFiles) {
    const t = (f.frontmatter as any)?.title
    if (typeof t === "string") titleIndex.set(t, f)
  }

  const items: Item[] = []

  if (type === "作品") {
    const designer = toArr(fm.designer)
    if (designer.length) items.push({ label: "設計師", values: designer })
    if (fm.year != null) items.push({ label: "年代", values: [String(fm.year)] })
    const movement = toArr(fm.movement)
    if (movement.length) items.push({ label: "流派", values: movement })
    const field = toArr(fm.field)
    if (field.length) items.push({ label: "領域", values: field })
    if (fm.medium) items.push({ label: "媒材", values: [String(fm.medium)] })
    if (fm.location) items.push({ label: "地點", values: [String(fm.location)] })
  } else if (type === "人物") {
    if (fm.name_original) items.push({ label: "原名", values: [String(fm.name_original)] })
    if (fm.birth != null || fm.death != null) {
      items.push({ label: "生卒", values: [yearRange(fm.birth, fm.death)] })
    }
    if (fm.nationality) items.push({ label: "國籍", values: [String(fm.nationality)] })
    const field = toArr(fm.field)
    if (field.length) items.push({ label: "領域", values: field })
    const movement = toArr(fm.movement)
    if (movement.length) items.push({ label: "流派", values: movement })
    const key = toArr(fm.key_works)
    if (key.length) items.push({ label: "代表作", values: key })
  } else if (type === "理論") {
    const author = toArr(fm.author)
    if (author.length) items.push({ label: "提出者", values: author })
    if (fm.year != null) items.push({ label: "年代", values: [String(fm.year)] })
    const field = toArr(fm.field)
    if (field.length) items.push({ label: "領域", values: field })
    const movs = toArr(fm.related_movements)
    if (movs.length) items.push({ label: "相關流派", values: movs })
  } else if (type === "流派") {
    if (fm.year_start != null || fm.year_end != null) {
      items.push({ label: "年代", values: [yearRange(fm.year_start, fm.year_end)] })
    }
    if (fm.era) items.push({ label: "時代", values: [String(fm.era)] })
    if (fm.region) items.push({ label: "地區", values: [String(fm.region)] })
    const field = toArr(fm.field)
    if (field.length) items.push({ label: "領域", values: field })
    const founders = toArr(fm.founders)
    if (founders.length) items.push({ label: "創辦", values: founders })
    const fig = toArr(fm.key_figures)
    if (fig.length) items.push({ label: "代表人物", values: fig })
    const works = toArr(fm.key_works)
    if (works.length) items.push({ label: "代表作品", values: works })
  } else {
    return null
  }

  if (items.length === 0) return null

  const renderPill = (v: string) => {
    const target = titleIndex.get(v)
    if (target && target.slug && target.slug !== fileData.slug) {
      return (
        <a class="eye-meta-pill eye-meta-pill--link" href={resolveRelative(fileData.slug!, target.slug)}>
          {v}
        </a>
      )
    }
    return <span class="eye-meta-pill">{v}</span>
  }

  return (
    <dl class="eye-meta">
      {items.map(({ label, values }) => (
        <div class="eye-meta-row">
          <dt>{label}</dt>
          <dd>{values.map(renderPill)}</dd>
        </div>
      ))}
    </dl>
  )
}

EyeMeta.css = styles

export default (() => EyeMeta) satisfies QuartzComponentConstructor
