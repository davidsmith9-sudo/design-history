// Custom cursor indicator:雙層(dot + ring),兩者同步即時跟隨(無 lerp 延遲)
// hover 在連結/卡片/Mermaid 節點上時 ring 放大 + 變藍色提示

const HOVER_SELECTOR = "a, button, [role=button], .eye-grid li, .eye-works-grid li, .mermaid g.node"

function init() {
  const wrapper = document.getElementById("cursor-follower")
  const dot = document.getElementById("cursor-dot")
  const ring = document.getElementById("cursor-ring")
  if (!wrapper || !dot || !ring) return

  // touch / no-hover 裝置直接隱藏
  if (window.matchMedia("(hover: none)").matches) {
    wrapper.style.display = "none"
    return
  }

  let hovering = false

  const onMove = (e: MouseEvent) => {
    const x = e.clientX
    const y = e.clientY
    const ringTransform = hovering
      ? `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(1.8)`
      : `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    ring.style.transform = ringTransform
  }

  const onOver = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null
    if (!t) return
    const next = !!t.closest(HOVER_SELECTOR)
    if (next !== hovering) {
      hovering = next
      ring.classList.toggle("hover", hovering)
    }
  }

  const onLeave = () => wrapper.classList.add("hidden")
  const onEnter = () => wrapper.classList.remove("hidden")

  document.addEventListener("mousemove", onMove, { passive: true })
  document.addEventListener("mouseover", onOver, { passive: true })
  document.addEventListener("mouseleave", onLeave)
  document.addEventListener("mouseenter", onEnter)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
