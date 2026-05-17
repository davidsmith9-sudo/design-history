// @ts-ignore
import script from "./scripts/heroIntro.inline"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const HeroIntro: QuartzComponent = () => null

HeroIntro.afterDOMLoaded = script
HeroIntro.css = `
.intro-step,
.intro-step-section {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 600ms cubic-bezier(0.2, 0.7, 0.2, 1),
              transform 600ms cubic-bezier(0.2, 0.7, 0.2, 1);
  will-change: opacity, transform;
}

.intro-step.is-revealed,
.intro-step-section.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .intro-step,
  .intro-step-section {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
`

export default (() => HeroIntro) satisfies QuartzComponentConstructor
