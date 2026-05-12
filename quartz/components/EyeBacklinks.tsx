import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import styles from "./styles/eyeBacklinks.scss"
import { resolveRelative, simplifySlug } from "../util/path"

// 文章末尾的「引用此頁」區塊:列出哪些頁面 wikilink 到當前頁,依類型分組

const TYPE_ORDER = ["流派", "人物", "作品", "理論", "時代", "地區", "領域", "總覽", "其他"]

const EyeBacklinks: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const fm: any = fileData.frontmatter ?? {}
  // 只在「作品/人物/理論/流派」詳情頁顯示
  if (!fm.type || !["作品", "人物", "理論", "流派"].includes(fm.type)) return null
  if (!fileData.slug) return null

  const slug = simplifySlug(fileData.slug)
  const backlinks = allFiles.filter(
    (file) => file.links?.includes(slug) && file.slug !== fileData.slug,
  )
  if (backlinks.length === 0) return null

  // 依 type 分組
  const groups: Record<string, typeof backlinks> = {}
  for (const f of backlinks) {
    const t = (f.frontmatter as any)?.type ?? "其他"
    if (!groups[t]) groups[t] = []
    groups[t].push(f)
  }

  const sortedTypes = Object.keys(groups).sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a)
    const bi = TYPE_ORDER.indexOf(b)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  return (
    <section class="eye-backlinks">
      <span class="eye-section-label">引用此頁</span>
      <h2>
        {backlinks.length} 個頁面提到「{fm.title}」
      </h2>
      {sortedTypes.map((t) => (
        <div class="eye-bl-group">
          <h3 class="eye-bl-type">
            {t}
            <span class="eye-bl-count">{groups[t].length}</span>
          </h3>
          <ul class="eye-bl-list">
            {groups[t].map((f) => (
              <li>
                <a href={resolveRelative(fileData.slug!, f.slug!)} class="eye-bl-pill">
                  {(f.frontmatter as any)?.title ?? f.slug}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

EyeBacklinks.css = styles

export default (() => EyeBacklinks) satisfies QuartzComponentConstructor
