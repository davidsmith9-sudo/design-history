import fs from "fs"
import path from "path"
import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"

const TARGET_WIDTHS = [480, 800, 1200, 1600] as const
const RASTER_RE = /\.(jpe?g|png|webp)$/i
const SUFFIX_RE = /-(?:480|800|1200|1600)w(?=\.[^.]+$)/

function buildSrcset(src: string, ext?: string): string {
  const m = src.match(/^(.+?)(\.[^.]+)$/)
  if (!m) return ""
  const [, base, origExt] = m
  const useExt = ext ?? origExt
  return TARGET_WIDTHS.map((w) => `${base}-${w}w${useExt} ${w}w`).join(", ")
}

const DEFAULT_SIZES = "(max-width: 800px) 100vw, (max-width: 1200px) 800px, 1200px"

// 從 .quartz-cache 讀上一次 build 的圖片 manifest(含 LQIP)
// 第一次 cold build 沒有,LQIP 缺失,沒關係
type ManifestEntry = { w: number; h: number; lqip?: string }
let manifestCache: Record<string, ManifestEntry> | null = null
function loadManifest(): Record<string, ManifestEntry> {
  if (manifestCache) return manifestCache
  try {
    const p = path.join(process.cwd(), ".quartz-cache", "image-manifest.json")
    if (fs.existsSync(p)) {
      manifestCache = JSON.parse(fs.readFileSync(p, "utf8"))
    } else {
      manifestCache = {}
    }
  } catch {
    manifestCache = {}
  }
  return manifestCache!
}

function normalizeKey(src: string): string {
  // /99-素材/.../紅屋.jpg 直接用
  // ../99-素材/.../紅屋.jpg → /99-素材/.../紅屋.jpg
  if (src.startsWith("/")) return src
  return `/${src.replace(/^(?:\.\.?\/)+/, "")}`
}

export const ResponsiveImageRewrite: QuartzTransformerPlugin = () => {
  return {
    name: "ResponsiveImageRewrite",
    htmlPlugins() {
      return [
        () => (tree: any) => {
          const manifest = loadManifest()
          const manifestEmpty = Object.keys(manifest).length === 0

          visit(tree, "element", (node: any, index: number | null, parent: any) => {
            if (node.tagName !== "img") return
            if (!parent || index == null) return
            if (parent.tagName === "picture") return

            const props = node.properties ?? (node.properties = {})
            const src = props.src
            if (typeof src !== "string") return
            if (src.startsWith("data:")) return
            if (/^https?:\/\//i.test(src)) return
            if (!RASTER_RE.test(src)) return
            if (SUFFIX_RE.test(src)) return

            // 始終補 loading / decoding(這兩個不依賴衍生圖)
            if (!props.loading) props.loading = "lazy"
            if (!props.decoding) props.decoding = "async"

            const key = normalizeKey(src)
            const meta = manifest[key]

            // 從 manifest 補 width / height / LQIP(若有)
            if (meta) {
              if (meta.w && !props.width) props.width = meta.w
              if (meta.h && !props.height) props.height = meta.h
              if (meta.lqip) {
                const existingStyle = typeof props.style === "string" ? props.style : ""
                const lqipStyle = `background-image:url('${meta.lqip}');background-size:cover;background-position:center`
                props.style = existingStyle ? `${existingStyle};${lqipStyle}` : lqipStyle
                props["data-lqip"] = "true"
              }
            }

            // ── 關鍵防禦:沒 manifest 條目 → 不包 picture,不加 srcset
            // 這樣即使 Cloudflare emitter 沒生衍生圖,img 用原圖能正常顯示
            if (!meta || manifestEmpty) return

            // 從這裡開始才包 srcset + picture(衍生圖確認在 manifest 中)
            if (!props.srcset) props.srcset = buildSrcset(src)
            if (!props.sizes) props.sizes = DEFAULT_SIZES

            const isWebpAlready = /\.webp$/i.test(src)
            if (isWebpAlready) return

            const webpSource = {
              type: "element",
              tagName: "source",
              properties: {
                type: "image/webp",
                srcset: buildSrcset(src, ".webp"),
                sizes: DEFAULT_SIZES,
              },
              children: [],
            }
            const picture = {
              type: "element",
              tagName: "picture",
              properties: {},
              children: [webpSource, node],
            }
            parent.children[index] = picture
          })
        },
      ]
    },
  }
}
