import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"

// 把 markdown body 中名為「主圖」的 H2 區段(去掉標題本身)搬到文章頂端
// (在第一個 H1 之後;若無 H1 則直接放最前面),並用 div.eye-hero-image 包起來
// 讓詳情頁能在標題下方先看到主圖

export const HeroImage: QuartzTransformerPlugin = () => {
  return {
    name: "HeroImage",
    markdownPlugins() {
      return [
        () => (tree: Root) => {
          const children = tree.children
          let heroIdx = -1

          // 找 ## 主圖 標題
          for (let i = 0; i < children.length; i++) {
            const node = children[i] as any
            if (node.type === "heading" && node.depth === 2) {
              const txt = node.children?.[0]?.value ?? ""
              if (txt === "主圖") {
                heroIdx = i
                break
              }
            }
          }
          if (heroIdx === -1) return

          // 找該節結束處(下一個 H2 或更高層級)
          let endIdx = children.length
          for (let j = heroIdx + 1; j < children.length; j++) {
            const n = children[j] as any
            if (n.type === "heading" && n.depth <= 2) {
              endIdx = j
              break
            }
          }

          // 取出整個 section,但 drop 第一個元素(主圖標題本身)
          const section = children.splice(heroIdx, endIdx - heroIdx)
          const body = section.slice(1)
          if (body.length === 0) return

          // 算插入位置:第一個 H1 之後
          let insertAt = 0
          if (children.length > 0) {
            const first = children[0] as any
            if (first.type === "heading" && first.depth === 1) insertAt = 1
          }

          // 包一層 html,給 CSS 鉤子
          const wrapStart: any = {
            type: "html",
            value: '<div class="eye-hero-image">',
          }
          const wrapEnd: any = { type: "html", value: "</div>" }

          children.splice(insertAt, 0, wrapStart, ...body, wrapEnd)
        },
      ]
    },
  }
}
