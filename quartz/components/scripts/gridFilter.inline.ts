// Grid 篩選器:按下 .eye-filter-btn 後依 data-filter / data-key 篩選
// .eye-works-grid > li 元素的 display
// 同一 group 內單選,跨 group 為 AND

function init() {
  const groups = document.querySelectorAll<HTMLElement>(".eye-filter-group")
  if (groups.length === 0) return

  const grid = document.querySelector<HTMLElement>(".eye-works-grid")
  if (!grid) return

  // 每個 group 的當前選擇 (data-key -> data-filter value)
  const state: Record<string, string> = {}

  groups.forEach((group) => {
    const key = group.dataset.key
    if (!key) return
    state[key] = "all"
    group.querySelectorAll<HTMLButtonElement>(".eye-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter ?? "all"
        state[key] = filter
        // toggle active state within group
        group.querySelectorAll(".eye-filter-btn").forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")
        applyFilter()
      })
    })
  })

  const empty = document.querySelector<HTMLElement>(".eye-filter-empty")

  function applyFilter() {
    let visible = 0
    grid!.querySelectorAll<HTMLElement>("li").forEach((li) => {
      let show = true
      for (const [key, filter] of Object.entries(state)) {
        if (filter === "all") continue
        const val = li.dataset[key] ?? ""
        // 支援多值(逗號分隔)
        const vals = val.split(",").map((s) => s.trim())
        if (!vals.includes(filter)) {
          show = false
          break
        }
      }
      li.classList.toggle("eye-filter-hidden", !show)
      if (show) visible++
    })
    if (empty) empty.classList.toggle("show", visible === 0)
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
// SPA 導航時重新 init
document.addEventListener("nav", () => init())
