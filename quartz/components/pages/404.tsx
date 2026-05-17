import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  return (
    <article class="popover-hint not-found-page">
      <header class="not-found-hero">
        <div class="not-found-eyebrow">
          <span class="not-found-eyebrow-en">Error</span>
          <span class="not-found-eyebrow-sep">·</span>
          <span class="not-found-eyebrow-tc">錯誤</span>
        </div>
        <h1 class="not-found-code">404</h1>
        <p class="not-found-lede">The work isn't here. 你要找的頁面已不存在,或從未存在過。</p>
      </header>

      <section class="not-found-actions">
        <a class="not-found-cta" href={baseDir}>
          <span class="not-found-cta-tc">回首頁</span>
          <span class="not-found-cta-en">Home</span>
        </a>
        <a class="not-found-cta" href={`${baseDir}40-流派`}>
          <span class="not-found-cta-tc">瀏覽流派</span>
          <span class="not-found-cta-en">Movements</span>
        </a>
        <a class="not-found-cta" href={`${baseDir}60-作品`}>
          <span class="not-found-cta-tc">瀏覽作品</span>
          <span class="not-found-cta-en">Works</span>
        </a>
      </section>
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
