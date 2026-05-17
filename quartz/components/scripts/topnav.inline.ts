// ── 語系切換(EN / TW)─────────────────────────────────
// 套用到 <html data-lang="tc|en">,localStorage 持久化

function applyLang(lang: "tc" | "en") {
  document.documentElement.setAttribute("data-lang", lang)
  document.querySelectorAll<HTMLElement>(".topnav-lang-opt").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.langValue === lang)
  })
  // 切到 EN 時若使用者沒主動關過 banner,顯示之
  const banner = document.querySelector<HTMLElement>(".lang-en-banner")
  if (!banner) return
  if (lang === "en") {
    const dismissed = localStorage.getItem("dh-en-banner-dismissed") === "1"
    if (!dismissed) {
      banner.removeAttribute("hidden")
      banner.classList.add("is-visible")
    }
  } else {
    banner.setAttribute("hidden", "")
    banner.classList.remove("is-visible")
  }
}

function initEnBanner() {
  document.querySelectorAll<HTMLButtonElement>(".lang-en-banner-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      const banner = btn.closest<HTMLElement>(".lang-en-banner")
      if (banner) {
        banner.setAttribute("hidden", "")
        banner.classList.remove("is-visible")
      }
      localStorage.setItem("dh-en-banner-dismissed", "1")
    })
  })
}

function initLang() {
  const saved = (localStorage.getItem("dh-lang") as "tc" | "en" | null) ?? "tc"
  applyLang(saved)
  document.querySelectorAll<HTMLButtonElement>("[data-lang-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-lang") === "en" ? "tc" : "en"
      localStorage.setItem("dh-lang", next)
      applyLang(next)
    })
    // 雙擊強制顯示 EN banner(無論當前語系或之前是否 dismiss)
    btn.addEventListener("dblclick", (e) => {
      e.preventDefault()
      localStorage.removeItem("dh-en-banner-dismissed")
      localStorage.setItem("dh-lang", "en")
      applyLang("en")
    })
  })
}

// 第一次 paint 就套(避免閃爍)
;(function () {
  try {
    const saved = localStorage.getItem("dh-lang")
    if (saved === "en" || saved === "tc") {
      document.documentElement.setAttribute("data-lang", saved)
    } else {
      document.documentElement.setAttribute("data-lang", "tc")
    }
  } catch {}
})()

// ── 隨機跳按鈕 ─────────────────────────────────────────
// 從 status-manifest.json 動態抓 type ∈ {作品/人物/流派/理論} 且 status ∈ {stub/full}
// fallback 用預設清單(若 fetch 失敗或還沒載完)
const fallbackTargets = [
  "/40-流派/包浩斯",
  "/50-人物/華特·葛羅培斯",
  "/60-作品/薩伏伊別墅",
  "/60-作品/Helvetica",
  "/60-作品/雪梨歌劇院",
]

let randomPool: string[] | null = null
async function ensureRandomPool(): Promise<string[]> {
  if (randomPool) return randomPool
  try {
    const r = await fetch("/static/status-manifest.json")
    if (!r.ok) throw new Error("manifest 404")
    const manifest: Record<string, "draft" | "stub" | "full"> = await r.json()
    const eligible = Object.entries(manifest)
      .filter(([slug, s]) => {
        if (s === "draft") return false
        // 只選有意義的 type folder
        return /^\/(40-流派|50-人物|60-作品|70-理論)\//.test(slug)
      })
      .map(([slug]) => slug)
    randomPool = eligible.length > 0 ? eligible : fallbackTargets
  } catch {
    randomPool = fallbackTargets
  }
  return randomPool
}

function initRandom() {
  document.querySelectorAll<HTMLButtonElement>("[data-random-jump]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pool = await ensureRandomPool()
      const current = window.location.pathname
      let target = pool[Math.floor(Math.random() * pool.length)]
      let tries = 0
      while (current.endsWith(target) && tries < 8) {
        target = pool[Math.floor(Math.random() * pool.length)]
        tries++
      }
      window.location.href = target
    })
  })
}

