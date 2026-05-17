import path from "path"
import fs from "fs"
import { QuartzEmitterPlugin } from "../types"

// 輸出 public/static/status-manifest.json:slug → status 映射
// 給 client side gridFilter / search 用,讓卡片 / 搜尋結果顯示 status badge

type Status = "draft" | "stub" | "full"

export const StatusManifest: QuartzEmitterPlugin = () => {
  return {
    name: "StatusManifest",
    async *emit(ctx, content) {
      const map: Record<string, Status> = {}
      for (const [, vfile] of content) {
        const slug = vfile.data.slug
        const fm: any = vfile.data.frontmatter ?? {}
        const raw = fm.status
        if (typeof raw === "string" && slug) {
          const s = raw.toLowerCase().trim()
          if (s === "draft" || s === "stub" || s === "full") {
            map[`/${slug}`] = s
          }
        }
      }
      const outDir = path.join(ctx.argv.output, "static")
      await fs.promises.mkdir(outDir, { recursive: true })
      const outPath = path.join(outDir, "status-manifest.json")
      await fs.promises.writeFile(outPath, JSON.stringify(map), "utf8")
    },
    async *partialEmit() {},
  }
}
