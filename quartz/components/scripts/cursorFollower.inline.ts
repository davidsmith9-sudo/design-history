// Custom cursor indicator:雙層(dot + ring),ring 用 lerp 跟隨產生延遲拖曳感
// hover 在連結/卡片/Mermaid 節點上時 ring 放大、變成 hollow

const HOVER_SELECTOR = "a, button, [role=button], .eye-grid li, .eye-works-grid li, .mermaid g.node"
const LERP = 0.18

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

  let mouseX = window.innerWidth / 2
  let mouseY = window.innerHeight / 2
  let ringX = mouseX
  let ringY = mouseY
  let raf: number | null = null
  let hovering = false

  const animate = () => {
    ringX += (mouseX - ringX) * LERP
    ringY += (mouseY - ringY) * LERP
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)${hovering ? " scale(1.8)" : ""}`
    const dx = Math.abs(mouseX - ringX)
    const dy = Math.abs(mouseY - ringY)
    if (dx > 0.1 || dy > 0.1) {
      raf = requestAnimationFrame(animate)
    } else {
      raf = null
    }
  }

  const onMove = (e: MouseEvent) => {
    mouseX = e.clientX
    mouseY = e.clientY
    if (!raf) raf = requestAnimationFrame(animate)
  }

  const onOver = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null
    if (!t) return
    const next = !!t.closest(HOVER_SELECTOR)
    if (next !== hovering) {
      hovering = next
      ring.classList.toggle("hover", hovering)
      if (!raf) raf = requestAnimationFrame(animate)
    }
  }

  const onLeave = () => {
    wrapper.classList.add("hidden")
  }
  const onEnter = () => {
    wrapper.classList.remove("hidden")
  }

  document.addEventListener("mousemove", onMove, { passive: true })
  document.addEventListener("mouseover", onOver, { passive: true })
  document.addEventListener("mouseleave", onLeave)
  document.addEventListener("mouseenter", onEnter)

  // SPA navigation:Quartz uses micromorph,重新觸發 mouse listener 不必,但
  // 元件 DOM 仍在,initial position 預設 center 即可
  animate()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
