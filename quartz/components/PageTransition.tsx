// @ts-ignore
import script from "./scripts/pageTransition.inline"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const PageTransition: QuartzComponent = () => null

PageTransition.afterDOMLoaded = script
PageTransition.css = `
.center > article {
  animation: pageFadeIn 240ms cubic-bezier(0.2, 0.65, 0.25, 1) both;
}

.center > article.page-fade-in {
  animation: pageFadeIn 240ms cubic-bezier(0.2, 0.65, 0.25, 1) both;
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .center > article,
  .center > article.page-fade-in {
    animation: none !important;
  }
}
`

export default (() => PageTransition) satisfies QuartzComponentConstructor