function updateSavedCount() {
  document.querySelectorAll<HTMLElement>("[data-saved-link]").forEach((link) => {
    try {
      const list = JSON.parse(localStorage.getItem("dh-saved") ?? "[]")
      const count = Array.isArray(list) ? list.length : 0
      const countEl = link.querySelector<HTMLElement>("[data-saved-count]")
      if (countEl) countEl.textContent = String(count)
      if (count > 0) {
        link.removeAttribute("hidden")
      } else {
        link.setAttribute("hidden", "")
      }
    } catch {
      link.setAttribute("hidden", "")
    }
  })
}

let savedListenerAttached = false
function initSavedCount() {
  updateSavedCount()
  if (!savedListenerAttached) {
    document.addEventListener("dh-saved-changed", () => updateSavedCount())
    savedListenerAttached = true
  }
}

function initDrawerTools() {
  document.querySelectorAll<HTMLButtonElement>("[data-drawer-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      const action = btn.dataset.drawerAction
      // 關掉 drawer
      const toggle = document.querySelector<HTMLButtonElement>(".topnav-mobile-toggle")
      const drawer = document.querySelector<HTMLElement>(".topnav-drawer")
      if (toggle && drawer) {
        toggle.setAttribute("aria-expanded", "false")
        drawer.setAttribute("aria-hidden", "true")
        document.body.classList.remove("topnav-drawer-open")
      }
      setTimeout(() => {
        if (action === "search") {
          document.querySelector<HTMLButtonElement>(".search-button")?.click()
        } else if (action === "darkmode") {
          document.querySelector<HTMLButtonElement>(".darkmode button")?.click()
        } else if (action === "random") {
          document.querySelector<HTMLButtonElement>("[data-random-jump]")?.click()
        } else if (action === "lang") {
          document.querySelector<HTMLButtonElement>("[data-lang-toggle]")?.click()
        }
      }, 80)
    })
  })

  // 同步 lang label 高亮
  const lang = document.documentElement.getAttribute("data-lang") ?? "tc"
  document.querySelectorAll<HTMLElement>("[data-lang-mobile-tc]").forEach((el) => {
    el.classList.toggle("is-active", lang === "tc")
  })
  document.querySelectorAll<HTMLElement>("[data-lang-mobile-en]").forEach((el) => {
    el.classList.toggle("is-active", lang === "en")
  })
}

document.addEventListener("nav", () => {
  initLang()
  initEnBanner()
  initRandom()
  initSavedCount()
  initDrawerTools()
  const toggles = document.querySelectorAll<HTMLButtonElement>(".topnav-mobile-toggle")
  for (const toggle of toggles) {
    const drawer = toggle.closest(".topnav")?.querySelector<HTMLElement>(".topnav-drawer")
    if (!drawer) continue

    const close = () => {
      toggle.setAttribute("aria-expanded", "false")
      drawer.setAttribute("aria-hidden", "true")
      document.body.classList.remove("topnav-drawer-open")
    }
    const open = () => {
      toggle.setAttribute("aria-expanded", "true")
      drawer.setAttribute("aria-hidden", "false")
      document.body.classList.add("topnav-drawer-open")
    }

    const handler = (e: Event) => {
      e.preventDefault()
      const expanded = toggle.getAttribute("aria-expanded") === "true"
      expanded ? close() : open()
    }
    toggle.addEventListener("click", handler)
    window.addCleanup(() => toggle.removeEventListener("click", handler))

    // close on drawer link click
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", close)
      window.addCleanup(() => a.removeEventListener("click", close))
    })

    // close on outside click
    const outside = (e: MouseEvent) => {
      if (!toggle.closest(".topnav")?.contains(e.target as Node)) close()
    }
    document.addEventListener("click", outside)
    window.addCleanup(() => document.removeEventListener("click", outside))

    // close on Esc
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", esc)
    window.addCleanup(() => document.removeEventListener("keydown", esc))
  }
})
