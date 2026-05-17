import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/topnav.inline"
import style from "./styles/topnav.scss"

interface NavLink {
  label: string
  href: string
  en?: string
}

interface Options {
  links?: NavLink[]
  brand?: { tc: string; en: string }
}

const defaultLinks: NavLink[] = [
  { label: "流派", en: "Movements", href: "/40-流派" },
  { label: "人物", en: "Figures", href: "/50-人物" },
  { label: "作品", en: "Works", href: "/60-作品" },
  { label: "理論", en: "Theories", href: "/70-理論" },
  { label: "時代", en: "Eras", href: "/10-時代" },
  { label: "視覺化", en: "Visualize", href: "/80-視覺化" },
]

export default ((opts?: Options) => {
  const links = opts?.links ?? defaultLinks
  const brand = opts?.brand ?? { tc: "設計史筆記", en: "DESIGN HISTORY" }

  const TopNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    return (
      <div class={`topnav ${displayClass ?? ""}`}>
        <div class="topnav-inner">
          <a href="/" class="topnav-brand">
            <span class="topnav-brand-tc">{brand.tc}</span>
            <span class="topnav-brand-en">{brand.en}</span>
          </a>

          <nav class="topnav-links" aria-label="primary">
            {links.map((l) => (
              <a href={l.href} class="topnav-link">
                <span class="topnav-link-tc">{l.label}</span>
                {l.en && <span class="topnav-link-en">{l.en}</span>}
              </a>
            ))}
          </nav>

          <a
            href="/00-總覽/我的收藏"
            class="topnav-saved"
            data-saved-link
            hidden
            aria-label="我的收藏 / My saved"
            title="我的收藏"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 4h14v17l-7-4-7 4V4z" />
            </svg>
            <span class="topnav-saved-count" data-saved-count>0</span>
          </a>

          <button
            class="topnav-random"
            data-random-jump
            aria-label="隨機跳到一個條目 / Jump to a random entry"
            title="隨機探索"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="0" />
              <circle cx="8" cy="8" r="1.2" fill="currentColor" />
              <circle cx="16" cy="8" r="1.2" fill="currentColor" />
              <circle cx="8" cy="16" r="1.2" fill="currentColor" />
              <circle cx="16" cy="16" r="1.2" fill="currentColor" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            </svg>
            <span class="topnav-random-label">隨機</span>
          </button>

          <button
            class="topnav-lang-toggle"
            data-lang-toggle
            aria-label="切換語系 / Toggle language(雙擊強制顯示 EN 提示)"
            title="點擊切換語系 · 雙擊強制顯示 EN 提示"
          >
            <span class="topnav-lang-opt" data-lang-value="tc">TW</span>
            <span class="topnav-lang-sep">·</span>
            <span class="topnav-lang-opt" data-lang-value="en">EN</span>
          </button>

          <button class="topnav-mobile-toggle" aria-label="menu" aria-expanded="false">
            <span></span>
            <span></span>
          </button>
        </div>

        <div class="topnav-drawer" aria-hidden="true">
          {/* 行動版獨有工具列:search / dark / random / lang */}
          <div class="topnav-drawer-tools">
            <button class="topnav-drawer-tool" data-drawer-action="search" aria-label="搜尋 / Search">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <span>搜尋</span>
            </button>
            <button class="topnav-drawer-tool" data-drawer-action="darkmode" aria-label="切換深色模式 / Toggle dark mode">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
                <path d="M21 12.5A9 9 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z" />
              </svg>
              <span>深色</span>
            </button>
            <button class="topnav-drawer-tool" data-drawer-action="random" aria-label="隨機跳 / Random">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" />
                <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                <circle cx="16" cy="8" r="1.2" fill="currentColor" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                <circle cx="8" cy="16" r="1.2" fill="currentColor" />
                <circle cx="16" cy="16" r="1.2" fill="currentColor" />
              </svg>
              <span>隨機</span>
            </button>
            <button class="topnav-drawer-tool" data-drawer-action="lang" aria-label="切換語系 / Toggle language">
              <span class="topnav-drawer-tool-lang">
                <span data-lang-mobile-tc>TW</span>
                <span class="topnav-drawer-tool-lang-sep">·</span>
                <span data-lang-mobile-en>EN</span>
              </span>
              <span>語系</span>
            </button>
          </div>

          {links.map((l) => (
            <a href={l.href} class="topnav-drawer-link">
              <span class="topnav-drawer-tc">{l.label}</span>
              {l.en && <span class="topnav-drawer-en">{l.en}</span>}
            </a>
          ))}
        </div>

        {/* EN 模式啟用時的誠實 banner */}
        <div class="lang-en-banner" role="region" aria-label="English mode notice" hidden>
          <div class="lang-en-banner-inner">
            <div class="lang-en-banner-text">
              <strong>Content is in Traditional Chinese only.</strong> This site's articles
              haven't been translated yet. The UI labels have switched to English, but every
              entry's body remains 中文.
            </div>
            <div class="lang-en-banner-resources">
              <span class="lang-en-banner-resources-label">English design history elsewhere</span>
              <a href="https://www.moma.org/collection/about" target="_blank" rel="noopener">
                MoMA Collection
              </a>
              <a href="https://www.vam.ac.uk/collections" target="_blank" rel="noopener">
                V&amp;A
              </a>
              <a href="https://designmuseum.org/learn-design" target="_blank" rel="noopener">
                Design Museum
              </a>
              <a href="https://en.wikipedia.org/wiki/History_of_industrial_design" target="_blank" rel="noopener">
                Wikipedia
              </a>
            </div>
            <button class="lang-en-banner-close" aria-label="Dismiss notice">×</button>
          </div>
        </div>
      </div>
    )
  }

  TopNav.css = style
  TopNav.afterDOMLoaded = script

  return TopNav
}) satisfies QuartzComponentConstructor<Options>
