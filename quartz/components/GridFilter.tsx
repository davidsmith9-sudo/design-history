// @ts-ignore
import script from "./scripts/gridFilter.inline"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const GridFilter: QuartzComponent = () => null

GridFilter.afterDOMLoaded = script

export default (() => GridFilter) satisfies QuartzComponentConstructor
