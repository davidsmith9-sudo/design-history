import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/articleHero.scss"
import { resolveRelative } from "../util/path"

function clean(s: string): string {
  const m = s.match(/^\[\[(.+?)(?:\|(.+?))?\]\]$/)
  return m ? (m[2] ?? m[1]) : s
}

function arr(v: any): string[] {
  if (v == null) return []
  const out = Array.isArray(v) ? v : [v]
  return out.map((x) => (typeof x === "string" ? clean(x) : String(x ?? ""))).filter(Boolean)
}

function yearRange(s: any, e: any): string {
  const a = s == null ? "?" : String(s)
  const b = e == null ? "現在" : String(e)
  return `${a} – ${b}`
}

const typeMap: Record<string, { tc: string; en: string }> = {
  流派: { tc: "流派", en: "Movement" },
  人物: { tc: "人物", en: "Figure" },
  作品: { tc: "作品", en: "Work" },
  理論: { tc: "理論", en: "Theory" },
  時代: { tc: "時代", en: "Era" },
  地區: { tc: "地區", en: "Region" },
  領域: { tc: "領域", en: "Discipline" },
  總覽: { tc: "總覽", en: "Overview" },
}

const statusMap: Record<string, { label: string; en: string; symbol: string }> = {
  draft: { label: "草稿", en: "Draft", symbol: "○" },
  stub: { label: "雛形", en: "Stub", symbol: "◐" },
  full: { label: "完整", en: "Full", symbol: "●" },
}

const ArticleHero: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const fm: any = fileData.frontmatter ?? {}
  const type = fm.type as string | undefined
  if (!type || !typeMap[type]) return null
  if (fileData.slug === "index") return null
  // 列表頁 (folder index) 已經有自己的 hero,不要再上
  if (fileData.slug?.endsWith("/index")) return null

  const typeLabel = typeMap[type]
  const title = (fm.title as string) ?? ""

  // 建 title → slug 索引,讓 meta 連結到對應頁
  const titleIndex = new Map<string, string>()
  for (const f of allFiles) {
    const t = (f.frontmatter as any)?.title
    if (typeof t === "string" && f.slug) titleIndex.set(t, f.slug)
  }

  const linkOr = (v: string) => {
    const target = titleIndex.get(v)
    if (target && target !== fileData.slug) {
      return (
        <a class="hero-meta-link" href={resolveRelative(fileData.slug!, target)}>
          {v}
        </a>
      )
    }
    return <span>{v}</span>
  }

  type MetaItem = { label: string; nodes: any[] }
  const items: MetaItem[] = []

  if (type === "流派") {
    if (fm.year_start != null || fm.year_end != null) {
      items.push({ label: "Years", nodes: [yearRange(fm.year_start, fm.year_end)] })
    }
    if (fm.era) items.push({ label: "Era", nodes: [String(fm.era)] })
    if (fm.region) items.push({ label: "Region", nodes: [String(fm.region)] })
    const field = arr(fm.field)
    if (field.length) items.push({ label: "Discipline", nodes: field })
  } else if (type === "人物") {
    if (fm.name_original) items.push({ label: "Original", nodes: [String(fm.name_original)] })
    if (fm.birth != null || fm.death != null) {
      items.push({ label: "Lifespan", nodes: [yearRange(fm.birth, fm.death)] })
    }
    if (fm.nationality) items.push({ label: "Nationality", nodes: [String(fm.nationality)] })
    const field = arr(fm.field)
    if (field.length) items.push({ label: "Discipline", nodes: field })
  } else if (type === "作品") {
    if (fm.year != null) items.push({ label: "Year", nodes: [String(fm.year)] })
    const designer = arr(fm.designer)
    if (designer.length) items.push({ label: "Designer", nodes: designer.map(linkOr) })
    const movement = arr(fm.movement)
    if (movement.length) items.push({ label: "Movement", nodes: movement.map(linkOr) })
    const field = arr(fm.field)
    if (field.length) items.push({ label: "Discipline", nodes: field })
    if (fm.location) items.push({ label: "Location", nodes: [String(fm.location)] })
  } else if (type === "理論") {
    const author = arr(fm.author)
    if (author.length) items.push({ label: "Proposed by", nodes: author.map(linkOr) })
    if (fm.year != null) items.push({ label: "Year", nodes: [String(fm.year)] })
    const movs = arr(fm.related_movements)
    if (movs.length) items.push({ label: "Movements", nodes: movs.map(linkOr) })
  }

  const statusKey = typeof fm.status === "string" ? fm.status.toLowerCase() : ""
  const status = statusMap[statusKey]

  // Last updated 從 dates(由 CreatedModifiedDate plugin 提供)
  const dates: any = (fileData as any).dates
  let lastUpdated: string | null = null
  if (dates?.modified instanceof Date) {
    const d = dates.modified
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    lastUpdated = `${yyyy}-${mm}-${dd}`
  }

  return (
    <header class={`article-hero article-hero--${type}`}>
      <div class="article-hero-top">
        <div class="article-hero-eyebrow">
          <span class="article-hero-type-en">{typeLabel.en}</span>
          <span class="article-hero-type-sep">·</span>
          <span class="article-hero-type-tc">{typeLabel.tc}</span>
        </div>
        {status && (
          <span
            class={`article-hero-status status-${statusKey}`}
            title={`內容狀態:${status.label} · ${status.en}`}
          >
            <span class="article-hero-status-symbol" aria-hidden="true">
              {status.symbol}
            </span>
            <span class="article-hero-status-label">
              {status.en} · {status.label}
            </span>
          </span>
        )}
      </div>
      <h1 class="article-hero-title">{title}</h1>
      {fm.name_original && type === "人物" && (
        <p class="article-hero-subtitle">{String(fm.name_original)}</p>
      )}
      {items.length > 0 && (
        <dl class="article-hero-meta">
          {items.map(({ label, nodes }) => (
            <div class="article-hero-meta-row">
              <dt>{label}</dt>
              <dd>
                {nodes.map((n: any, i: number) => (
                  <>
                    {i > 0 && <span class="article-hero-meta-comma">, </span>}
                    {typeof n === "string" ? <span>{n}</span> : n}
                  </>
                ))}
              </dd>
            </div>
          ))}
          {lastUpdated && (
            <div class="article-hero-meta-row">
              <dt>Last updated</dt>
              <dd>
                <time dateTime={lastUpdated}>{lastUpdated}</time>
              </dd>
            </div>
          )}
        </dl>
      )}
    </header>
  )
}

ArticleHero.css = style

export default (() => ArticleHero) satisfies QuartzComponentConstructor
