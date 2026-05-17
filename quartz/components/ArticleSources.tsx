import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

// 文章末尾的「來源與圖片版權」區塊
// 從 frontmatter 的 sources 陣列渲出來源連結;一律附通用圖片版權聲明

const ArticleSources: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const fm: any = fileData.frontmatter ?? {}
  if (!["流派", "人物", "作品", "理論"].includes(fm.type)) return null

  const sources: string[] = Array.isArray(fm.sources)
    ? fm.sources.filter((s: any) => typeof s === "string")
    : []

  // 判斷主要來源
  const isWiki = (u: string) => /wikipedia\.org/i.test(u)
  const hostnameOf = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "")
    } catch {
      return u
    }
  }

  return (
    <section class="article-sources" aria-labelledby="sources-heading">
      <span class="eye-section-label" id="sources-heading">
        Sources &amp; Credits · 來源與版權
      </span>

      {sources.length > 0 ? (
        <>
          <p class="article-sources-lede">
            本條目資料整理自下列來源,圖片版權歸原作 / 機構所有(以下連結可追溯)。本站文字部分遵循
            <a href="/00-總覽/授權" class="article-sources-license"> CC BY-SA 4.0</a>。
          </p>
          <ul class="article-sources-list">
            {sources.map((src) => (
              <li>
                <a href={src} target="_blank" rel="noopener noreferrer">
                  <span class="article-sources-host">{hostnameOf(src)}</span>
                  <span class="article-sources-tag">
                    {isWiki(src) ? "Wikipedia" : "External"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p class="article-sources-lede article-sources-lede--empty">
          本條目尚未列出明確來源 · 圖片以教育用途使用,版權歸原作所有。完整版權說明見
          <a href="/00-總覽/授權" class="article-sources-license"> 授權頁</a>。
        </p>
      )}
    </section>
  )
}

ArticleSources.css = `
.article-sources {
  margin: 4rem 0 0;
  padding: 3rem 0 0;
  border-top: 1px solid var(--lightgray);
}

.article-sources > .eye-section-label {
  margin-top: 0;
  border: none;
  padding-bottom: 0.5rem;
}

.article-sources-lede {
  font-family: var(--bodyFont);
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--darkgray);
  margin: 0.6rem 0 1.5rem;
  max-width: 58ch;
}

.article-sources-lede--empty {
  color: var(--gray);
  font-style: italic;
}

.article-sources-license {
  color: var(--secondary) !important;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-decoration-color: var(--lightgray);
  text-underline-offset: 3px;
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
}

.article-sources-license:hover {
  text-decoration-color: var(--secondary) !important;
}

.article-sources-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--lightgray);
}

.article-sources-list li {
  margin: 0;
  padding: 0;
  list-style: none;
  border-bottom: 1px solid var(--lightgray);
}

.article-sources-list a {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0.25rem;
  text-decoration: none !important;
  background: transparent !important;
  color: var(--dark);
  transition: padding-left 0.2s ease, background 0.2s ease;
}

.article-sources-list a:hover {
  padding-left: 1rem;
  background: linear-gradient(to right, var(--light) 0%, transparent 60%);
}

.article-sources-host {
  font-family: var(--codeFont);
  font-size: 0.82rem;
  letter-spacing: 0;
  color: var(--darkgray);
  word-break: break-all;
  flex: 1;
  min-width: 0;
}

.article-sources-tag {
  font-family: var(--bodyFont);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--gray);
  font-weight: 500;
  flex-shrink: 0;
}
`

export default (() => ArticleSources) satisfies QuartzComponentConstructor
