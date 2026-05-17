import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"

// 詳情頁的第一個 blockquote 自動 promotion 為 .article-tldr
// 條件:該頁有 frontmatter.type ∈ {流派, 人物, 作品, 理論}(在 transformer 階段我們透過 file.data.frontmatter 拿到)
// 動作:把第一個 <blockquote> 元素加上 class="article-tldr",CSS 把它做成編輯型 pull-quote

const TARGET_TYPES = new Set(["流派", "人物", "作品", "理論"])
// 起始是引號類字符 = 顯然是名言引用,不是 TL;DR
const QUOTE_OPENERS = /^["'「『"`'《〈]/

function getInnerText(node: any): string {
  if (!node) return ""
  if (node.type === "text") return node.value ?? ""
  if (Array.isArray(node.children)) {
    return node.children.map(getInnerText).join("")
  }
  return ""
}

export const TldrPromote: QuartzTransformerPlugin = () => {
  return {
    name: "TldrPromote",
    htmlPlugins() {
      return [
        () =>
          (tree: any, file: any) => {
            const fm = file?.data?.frontmatter ?? {}
            const type = fm.type
            if (!type || !TARGET_TYPES.has(type)) return
            // 顯式 opt-out
            if (fm.tldr === false || fm.tldr === "false") return

            let firstBlockquote: any = null
            visit(tree, "element", (node: any) => {
              if (node.tagName === "blockquote" && !firstBlockquote) {
                firstBlockquote = node
                return false // stop visiting
              }
            })

            if (!firstBlockquote) return

            // 判斷是否是名言引用而非 TL;DR
            const innerText = getInnerText(firstBlockquote).trim()
            if (QUOTE_OPENERS.test(innerText)) return // skip,看起來是名言
            // 含「—」「——」+ 人名歸屬 = 名言引用模式
            if (/[—–]\s*\S+$/.test(innerText) && innerText.length < 120) return

            const props = firstBlockquote.properties ?? (firstBlockquote.properties = {})
            const existing =
              typeof props.className === "string"
                ? [props.className]
                : Array.isArray(props.className)
                  ? props.className
                  : []
            props.className = [...existing, "article-tldr"]
            props["data-tldr-label"] = "一句話讀懂"
          },
      ]
    },
  }
}
