#!/usr/bin/env node
// 設計史筆記 — 新條目 scaffold
// 用法:npm run new
//      會問 type、title、相關欄位,然後生成 content/<folder>/<title>.md

import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")
const contentRoot = path.join(projectRoot, "content")

const types = {
  流派: {
    folder: "40-流派",
    template: ({ title, fields }) => ({
      frontmatter: {
        title,
        type: "流派",
        era: fields.era ?? "現代主義",
        region: fields.region ?? "",
        field: fields.discipline ? [fields.discipline] : [],
        year_start: fields.year_start ?? "",
        year_end: fields.year_end ?? "",
        founders: [],
        key_figures: [],
        key_works: [],
        related: [],
        tags: ["流派"],
        sources: [],
        status: "draft",
      },
      body: `# ${title}\n\n> 一句話描述\n\n## 概述\n\n\n\n## 起源\n\n\n\n## 代表特徵\n\n\n\n## 代表人物 / 作品\n\n\n\n## 影響\n\n\n\n## 參考\n\n`,
    }),
    prompts: [
      ["era", "時代(古代/工業革命末期/現代主義/後現代/當代)"],
      ["region", "地區(例:德國 / 法國 / 美國)"],
      ["discipline", "主領域(平面/工業/建築/家具/字體/UI UX)"],
      ["year_start", "起始年份"],
      ["year_end", "結束年份"],
    ],
  },
  人物: {
    folder: "50-人物",
    template: ({ title, fields }) => ({
      frontmatter: {
        title,
        type: "人物",
        name_original: fields.name_original ?? "",
        birth: fields.birth ?? "",
        death: fields.death ?? "",
        nationality: fields.nationality ?? "",
        field: fields.discipline ? [fields.discipline] : [],
        movement: [],
        key_works: [],
        mentors: [],
        students: [],
        related: [],
        tags: ["人物"],
        sources: [],
        status: "draft",
      },
      body: `# ${title}\n\n> 一句話描述\n\n## 生平\n\n\n\n## 思想 / 風格\n\n\n\n## 代表作\n\n\n\n## 影響\n\n\n\n## 參考\n\n`,
    }),
    prompts: [
      ["name_original", "原文姓名"],
      ["birth", "出生年"],
      ["death", "逝世年(在世可留空)"],
      ["nationality", "國籍(例:德國 → 美國)"],
      ["discipline", "主領域"],
    ],
  },
  作品: {
    folder: "60-作品",
    template: ({ title, fields }) => ({
      frontmatter: {
        title,
        type: "作品",
        designer: fields.designer ? [fields.designer] : [],
        year: fields.year ? Number(fields.year) : "",
        field: fields.discipline ?? "",
        movement: fields.movement ?? "",
        medium: fields.medium ?? "",
        location: fields.location ?? "",
        related: [],
        images: [],
        tags: ["作品"],
        sources: [],
        status: "draft",
      },
      body: `# ${title}\n\n> 一句話描述\n\n## 主圖\n\n![${title}](/99-素材/images/作品/${title}.jpg)\n*圖說*\n\n## 簡述\n\n\n\n## 設計脈絡\n\n\n\n## 影響\n\n\n\n## 參考\n\n`,
    }),
    prompts: [
      ["designer", "設計師(可用 [[人物名]] 形式)"],
      ["year", "年份(西元)"],
      ["discipline", "領域(平面/工業/建築/家具/字體/科技)"],
      ["movement", "流派(可用 [[流派名]] 形式)"],
      ["medium", "媒材(例:無襯線字體 / 玫瑰木彎曲膠合板)"],
      ["location", "地點"],
    ],
  },
  理論: {
    folder: "70-理論",
    template: ({ title, fields }) => ({
      frontmatter: {
        title,
        type: "理論",
        author: fields.author ? [fields.author] : [],
        year: fields.year ?? "",
        field: fields.discipline ? [fields.discipline] : [],
        related_movements: [],
        tags: ["理論"],
        sources: [],
        status: "draft",
      },
      body: `# ${title}\n\n> 一句話描述\n\n## 提出\n\n\n\n## 內容\n\n\n\n## 影響\n\n\n\n## 參考\n\n`,
    }),
    prompts: [
      ["author", "提出者(可用 [[人物名]] 形式)"],
      ["year", "提出年份"],
      ["discipline", "領域"],
    ],
  },
}

function slugify(name) {
  return name.trim().replace(/\s+/g, " ")
}

function toYaml(obj) {
  const lines = []
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v == null) {
      lines.push(`${k}:`)
    } else if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(`${k}: []`)
      } else {
        lines.push(`${k}:`)
        for (const item of v) {
          const needsQuote = typeof item === "string" && /^\[\[/.test(item)
          lines.push(`  - ${needsQuote ? `"${item}"` : item}`)
        }
      }
    } else if (typeof v === "number") {
      lines.push(`${k}: ${v}`)
    } else {
      const needsQuote = typeof v === "string" && /^\[\[/.test(v)
      lines.push(`${k}: ${needsQuote ? `"${v}"` : v}`)
    }
  }
  return lines.join("\n")
}

async function main() {
  const rl = createInterface({ input, output })
  const ask = (q) => rl.question(q)

  console.log("\n設計史筆記 · 新條目 scaffold\n")

  // 1. type
  const typeNames = Object.keys(types)
  console.log(`類型:${typeNames.map((t, i) => `[${i + 1}] ${t}`).join("  ")}`)
  const typeChoice = (await ask("選擇 [1-4]: ")).trim()
  const typeName = typeNames[parseInt(typeChoice, 10) - 1]
  if (!typeName) {
    console.error("無效選擇")
    rl.close()
    process.exit(1)
  }
  const spec = types[typeName]

  // 2. title
  const title = (await ask("名稱(例:包浩斯 / 葛羅培斯 / 紅屋): ")).trim()
  if (!title) {
    console.error("名稱不能為空")
    rl.close()
    process.exit(1)
  }

  // 3. 各欄位 prompts
  const fields = {}
  for (const [key, label] of spec.prompts) {
    const ans = (await ask(`  ${label}: `)).trim()
    if (ans) fields[key] = ans
  }

  rl.close()

  const { frontmatter, body } = spec.template({ title, fields })
  const filePath = path.join(contentRoot, spec.folder, `${slugify(title)}.md`)

  // 檢查衝突
  try {
    await fs.access(filePath)
    console.error(`\n檔案已存在:${filePath}`)
    process.exit(1)
  } catch {
    // OK
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const content = `---\n${toYaml(frontmatter)}\n---\n\n${body}`
  await fs.writeFile(filePath, content, "utf8")

  console.log(`\n建立完成:${path.relative(projectRoot, filePath)}`)
  console.log(`  type: ${typeName}`)
  console.log(`  title: ${title}`)
  console.log("\n下一步:打開該檔案編輯內容,並把 status 從 draft 改成 stub/full 後 git commit。")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
