// @ts-ignore
import script from "./scripts/chapterStrip.inline"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const ChapterStrip: QuartzComponent = () => null

ChapterStrip.afterDOMLoaded = script
ChapterStrip.css = `
.chapter-strip {
  position: fixed;
  top: 72px;
  left: 0;
  right: 0;
  z-index: 90;
  background: rgba(251, 250, 247, 0.86);
  backdrop-filter: blur(14px) saturate(1.2);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  border-bottom: 1px solid var(--lightgray);
  opacity: 0;
  transform: translateY(-100%);
  transition: opacity 220ms ease, transform 220ms ease;
  pointer-events: none;
}

.chapter-strip.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.chapter-strip-inner {
  max-width: calc(1200px + 300px);
  margin: 0 auto;
  padding: 0.7rem 2rem;
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  font-family: var(--bodyFont);
  font-size: 0.78rem;
  color: var(--darkgray);
  white-space: nowrap;
  overflow: hidden;
}

.chapter-strip-title {
  font-family: var(--headerFont);
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--dark);
  letter-spacing: -0.005em;
  text-overflow: ellipsis;
  overflow: hidden;
  flex-shrink: 1;
  min-width: 0;
}

.chapter-strip-type {
  font-family: var(--bodyFont);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  color: var(--gray);
  font-weight: 500;
}

.chapter-strip-num {
  font-family: var(--bodyFont);
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  color: var(--secondary);
  font-weight: 600;
  font-feature-settings: "tnum";
}

.chapter-strip-chapter {
  font-family: var(--headerFont);
  font-size: 0.92rem;
  font-weight: 400;
  color: var(--dark);
  flex: 1;
  min-width: 0;
  letter-spacing: -0.005em;
  text-overflow: ellipsis;
  overflow: hidden;
}

.chapter-strip-sep {
  color: var(--lightgray);
}

:root[saved-theme="dark"] .chapter-strip {
  background: rgba(20, 20, 19, 0.86);
}

.chapter-strip.is-hidden-on-scroll {
  transform: translateY(-100%);
  opacity: 0;
}

@media (max-width: 800px) {
  .chapter-strip {
    top: 60px;
  }
  .chapter-strip-inner {
    padding: 0.55rem 1rem;
    font-size: 0.74rem;
    gap: 0.4rem;
  }
  .chapter-strip-title,
  .chapter-strip-type,
  .chapter-strip-sep:first-of-type,
  .chapter-strip-sep:nth-of-type(2) {
    display: none;
  }
  /* 手機只留 §02 + 章節名 */
}

@media (prefers-reduced-motion: reduce) {
  .chapter-strip {
    transition: opacity 100ms ease;
    transform: none !important;
  }
}
`

export default (() => ChapterStrip) satisfies QuartzComponentConstructor
