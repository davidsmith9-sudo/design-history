// 文章右下浮動三鍵的行為:Share / Save / Cite

function showToast(host: HTMLElement, msg: string) {
  const toast = host.querySelector<HTMLElement>(".article-action-toast")
  if (!toast) return
  toast.textContent = msg
  toast.classList.add("is-visible")
  setTimeout(() => toast.classList.remove("is-visible"), 1800)
}

// 富資訊收藏:存 {slug, title, type, thumb}。向後相容舊 string 格式
type SavedEntry = { slug: string; title: string; type?: string; thumb?: string }

function readSaved(): SavedEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem("dh-saved") ?? "[]")
    if (!Array.isArray(raw)) return []
    // 舊格式(string[])轉成 SavedEntry
    return raw.map((item: any) => {
      if (typeof item === "string") {
        return { slug: item, title: item.split("/").pop() ?? item }
      }
      return item as SavedEntry
    })
  } catch {
    return []
  }
}

function writeSaved(list: SavedEntry[]): void {
  localStorage.setItem("dh-saved", JSON.stringify(list))
  // 通知 topnav / 其他元件即時更新計數
  document.dispatchEvent(new CustomEvent("dh-saved-changed", { detail: { count: list.length } }))
}

function isSaved(slug: string): boolean {
  return readSaved().some((e) => e.slug === slug)
}

function toggleSaved(entry: SavedEntry): boolean {
  const list = readSaved()
  const idx = list.findIndex((e) => e.slug === entry.slug)
  if (idx >= 0) {
    list.splice(idx, 1)
    writeSaved(list)
    return false
  } else {
    list.push(entry)
    writeSaved(list)
    return true
  }
}

function pickThumbFromPage(): string | undefined {
  // 優先順序:eye-hero-image 內的 picture/img → 第一張 article picture → 第一張 article img
  const heroImg = document.querySelector<HTMLImageElement>(
    ".eye-hero-image picture img, .eye-hero-image img",
  )
  if (heroImg?.src) return heroImg.src
  const firstPic = document.querySelector<HTMLImageElement>("article picture img")
  if (firstPic?.src) return firstPic.src
  const firstImg = document.querySelector<HTMLImageElement>("article img")
  if (firstImg?.src) return firstImg.src
  return undefined
}

function buildCitation(format: string, meta: { title: string; type: string; year: string; author: string; url: string }) {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, "0")
  const dd = String(today.getDate()).padStart(2, "0")
  const accessed = `${yyyy}-${mm}-${dd}`

  // 偵測語系:html data-lang=en 時用 EN site name
  const isEn = document.documentElement.getAttribute("data-lang") === "en"
  const site = isEn ? "Design History Notes" : "設計史筆記 Design History Notes"

  const safeAuthor = meta.author || site
  const year = meta.year ? meta.year.split("–")[0] : "n.d."
  const lastMod = isEn ? "Last modified" : "Last modified · 最後更新"
  const accessedLabel = isEn ? "accessed" : "accessed · 取得日"

  switch (format) {
    case "apa":
      return `${safeAuthor}. (${year}). ${meta.title}. ${site}. ${meta.url}`
    case "mla":
      return `"${meta.title}." ${site}, ${year}, ${meta.url}. Accessed ${accessed}.`
    case "bibtex":
      const key = (meta.title.replace(/[^A-Za-z0-9]/g, "") + year).slice(0, 30) || "entry" + year
      return `@misc{${key},\n  title  = {${meta.title}},\n  author = {${safeAuthor}},\n  year   = {${year}},\n  url    = {${meta.url}},\n  note   = {${site}, ${accessedLabel} ${accessed}}\n}`
    case "chicago":
    default:
      return `"${meta.title}." ${site}. ${lastMod} ${year}. ${meta.url}.`
  }
}

function setupActions(host: HTMLElement) {
  const title = host.dataset.title ?? document.title
  const type = host.dataset.type ?? ""
  const year = host.dataset.year ?? ""
  const author = host.dataset.author ?? ""
  const url = window.location.href
  const slug = window.location.pathname

  const meta = { title, type, year, author, url }

  // ── Save 初始狀態 ──
  const saveBtn = host.querySelector<HTMLButtonElement>('[data-action="save"]')
  if (saveBtn && isSaved(slug)) {
    saveBtn.classList.add("is-active")
    saveBtn.setAttribute("aria-pressed", "true")
  }
  const entry: SavedEntry = {
    slug,
    title,
    type,
    thumb: pickThumbFromPage(),
  }

  // ── Share ──
  host.querySelector<HTMLButtonElement>('[data-action="share"]')?.addEventListener("click", async () => {
    const shareData = { title, text: `${title} — ${meta.type}`, url }
    if ((navigator as any).share && navigator.canShare?.(shareData)) {
      try {
        await (navigator as any).share(shareData)
      } catch {
        // user cancelled, no toast
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        showToast(host, "已複製連結 · Link copied")
      } catch {
        showToast(host, "無法複製,請手動複製網址")
      }
    }
  })

  // ── Save ──
  saveBtn?.addEventListener("click", () => {
    const nowSaved = toggleSaved(entry)
    saveBtn.classList.toggle("is-active", nowSaved)
    saveBtn.setAttribute("aria-pressed", String(nowSaved))
    showToast(host, nowSaved ? "已加入收藏 · Saved" : "已移除收藏 · Removed")
  })

  // ── Cite ──
  const modal = host.querySelector<HTMLElement>(".cite-modal")
  const output = host.querySelector<HTMLElement>(".cite-output")
  const updateOutput = (fmt: string) => {
    if (output) output.textContent = buildCitation(fmt, meta)
  }
  host.querySelector<HTMLButtonElement>('[data-action="cite"]')?.addEventListener("click", () => {
    modal?.removeAttribute("hidden")
    modal?.classList.add("is-open")
    updateOutput("chicago")
    setTimeout(() => host.querySelector<HTMLButtonElement>(".cite-tab")?.focus(), 50)
  })
  host.querySelector<HTMLButtonElement>(".cite-modal-close")?.addEventListener("click", () => {
    modal?.setAttribute("hidden", "")
    modal?.classList.remove("is-open")
  })
  // Tab 切換格式
  host.querySelectorAll<HTMLButtonElement>(".cite-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      host.querySelectorAll(".cite-tab").forEach((t) => t.classList.remove("is-active"))
      tab.classList.add("is-active")
      updateOutput(tab.dataset.citeFormat ?? "chicago")
    })
  })
  // Copy
  host.querySelector<HTMLButtonElement>("[data-copy-cite]")?.addEventListener("click", async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output.textContent ?? "")
      showToast(host, "已複製引用 · Citation copied")
    } catch {
      // fall through
    }
  })
  // Esc 關 modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) {
      modal.setAttribute("hidden", "")
      modal.classList.remove("is-open")
    }
  })
}

function init() {
  document.querySelectorAll<HTMLElement>(".article-actions").forEach(setupActions)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
document.addEventListener("nav", () => init())
