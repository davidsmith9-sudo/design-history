// Scroll / load-driven hero stagger reveal — landing only
// 元素先隱藏(opacity 0 + translateY 12px),逐個 reveal

const reduced =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

function init() {
  const hero = document.querySelector<HTMLElement>(".eye-hero")
  if (!hero) return

  // 標記所有需要進場的元素 — 按出現順序
  const targets: HTMLElement[] = []
  const h1 = hero.querySelector<HTMLElement>("h1")
  const lede = hero.querySelector<HTMLElement>(".eye-hero-lede")
  const meta = hero.querySelector<HTMLElement>(".eye-hero-meta")
  const stats = hero.querySelector<HTMLElement>(".eye-stats")
  if (h1) targets.push(h1)
  if (lede) targets.push(lede)
  if (meta) targets.push(meta)
  if (stats) {
    stats.querySelectorAll<HTMLElement>(":scope > div").forEach((d) => targets.push(d))
  }

  // 後續 section labels 也淡入,但需要 IntersectionObserver 觸發
  const sections = document.querySelectorAll<HTMLElement>(
    "body[data-slug='index'] .center > article > .eye-section-label, body[data-slug='index'] .center > article > .eye-curated, body[data-slug='index'] .center > article > .eye-primary-grid, body[data-slug='index'] .center > article > .eye-index-list",
  )

  if (reduced) return // 無動畫:不加入任何 class,保持原狀

  targets.forEach((el) => el.classList.add("intro-step"))
  sections.forEach((el) => el.classList.add("intro-step-section"))

  // Hero 在 first paint 就 reveal,連續 stagger
  requestAnimationFrame(() => {
    targets.forEach((el, i) => {
      setTimeout(() => el.classList.add("is-revealed"), 80 + i * 90)
    })
  })

  // 後續 section 用 IntersectionObserver
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          ;(entry.target as HTMLElement).classList.add("is-revealed")
          io.unobserve(entry.target)
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
  )
  sections.forEach((el) => io.observe(el))
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
document.addEventListener("nav", () => init())
