// @ts-ignore
import script from "./scripts/timeline.inline"
import style from "./styles/timeline.scss"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const Timeline: QuartzComponent = () => null

Timeline.afterDOMLoaded = script
Timeline.css = style

export default (() => Timeline) satisfies QuartzComponentConstructor
