// @ts-ignore
import script from "./scripts/articleActions.inline"
import style from "./styles/articleActions.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

// 詳情頁右下方浮動三鍵:Share / Save / Cite
// 只在 type=流派/人物/作品/理論 顯示

const ArticleActions: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const fm: any = fileData.frontmatter ?? {}
  if (!["流派", "人物", "作品", "理論"].includes(fm.type)) return null

  const title = String(fm.title ?? "")
  const year =
    fm.year ??
    fm.year_start ??
    fm.birth ??
    ""
  const designer = Array.isArray(fm.designer)
    ? fm.designer[0]
    : Array.isArray(fm.author)
      ? fm.author[0]
      : fm.designer ?? fm.author ?? ""

  return (
    <aside
      class="article-actions"
      aria-label="文章操作"
      data-title={title}
      data-type={fm.type}
      data-year={String(year ?? "")}
      data-author={
        typeof designer === "string"
          ? designer.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0]
          : ""
      }
    >
      <button class="article-action" data-action="share" aria-label="分享 / Share">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <line x1="8.2" y1="10.8" x2="15.8" y2="6.5" />
          <line x1="8.2" y1="13.2" x2="15.8" y2="17.5" />
        </svg>
        <span class="article-action-label">分享</span>
      </button>

      <button class="article-action" data-action="save" aria-label="收藏 / Save">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 4h14v17l-7-4-7 4V4z" />
        </svg>
        <span class="article-action-label">收藏</span>
      </button>

      <button class="article-action" data-action="cite" aria-label="引用 / Cite">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M7 7v4h3l-2 4M14 7v4h3l-2 4" />
        </svg>
        <span class="article-action-label">引用</span>
      </button>

      {/* Toast 訊息 */}
      <div class="article-action-toast" role="status" aria-live="polite"></div>

      {/* Cite modal */}
      <div class="cite-modal" role="dialog" aria-modal="true" aria-labelledby="cite-modal-title" hidden>
        <div class="cite-modal-inner">
          <header class="cite-modal-head">
            <h3 id="cite-modal-title">引用此條目 · Cite this entry</h3>
            <button class="cite-modal-close" aria-label="關閉">×</button>
          </header>
          <div class="cite-modal-tabs">
            <button class="cite-tab is-active" data-cite-format="chicago">Chicago</button>
            <button class="cite-tab" data-cite-format="apa">APA</button>
            <button class="cite-tab" data-cite-format="mla">MLA</button>
            <button class="cite-tab" data-cite-format="bibtex">BibTeX</button>
          </div>
          <div class="cite-modal-body">
            <pre class="cite-output" tabindex="0"></pre>
            <button class="cite-copy" data-copy-cite>複製 · Copy</button>
          </div>
        </div>
      </div>
    </aside>
  )
}

ArticleActions.afterDOMLoaded = script
ArticleActions.css = style

export default (() => ArticleActions) satisfies QuartzComponentConstructor
