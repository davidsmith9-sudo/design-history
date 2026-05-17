// Custom OG image template — Norm / Frama editorial style
// 套用站內 typography(Fraunces serif + Inter)、紙白底 + 石墨字 + oxblood accent

import { SocialImageOptions } from "./og"
import { getFontSpecificationName } from "./theme"

const typeLabels: Record<string, { tc: string; en: string }> = {
  流派: { tc: "流派", en: "Movement" },
  人物: { tc: "人物", en: "Figure" },
  作品: { tc: "作品", en: "Work" },
  理論: { tc: "理論", en: "Theory" },
  時代: { tc: "時代", en: "Era" },
  地區: { tc: "地區", en: "Region" },
  領域: { tc: "領域", en: "Discipline" },
  總覽: { tc: "總覽", en: "Overview" },
}

function cleanWikilink(s: any): string {
  if (typeof s !== "string") return String(s ?? "")
  const m = s.match(/^\[\[(.+?)(?:\|(.+?))?\]\]$/)
  return m ? (m[2] ?? m[1]) : s
}

function firstArr(v: any): string {
  if (v == null) return ""
  if (Array.isArray(v)) return v.length > 0 ? cleanWikilink(v[0]) : ""
  return cleanWikilink(v)
}

export const editorialImage: SocialImageOptions["imageStructure"] = ({
  cfg,
  userOpts,
  title,
  description,
  fileData,
}) => {
  const { colorScheme } = userOpts
  const colors = cfg.theme.colors[colorScheme]
  const headerFont = getFontSpecificationName(cfg.theme.typography.header)
  const bodyFont = getFontSpecificationName(cfg.theme.typography.body)

  const fm: any = fileData.frontmatter ?? {}
  const type = fm.type as string | undefined
  const label = type ? typeLabels[type] : null

  // Subtitle:依 type 組合不同 meta(設計師 / 年份 / 國別)
  let subtitle = ""
  if (type === "作品") {
    const designer = firstArr(fm.designer)
    const year = fm.year != null ? String(fm.year) : ""
    subtitle = [designer, year].filter(Boolean).join(" · ")
  } else if (type === "人物") {
    const lifespan = fm.birth != null || fm.death != null ? `${fm.birth ?? "?"}–${fm.death ?? "?"}` : ""
    const nat = typeof fm.nationality === "string" ? fm.nationality : ""
    subtitle = [lifespan, nat].filter(Boolean).join(" · ")
  } else if (type === "流派") {
    const years =
      fm.year_start != null || fm.year_end != null ? `${fm.year_start ?? "?"}–${fm.year_end ?? "?"}` : ""
    const region = typeof fm.region === "string" ? fm.region : ""
    subtitle = [years, region].filter(Boolean).join(" · ")
  } else if (type === "理論") {
    const author = firstArr(fm.author)
    const year = fm.year != null ? String(fm.year) : ""
    subtitle = [author, year].filter(Boolean).join(" · ")
  }

  // 字級隨標題長度自動縮
  const titleLen = title.length
  const titleSize = titleLen > 18 ? 96 : titleLen > 12 ? 116 : 138

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.light,
        padding: "70px 80px",
        fontFamily: bodyFont,
      }}
    >
      {/* ── 頂部 eyebrow ───────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          fontSize: 22,
          color: colors.darkgray,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ display: "flex", color: colors.secondary, fontWeight: 600 }}>
          Design History
        </span>
        <span
          style={{
            display: "flex",
            color: colors.lightgray,
            margin: "0 16px",
          }}
        >
          ·
        </span>
        <span style={{ display: "flex", color: colors.darkgray }}>
          {label ? label.en : "Notes"}
        </span>
        <span
          style={{
            display: "flex",
            fontFamily: headerFont,
            fontSize: 26,
            color: colors.darkgray,
            textTransform: "none",
            letterSpacing: "0.08em",
            marginLeft: 12,
          }}
        >
          {label ? label.tc : "筆記"}
        </span>
      </div>

      {/* ── 主標 ──────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          marginTop: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: headerFont,
            fontSize: titleSize,
            fontWeight: 300,
            color: colors.dark,
            lineHeight: 0.98,
            letterSpacing: "-0.035em",
            marginBottom: 24,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: bodyFont,
            fontSize: subtitle ? 30 : 26,
            color: colors.darkgray,
            lineHeight: 1.5,
            marginTop: 8,
            maxWidth: 980,
            letterSpacing: "0.01em",
          }}
        >
          {subtitle ||
            (description.length > 140 ? description.slice(0, 138) + "…" : description) ||
            ""}
        </div>
      </div>

      {/* ── 底部 hairline + 站名 ───────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 28,
          borderTop: `1px solid ${colors.lightgray}`,
          color: colors.gray,
          fontSize: 22,
          letterSpacing: "0.04em",
        }}
      >
        <span style={{ display: "flex" }}>{cfg.baseUrl}</span>
        <span
          style={{
            display: "flex",
            fontFamily: headerFont,
            color: colors.darkgray,
            fontWeight: 500,
            fontSize: 24,
          }}
        >
          設計史筆記
        </span>
      </div>
    </div>
  )
}
