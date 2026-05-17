// Grid 篩選器 + 排序 + status badge decoration

let statusManifest: Record<string, "draft" | "stub" | "full"> | null = null
let statusManifestPromise: Promise<Record<string, "draft" | "stub" | "full">> | null = null

function loadStatusManifest(): Promise<Record<string, "draft" | "stub" | "full">> {
  if (statusManifest) return Promise.resolve(statusManifest)
  if (statusManifestPromise) return statusManifestPromise
  statusManifestPromise = fetch("/static/status-manifest.json")
    .then((r) => (r.ok ? r.json() : {}))
    .then((m) => {
      statusManifest = m
      return m as Record<string, "draft" | "stub" | "full">
    })
    .catch(() => ({}))
  return statusManifestPromise
}

const statusSymbol: Record<string, string> = { draft: "○", stub: "◐", full: "●" }
const statusLabel: Record<string, string> = { draft: "Draft", stub: "Stub", full: "Full" }

async function decorateStatus(grid: HTMLElement) {
  const manifest = await loadStatusManifest()
  grid.querySelectorAll<HTMLElement>(":scope > li > a").forEach((a) => {
    const href = a.getAttribute("href") ?? ""
    // 規格化:處理相對 vs 絕對 vs trailing slash
    const cleaned = href.replace(/^\.\.?\//, "/").replace(/\/$/, "").split("?")[0].split("#")[0]
    // manifest 的 key 是 /folder/slug 格式
    let status: string | undefined
    for (const k of Object.keys(manifest)) {
      if (cleaned.endsWith(k) || k.endsWith(cleaned)) {
        status = manifest[k]
        break
      }
    }
    if (!status) return
    const li = a.parentElement
    if (!li) return
    li.dataset.status = status
    // 卡片內注入小角標(避免重複注入)
    if (li.querySelector(".eye-status-badge")) return
    const badge = document.createElement("span")
    badge.className = `eye-status-badge eye-status-badge--${status}`
    badge.setAttribute("title", `內容狀態:${statusLabel[status]}`)
    badge.innerHTML = `<span class="eye-status-symbol" aria-hidden="true">${statusSymbol[status]}</span><span class="eye-status-label">${statusLabel[status]}</span>`
    const imageDiv = li.querySelector(".eye-work-image") ?? li.querySelector("a")
    if (imageDiv) imageDiv.appendChild(badge)
  })
}

interface SortInfo {
  el: HTMLElement
  year: number
  title: string
  field: string
}

function extractInfo(li: HTMLElement): SortInfo {
  // 從 byline 取年份(尾端 4 位數)
  const byline = li.querySelector(".eye-work-byline")?.textContent ?? ""
  const yearMatch = byline.match(/(\d{4})(?!.*\d)/)
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 9999

  const title = li.querySelector("h3")?.textContent?.trim() ?? ""
  const field = (li.dataset.field ?? "").split(",")[0].trim()

  return { el: li, year, title, field }
}

function applySort(grid: HTMLElement, mode: string) {
  const items = Array.from(grid.querySelectorAll<HTMLElement>(":scope > li"))
  // era divider 不參與排序
  const cards = items
    .filter((li) => !li.classList.contains("eye-era-divider-row"))
    .map(extractInfo)

  switch (mode) {
    case "year-asc":
      cards.sort((a, b) => a.year - b.year)
      break
    case "year-desc":
      cards.sort((a, b) => b.year - a.year)
      break
    case "alpha":
      cards.sort((a, b) => a.title.localeCompare(b.title, "zh-Hant"))
      break
    case "field":
      cards.sort((a, b) => {
        const fieldCmp = a.field.localeCompare(b.field, "zh-Hant")
        if (fieldCmp !== 0) return fieldCmp
        return a.year - b.year
      })
      break
    default:
      return
  }

  // Sort 非年代序時,era divider 不合理 → 隱藏
  const isYearSort = mode === "year-asc" || mode === "year-desc"
  grid.classList.toggle("hide-era-dividers", !isYearSort)

  // 用 CSS order 屬性重排(grid order 屬性也有效)
  cards.forEach(({ el }, idx) => {
    el.style.order = String(idx)
  })
  // 把 era divider order 設為 -1 推到前面(被隱藏所以無視覺影響),
  // 或維持原樣 — 兩種都可,反正被 hide
  items
    .filter((li) => li.classList.contains("eye-era-divider-row"))
    .forEach((li) => {
      li.style.order = ""
    })
}

async function injectStatusFilter(grid: HTMLElement): Promise<void> {
  const manifest = await loadStatusManifest()
  if (Object.keys(manifest).length === 0) return
  if (document.querySelector('.eye-filter-group[data-key="status"]')) return

  // 統計 grid 內各 status 的數量
  const counts: Record<string, number> = { draft: 0, stub: 0, full: 0 }
  grid.querySelectorAll<HTMLElement>(":scope > li").forEach((li) => {
    const s = li.dataset.status
    if (s && counts[s] !== undefined) counts[s]++
  })
  const total = counts.draft + counts.stub + counts.full
  if (total === 0) return

  const filters = document.querySelector<HTMLElement>(".eye-filters")
  if (!filters) return

  const group = document.createElement("div")
  group.className = "eye-filter-group"
  group.dataset.key = "status"
  group.innerHTML = `
    <span class="eye-filter-label">狀態</span>
    <button class="eye-filter-btn active" data-filter="all">全部</button>
    ${counts.full > 0 ? `<button class="eye-filter-btn" data-filter="full">完整 ${counts.full}</button>` : ""}
    ${counts.stub > 0 ? `<button class="eye-filter-btn" data-filter="stub">雛形 ${counts.stub}</button>` : ""}
    ${counts.draft > 0 ? `<button class="eye-filter-btn" data-filter="draft">草稿 ${counts.draft}</button>` : ""}
  `
  filters.appendChild(group)
}

function injectSortToolbar(grid: HTMLElement): HTMLElement | null {
  // 已注入則跳過
  if (document.querySelector(".eye-sort")) return null

  // 找適合的插入點:.eye-filters 前面;若無 filter 則在 grid 前
  const filters = document.querySelector(".eye-filters")

  const sort = document.createElement("div")
  sort.className = "eye-sort"
  sort.innerHTML = `
    <span class="eye-sort-label">Sort by</span>
    <button class="eye-sort-btn is-active" data-sort="year-asc">年代 ↑ <em>Year ascending</em></button>
    <button class="eye-sort-btn" data-sort="year-desc">年代 ↓ <em>Year descending</em></button>
    <button class="eye-sort-btn" data-sort="alpha">字母 <em>Alphabetical</em></button>
    <button class="eye-sort-btn" data-sort="field">領域 <em>By discipline</em></button>
  `

  if (filters) {
    filters.parentNode?.insertBefore(sort, filters)
  } else {
    grid.parentNode?.insertBefore(sort, grid)
  }
  return sort
}

async function bootstrap() {
  const grid = document.querySelector<HTMLElement>(".eye-works-grid")
  if (grid) {
    await decorateStatus(grid)
    await injectStatusFilter(grid)
  }
  init()
  initGridKeyboardNav()
  initInViewReveal()
}

function init() {
  const groups = document.querySelectorAll<HTMLElement>(".eye-filter-group")
  const grid = document.querySelector<HTMLElement>(".eye-works-grid")
  const hasFilter = groups.length > 0

  // ── Sort 初始化 ──────────────────────────────────────
  if (grid) {
    const sort = injectSortToolbar(grid) ?? document.querySelector<HTMLElement>(".eye-sort")
    if (sort) {
      // 對 grid 加 display: flex; flex-wrap: wrap 不會破壞既有 grid 佈局,
      // 因為 grid container 的 order 屬性 CSS Grid 也支援!
      sort.addEventListener("click", (ev) => {
        const btn = (ev.target as HTMLElement).closest<HTMLElement>(".eye-sort-btn")
        if (!btn) return
        const mode = btn.dataset.sort ?? "year-asc"
        sort.querySelectorAll(".eye-sort-btn").forEach((b) => b.classList.remove("is-active"))
        btn.classList.add("is-active")
        applySort(grid, mode)
      })
    }
  }

  // ── Filter 初始化(原邏輯) ───────────────────────────
  if (!hasFilter || !grid) return
  const state: Record<string, string> = {}
  groups.forEach((group) => {
    const key = group.dataset.key
    if (!key) return
    state[key] = "all"
    group.querySelectorAll<HTMLButtonElement>(".eye-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter ?? "all"
        state[key] = filter
        group.querySelectorAll(".eye-filter-btn").forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")
        applyFilter()
      })
    })
  })

  const empty = document.querySelector<HTMLElement>(".eye-filter-empty")

  function applyFilter() {
    let visible = 0
    const allItems = Array.from(grid!.querySelectorAll<HTMLElement>(":scope > li"))
    // 1. 先處理所有非 marker 卡片
    allItems.forEach((li) => {
      if (li.classList.contains("eye-era-divider-row")) return
      let show = true
      for (const [key, filter] of Object.entries(state)) {
        if (filter === "all") continue
        const val = li.dataset[key] ?? ""
        const vals = val.split(",").map((s) => s.trim())
        if (!vals.includes(filter)) {
          show = false
          break
        }
      }
      li.classList.toggle("eye-filter-hidden", !show)
      if (show) visible++
    })
    // 2. 處理 era markers:沒卡片在它跟下一個 marker 之間時隱藏
    let lastMarker: HTMLElement | null = null
    let countSinceMarker = 0
    const finalizeMarker = () => {
      if (lastMarker) {
        lastMarker.classList.toggle("eye-filter-hidden", countSinceMarker === 0)
      }
    }
    allItems.forEach((li) => {
      if (li.classList.contains("eye-era-divider-row")) {
        finalizeMarker()
        lastMarker = li
        countSinceMarker = 0
      } else if (!li.classList.contains("eye-filter-hidden")) {
        countSinceMarker++
      }
    })
    finalizeMarker()

    if (empty) empty.classList.toggle("show", visible === 0)
  }
  applyFilter() // 初始化時跑一次,設定 marker 可見性
}

