import path from "path"
import fs from "fs"
import sharp from "sharp"
import { globby } from "globby"
import { FilePath, joinSegments, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"

export const RESPONSIVE_WIDTHS = [480, 800, 1200, 1600] as const
const RASTER_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"])
const SUFFIX_RE = /-(?:480|800|1200|1600)w(?=\.[^.]+$)/

async function ensureSize(
  srcPath: string,
  outPath: string,
  targetWidth: number,
  format: "same" | "webp",
): Promise<boolean> {
  if (fs.existsSync(outPath)) return false
  const dir = path.dirname(outPath)
  await fs.promises.mkdir(dir, { recursive: true })
  const pipeline = sharp(srcPath).resize(targetWidth, null, { withoutEnlargement: true })
  if (format === "webp") {
    await pipeline.webp({ quality: 82 }).toFile(outPath)
  } else {
    await pipeline.toFile(outPath)
  }
  return true
}

async function generateLQIP(srcPath: string): Promise<string | null> {
  try {
    const buf = await sharp(srcPath)
      .resize(16, null, { withoutEnlargement: true })
      .blur(1.2)
      .jpeg({ quality: 35 })
      .toBuffer()
    return `data:image/jpeg;base64,${buf.toString("base64")}`
  } catch {
    return null
  }
}

type ManifestEntry = { w: number; h: number; lqip?: string }

async function processImage(
  srcPath: string,
  outBasePath: string,
  manifest: Record<string, ManifestEntry>,
  srcRel: string,
): Promise<number> {
  const ext = path.extname(srcPath).toLowerCase()
  if (!RASTER_EXTS.has(ext)) return 0
  if (SUFFIX_RE.test(srcPath)) return 0 // 已經是 derived 尺寸

  let created = 0
  try {
    const meta = await sharp(srcPath).metadata()
    const origW = meta.width ?? 0
    const origH = meta.height ?? 0
    if (origW > 0 && origH > 0) {
      const lqip = await generateLQIP(srcPath)
      manifest[srcRel] = lqip ? { w: origW, h: origH, lqip } : { w: origW, h: origH }
    }
    if (origW < 480) return 0 // 太小不分尺寸

    const outDir = path.dirname(outBasePath)
    const outBaseFull = path.basename(outBasePath)
    const outExt = path.extname(outBaseFull)
    const outBase = outBaseFull.slice(0, outBaseFull.length - outExt.length)

    const wantWebp = ext !== ".webp"

    for (const tw of RESPONSIVE_WIDTHS) {
      if (tw >= origW) continue
      const samePath = path.join(outDir, `${outBase}-${tw}w${outExt}`)
      if (await ensureSize(srcPath, samePath, tw, "same")) created++
      if (wantWebp) {
        const webpPath = path.join(outDir, `${outBase}-${tw}w.webp`)
        if (await ensureSize(srcPath, webpPath, tw, "webp")) created++
      }
    }
  } catch (e) {
    console.warn(`[ResponsiveImages] skipped ${srcPath}: ${(e as Error).message}`)
  }
  return created
}

export const ResponsiveImages: QuartzEmitterPlugin = () => {
  return {
    name: "ResponsiveImages",
    async *emit({ argv }) {
      const fps = await globby("**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
        cwd: argv.directory,
        gitignore: false,
      })
      const manifest: Record<string, ManifestEntry> = {}
      let count = 0
      for (const fp of fps) {
        const src = path.join(argv.directory, fp)
        const outRel = slugifyFilePath(fp as FilePath)
        const out = joinSegments(argv.output, outRel) as string
        const made = await processImage(src, out, manifest, `/${outRel}`)
        count += made
      }
      // 寫 manifest(尺寸 + LQIP)— 同時供 transformer 與 runtime 使用
      // 主 manifest 寫進專案根的 .quartz-cache(供 transformer 在 build time 讀)
      const cachePath = path.join(argv.directory, "..", ".quartz-cache", "image-manifest.json")
      await fs.promises.mkdir(path.dirname(cachePath), { recursive: true })
      await fs.promises.writeFile(cachePath, JSON.stringify(manifest), "utf8")
      if (count > 0) {
        console.log(
          `[ResponsiveImages] generated ${count} derived files from ${fps.length} sources`,
        )
      }
    },
    async *partialEmit() {},
  }
}
