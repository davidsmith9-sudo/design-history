// @ts-ignore
import script from "./scripts/genealogy.inline"
import style from "./styles/genealogy.scss"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const Genealogy: QuartzComponent = () => null

Genealogy.afterDOMLoaded = script
Genealogy.css = style

export default (() => Genealogy) satisfies QuartzComponentConstructor
