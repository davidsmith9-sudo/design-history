import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"
export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // Url of current page
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug!)

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    // ── Schema.org JSON-LD 結構化資料 ─────────────────
    const fm: any = fileData.frontmatter ?? {}
    const type = fm.type as string | undefined
    const cleanWiki = (s: any): string =>
      typeof s === "string" ? s.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0] : ""
    const firstStr = (v: any): string => {
      if (typeof v === "string") return cleanWiki(v)
      if (Array.isArray(v) && v.length > 0) return cleanWiki(v[0])
      return ""
    }
    const baseSite = cfg.baseUrl ? `https://${cfg.baseUrl}` : ""
    const pageUrl = baseSite ? `${baseSite}/${fileData.slug ?? ""}` : ""
    const siteName = "設計史筆記 Design History Notes"

    let schema: any = null
    if (type === "作品") {
      schema = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: title,
        description,
        url: pageUrl,
        inLanguage: "zh-Hant",
        dateCreated: fm.year != null ? String(fm.year) : undefined,
        creator: firstStr(fm.designer) || undefined,
        material: typeof fm.medium === "string" ? fm.medium : undefined,
        locationCreated: typeof fm.location === "string" ? fm.location : undefined,
        isPartOf: { "@type": "WebSite", name: siteName, url: baseSite },
      }
    } else if (type === "人物") {
      schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: title,
        alternateName: typeof fm.name_original === "string" ? fm.name_original : undefined,
        birthDate: fm.birth != null ? String(fm.birth) : undefined,
        deathDate: fm.death != null ? String(fm.death) : undefined,
        nationality: typeof fm.nationality === "string" ? fm.nationality : undefined,
        description,
        url: pageUrl,
        sameAs: Array.isArray(fm.sources)
          ? fm.sources.filter((s: any) => typeof s === "string")
          : undefined,
      }
    } else if (type === "流派" || type === "理論") {
      schema = {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        name: title,
        description,
        url: pageUrl,
        inDefinedTermSet: { "@type": "DefinedTermSet", name: siteName, url: baseSite },
        ...(fm.year_start != null || fm.year != null
          ? { dateCreated: String(fm.year_start ?? fm.year) }
          : {}),
      }
    } else if (fileData.slug === "index" || fileData.slug === "/") {
      schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: baseSite,
        description,
        inLanguage: "zh-Hant",
      }
    }
    if (schema) {
      // 移除 undefined 值
      schema = Object.fromEntries(Object.entries(schema).filter(([, v]) => v !== undefined))
    }

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            <link
              rel="stylesheet"
              href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap"
            />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {schema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        )}

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
