// Sticky chapter strip — 長文閱讀時顯示「[標題] / [type] / §02 [當前章節]」
// 用 IntersectionObserver 追蹤 H2

interface State {
  observer?: IntersectionObserver
  titleEl?: HTMLElement
  typeEl?: HTMLElement
  numEl?: HTMLElement
  chapterEl?: HTMLElement
}

const state: State = {}

function init() {
  const article = document.querySelector<HTMLElement>(".center > article")
  if (!article) return
  const hero = article.querySelector<HTMLElement>(".article-hero")
  if (!hero) {
    // 非詳情頁,移除舊 strip(若存在)
    document.getElementById("chapter-strip")?.remove()
    return
  }
  const h2s = Array.from(article.querySelectorAll<HTMLElement>(":scope > h2"))
  if (h2s.length === 0) {
    document.getElementById("chapter-strip")?.remove()
    return
  }

  // 移除舊 strip 重建
  document.getElementById("chapter-strip")?.remove()
  state.observer?.disconnect()

  const titleText = hero.querySelector(".article-hero-title")?.textContent?.trim() ?? ""
  const typeText =
    hero.querySelector(".article-hero-type-tc")?.textContent?.trim() ?? ""

  const strip = document.createElement("div")
  strip.id = "chapter-strip"
  strip.className = "chapter-strip"
  strip.setAttribute("aria-hidden", "true")
  strip.innerHTML = `
    <div class="chapter-strip-inner">
      <span class="chapter-strip-title"></span>
      <span class="chapter-strip-sep">·</span>
      <span class="chapter-strip-type"></span>
      <span class="chapter-strip-sep">·</span>
      <span class="chapter-strip-num"></span>
      <span class="chapter-strip-chapter"></span>
    </div>
  `
  document.body.appendChild(strip)

  state.titleEl = strip.querySelector(".chapter-strip-title") as HTMLElement
  state.typeEl = strip.querySelector(".chapter-strip-type") as HTMLElement
  state.numEl = strip.querySelector(".chapter-strip-num") as HTMLElement
  state.chapterEl = strip.querySelector(".chapter-strip-chapter") as HTMLElement
  state.titleEl.textContent = titleText
  state.typeEl.textContent = typeText

  const updateChapter = (h2: HTMLElement, idx: number) => {
    const text = h2.textContent?.trim() ?? ""
    state.numEl!.textContent = `§${String(idx + 1).padStart(2, "0")}`
    state.chapterEl!.textContent = text
    strip.classList.add("is-visible")
  }

  const showStrip = () => strip.classList.add("is-visible")
  const hideStrip = () => strip.classList.remove("is-visible")

  // IntersectionObserver:當任何 H2 進入視窗上方區域時更新
  // 用 rootMargin "-80px 0px -70% 0px" — 取視窗頂部往下 80~30% 區段為「active 帶」
  state.observer = new IntersectionObserver(
    (entries) => {
      // 找最後一個已捲過的 h2(intersect 或位於上方)
      const allRect = h2s.map((h, i) => ({ h, i, rect: h.getBoundingClientRect() }))
      const activeIdx = (() => {
        // 任一 H2 在視窗上方 120px 之內最近 = active
        let best = -1
        for (let i = 0; i < allRect.length; i++) {
          if (allRect[i].rect.top < 120) best = i
        }
        return best
      })()
      if (activeIdx === -1) {
        hideStrip()
      } else {
        updateChapter(h2s[activeIdx], activeIdx)
      }
    },
    { rootMargin: "-80px 0px -50% 0px", threshold: [0, 1] },
  )
  h2s.forEach((h) => state.observer!.observe(h))

  // 額外:捲動時用 hero 是否離開視窗來開關
  const heroObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          hideStrip()
        } else {
          // hero 離開後,看當前 H2 active
          const allRect = h2s.map((h, i) => ({ h, i, rect: h.getBoundingClientRect() }))
          let active = -1
          for (let i = 0; i < allRect.length; i++) {
            if (allRect[i].rect.top < 120) active = i
          }
          if (active >= 0) updateChapter(h2s[active], active)
        }
      }
    },
    { rootMargin: "-60px 0px 0px 0px", threshold: [0] },
  )
  heroObserver.observe(hero)

  // 行動版:scroll 方向偵測,往下滑時隱藏 strip,往上滑時顯示
  const isMobile = () => window.matchMedia("(max-width: 800px)").matches
  let lastScrollY = window.scrollY
  let scrollTicking = false

  const onScroll = () => {
    if (!isMobile()) return
    if (scrollTicking) return
    scrollTicking = true
    requestAnimationFrame(() => {
      const cur = window.scrollY
      const dy = cur - lastScrollY
      if (Math.abs(dy) > 6) {
        if (dy > 0 && cur > 200) {
          // 往下滑且已捲過一段 → 隱藏 strip 騰出閱讀空間
          strip.classList.add("is-hidden-on-scroll")
        } else if (dy < 0) {
          // 往上滑 → 顯示
          strip.classList.remove("is-hidden-on-scroll")
        }
        lastScrollY = cur
      }
      scrollTicking = false
    })
  }

  window.addEventListener("scroll", onScroll, { passive: true })
  window.addCleanup(() => window.removeEventListener("scroll", onScroll))

  window.addCleanup(() => {
    state.observer?.disconnect()
    heroObserver.disconnect()
    strip.remove()
  })
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
document.addEventListener("nav", () => init())