// ── 行動版「tap-to-reveal」hover ───────────────────────
// 用 IntersectionObserver,當卡片進入視窗中央 50% 範圍時加 .is-in-view
// CSS 在 mobile 用此 class 觸發跟 hover 同等的視覺效果
function initInViewReveal() {
  if (!window.matchMedia("(max-width: 800px)").matches) return
  const grids = document.querySelectorAll<HTMLElement>(".eye-works-grid")
  if (grids.length === 0) return
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        ;(e.target as HTMLElement).classList.toggle("is-in-view", e.isIntersecting)
      }
    },
    { rootMargin: "-30% 0px -30% 0px", threshold: 0.01 },
  )
  grids.forEach((grid) => {
    grid.querySelectorAll<HTMLElement>(":scope > li").forEach((li) => io.observe(li))
  })
}

// ── 鍵盤導覽:eye-works-grid 內用方向鍵在卡片間移動 ────
function initGridKeyboardNav() {
  const grid = document.querySelector<HTMLElement>(".eye-works-grid")
  if (!grid) return
  grid.addEventListener("keydown", (ev) => {
    const e = ev as KeyboardEvent
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return
    const target = e.target as HTMLElement
    const link = target.closest<HTMLElement>(".eye-works-grid > li > a")
    if (!link) return
    const allLinks = Array.from(
      grid.querySelectorAll<HTMLElement>("li:not(.eye-filter-hidden) > a"),
    )
    const idx = allLinks.indexOf(link)
    if (idx === -1) return

    // 估算每列卡片數(用 grid 的 computed column count)
    const gridStyle = window.getComputedStyle(grid)
    const cols = gridStyle.gridTemplateColumns.split(" ").length

    let nextIdx = idx
    if (e.key === "ArrowRight") nextIdx = idx + 1
    else if (e.key === "ArrowLeft") nextIdx = idx - 1
    else if (e.key === "ArrowDown") nextIdx = idx + cols
    else if (e.key === "ArrowUp") nextIdx = idx - cols

    if (nextIdx >= 0 && nextIdx < allLinks.length) {
      e.preventDefault()
      allLinks[nextIdx].focus()
    }
  })
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap)
} else {
  bootstrap()
}
document.addEventListener("nav", bootstrap)
