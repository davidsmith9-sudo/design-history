// SPA 切頁 fade-in:每次 nav 事件後,把 .center > article 重新觸發進場動畫
// 用 CSS animation re-trigger 技巧:remove class → reflow → add class

const reduced =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

function triggerFade() {
  if (reduced) return
  const article = document.querySelector<HTMLElement>(".center > article")
  if (!article) return
  article.classList.remove("page-fade-in")
  // force reflow
  void article.offsetWidth
  article.classList.add("page-fade-in")
}

document.addEventListener("nav", () => triggerFade())
