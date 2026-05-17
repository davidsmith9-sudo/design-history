import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/articleRelated.scss"
import { resolveRelative } from "../util/path"

// 顯示在 EyeBacklinks 之前 — 作品/流派詳情頁的「同代橫向 strip」與「影響鏈 mini-flowchart」

function clean(s: string): string {
  const m = s.match(/^\[\[(.+?)(?:\|(.+?))?\]\]$/)
  return m ? (m[2] ?? m[1]) : s
}

function arr(v: any): string[] {
  if (v == null) return []
  const out = Array.isArray(v) ? v : [v]
  return out.map((x) => (typeof x === "string" ? clean(x) : String(x ?? ""))).filter(Boolean)
}

// 譜系資料 — 與 content/index.md mermaid 同步
const genealogy: Record<string, { predecessors: string[]; successors: string[] }> = {
  工藝美術運動: { predecessors: [], successors: ["新藝術運動", "包浩斯"] },
  新藝術運動: { predecessors: ["工藝美術運動"], successors: ["維也納分離派", "裝飾藝術"] },
  維也納分離派: { predecessors: ["新藝術運動"], successors: [] },
  構成主義: { predecessors: [], successors: ["包浩斯"] },
  達達主義: { predecessors: [], successors: ["普普藝術"] },
  風格派: { predecessors: [], successors: ["包浩斯", "國際樣式"] },
  包浩斯: {
    predecessors: ["工藝美術運動", "構成主義", "風格派"],
    successors: ["國際樣式", "瑞士國際主義"],
  },
  裝飾藝術: { predecessors: ["新藝術運動"], successors: [] },
  國際樣式: { predecessors: ["風格派", "包浩斯"], successors: ["解構主義"] },
  瑞士國際主義: { predecessors: ["包浩斯"], successors: [] },
  普普藝術: { predecessors: ["達達主義"], successors: ["孟菲斯設計"] },
  解構主義: { predecessors: ["國際樣式"], successors: [] },
  孟菲斯設計: { predecessors: ["普普藝術"], successors: [] },
}

const ArticleRelated: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const fm: any = fileData.frontmatter ?? {}
  const type = fm.type
  if (!type || !["作品", "流派"].includes(type)) return null
  if (!fileData.slug) return null

  // title → file 索引
  const titleIndex = new Map<string, (typeof allFiles)[number]>()
  for (const f of allFiles) {
    const t = (f.frontmatter as any)?.title
    if (typeof t === "string") titleIndex.set(t, f)
  }
  const titleToSlug = (t: string) => titleIndex.get(t)?.slug

  // ── 作品 hero ─────────────────────────────────────────
  if (type === "作品") {
    const year = typeof fm.year === "number" ? fm.year : parseInt(String(fm.year), 10)
    if (!isFinite(year)) return null

    // 取 ±15 年 同 field 的其他作品(排除自己),按年代排
    const myField = arr(fm.field)[0] ?? null
    const window = 15
    const neighbours = allFiles
      .filter((f) => {
        const ffm: any = f.frontmatter ?? {}
        if (ffm.type !== "作品") return false
        if (f.slug === fileData.slug) return false
        const y = typeof ffm.year === "number" ? ffm.year : parseInt(String(ffm.year), 10)
        if (!isFinite(y)) return false
        if (Math.abs(y - year) > window) return false
        return true
      })
      .map((f) => {
        const ffm: any = f.frontmatter ?? {}
        const y =
          typeof ffm.year === "number" ? ffm.year : parseInt(String(ffm.year), 10)
        return { file: f, year: y, fieldMatch: arr(ffm.field).includes(myField ?? "") }
      })
      .sort((a, b) => {
        if (a.fieldMatch !== b.fieldMatch) return a.fieldMatch ? -1 : 1
        return a.year - b.year
      })
      .slice(0, 8)

    if (neighbours.length === 0) return null

    return (
      <section class="article-related">
        <span class="eye-section-label">Contemporaries · 同代作品</span>
        <p class="article-related-lede">
          {year - window}–{year + window} 年間其他關鍵設計作品
          {myField ? `(優先顯示同領域:${myField})` : ""}。
        </p>
        <ul class="article-related-strip">
          {neighbours.map(({ file, year: y }) => {
            const t = (file.frontmatter as any)?.title as string
            return (
              <li>
                <a href={resolveRelative(fileData.slug!, file.slug!)}>
                  <div class="article-related-card-meta">
                    <span class="article-related-card-year">{y}</span>
                    <h4>{t}</h4>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  // ── 流派 mini-flowchart ───────────────────────────────
  if (type === "流派") {
    const myTitle = String(fm.title ?? "")
    const node = genealogy[myTitle]
    if (!node) return null
    const { predecessors, successors } = node
    if (predecessors.length === 0 && successors.length === 0) return null

    const renderNode = (name: string) => {
      const slug = titleToSlug(name)
      const href = slug ? resolveRelative(fileData.slug!, slug) : "#"
      return (
        <a class="mini-flow-node" href={href}>
          {name}
        </a>
      )
    }

    return (
      <section class="article-related">
        <span class="eye-section-label">Lineage · 影響鏈</span>
        <p class="article-related-lede">這個流派在設計史譜系裡的直接前驅與後繼。</p>
        <div class="mini-flow">
          <div class="mini-flow-col mini-flow-col--prev">
            <span class="mini-flow-label">Predecessors</span>
            {predecessors.length > 0 ? (
              predecessors.map(renderNode)
            ) : (
              <span class="mini-flow-empty">—</span>
            )}
          </div>
          <div class="mini-flow-col mini-flow-col--self">
            <span class="mini-flow-label">This movement</span>
            <span class="mini-flow-node mini-flow-node--self">{myTitle}</span>
          </div>
          <div class="mini-flow-col mini-flow-col--next">
            <span class="mini-flow-label">Successors</span>
            {successors.length > 0 ? (
              successors.map(renderNode)
            ) : (
              <span class="mini-flow-empty">—</span>
            )}
          </div>
        </div>
      </section>
    )
  }

  return null
}

ArticleRelated.css = style

export default (() => ArticleRelated) satisfies QuartzComponentConstructor
