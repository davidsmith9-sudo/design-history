import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import style from "../styles/listPage.scss"
import { PageList, SortFn } from "../PageList"
import { FullSlug, getAllSegmentPrefixes, resolveRelative, simplifySlug } from "../../util/path"
import { QuartzPluginData } from "../../plugins/vfile"
import { Root } from "hast"
import { htmlToJsx } from "../../util/jsx"
import { i18n } from "../../i18n"
import { ComponentChildren } from "preact"
import { concatenateResources } from "../../util/resources"

interface TagContentOptions {
  sort?: SortFn
  numPages: number
}

const defaultOptions: TagContentOptions = {
  numPages: 10,
}

export default ((opts?: Partial<TagContentOptions>) => {
  const options: TagContentOptions = { ...defaultOptions, ...opts }

  const TagContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles, cfg } = props
    const slug = fileData.slug

    if (!(slug?.startsWith("tags/") || slug === "tags")) {
      throw new Error(`Component "TagContent" tried to render a non-tag page: ${slug}`)
    }

    const tag = simplifySlug(slug.slice("tags/".length) as FullSlug)
    const allPagesWithTag = (tag: string) =>
      allFiles.filter((file) =>
        (file.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes).includes(tag),
      )

    const content = (
      (tree as Root).children.length === 0
        ? fileData.description
        : htmlToJsx(fileData.filePath!, tree)
    ) as ComponentChildren
    const cssClasses: string[] = fileData.frontmatter?.cssclasses ?? []
    const classes = cssClasses.join(" ")
    if (tag === "/") {
      const tags = [
        ...new Set(
          allFiles.flatMap((data) => data.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes),
        ),
      ].sort((a, b) => a.localeCompare(b))
      const tagItemMap: Map<string, QuartzPluginData[]> = new Map()
      for (const tag of tags) {
        tagItemMap.set(tag, allPagesWithTag(tag))
      }
      return (
        <div class="popover-hint tag-page tag-page--index">
          <header class="article-hero article-hero--tag">
            <div class="article-hero-eyebrow">
              <span class="article-hero-type-en">Index</span>
              <span class="article-hero-type-sep">·</span>
              <span class="article-hero-type-tc">標籤索引</span>
            </div>
            <h1 class="article-hero-title">Tags</h1>
            <dl class="article-hero-meta">
              <div class="article-hero-meta-row">
                <dt>Total</dt>
                <dd>{tags.length}</dd>
              </div>
            </dl>
          </header>
          {content && (
            <article class={classes} style={{ marginBottom: "2rem" }}>
              <p>{content}</p>
            </article>
          )}
          <div class="tag-index-list">
            {tags.map((tag) => {
              const pages = tagItemMap.get(tag)!
              const listProps = {
                ...props,
                allFiles: pages,
              }

              const contentPage = allFiles.filter((file) => file.slug === `tags/${tag}`).at(0)

              const root = contentPage?.htmlAst
              const content =
                !root || root?.children.length === 0
                  ? contentPage?.description
                  : htmlToJsx(contentPage.filePath!, root)

              const tagListingPage = `/tags/${tag}` as FullSlug
              const href = resolveRelative(fileData.slug!, tagListingPage)

              return (
                <section class="tag-index-section">
                  <header class="tag-index-section-head">
                    <h2 class="tag-index-section-title">
                      <a class="internal tag-link" href={href}>
                        {tag}
                      </a>
                    </h2>
                    <span class="tag-index-section-count">{pages.length}</span>
                  </header>
                  {content && <p class="tag-index-section-lede">{content}</p>}
                  <div class="page-listing">
                    <PageList limit={options.numPages} {...listProps} sort={options?.sort} />
                    {pages.length > options.numPages && (
                      <p class="tag-index-section-more">
                        <a class="internal" href={href}>
                          顯示全部 {pages.length} 個 →
                        </a>
                      </p>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )
    } else {
      const pages = allPagesWithTag(tag)
      const listProps = {
        ...props,
        allFiles: pages,
      }

      return (
        <div class="popover-hint tag-page">
          <header class="article-hero article-hero--tag">
            <div class="article-hero-eyebrow">
              <span class="article-hero-type-en">Tag</span>
              <span class="article-hero-type-sep">·</span>
              <span class="article-hero-type-tc">標籤</span>
            </div>
            <h1 class="article-hero-title">#{tag}</h1>
            <dl class="article-hero-meta">
              <div class="article-hero-meta-row">
                <dt>Items</dt>
                <dd>{pages.length}</dd>
              </div>
            </dl>
          </header>
          {content && (
            <article class={classes} style={{ marginBottom: "2rem" }}>
              {content}
            </article>
          )}
          <div class="page-listing tag-page-listing">
            <PageList {...listProps} sort={options?.sort} />
          </div>
        </div>
      )
    }
  }

  TagContent.css = concatenateResources(style, PageList.css)
  return TagContent
}) satisfies QuartzComponentConstructor
