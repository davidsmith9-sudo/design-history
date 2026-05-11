// @ts-ignore
import script from "./scripts/cursorFollower.inline"
import style from "./styles/cursorFollower.scss"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const CursorFollower: QuartzComponent = () => {
  return (
    <div id="cursor-follower" aria-hidden="true">
      <div id="cursor-dot"></div>
      <div id="cursor-ring"></div>
    </div>
  )
}

CursorFollower.afterDOMLoaded = script
CursorFollower.css = style

export default (() => CursorFollower) satisfies QuartzComponentConstructor
