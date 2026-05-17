import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import { editorialImage } from "./quartz/util/ogTemplate"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "設計史筆記",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    // Privacy-friendly analytics — Plausible (預設) / Umami(註解開關)
    analytics: {
      provider: "plausible",
      // host: "your-plausible-host.example", // 自架時填,使用官方雲端可留空
    },
    // 若要改用 Umami:
    // analytics: { provider: "umami", websiteId: "<your-umami-website-id>" },
    locale: "zh-TW",
    baseUrl: "design-history.pages.dev",
    ignorePatterns: ["private", "templates", "_templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: { name: "Fraunces", weights: [300, 400, 500, 600, 700] },
        body: { name: "Inter", weights: [400, 500, 600, 700] },
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#FBFAF7",
          lightgray: "#D8D5CC",
          gray: "#8A867F",
          darkgray: "#3A3835",
          dark: "#1A1A1A",
          secondary: "#7A2E2A",
          tertiary: "#6B6963",
          highlight: "rgba(122, 46, 42, 0.06)",
          textHighlight: "rgba(122, 46, 42, 0.14)",
        },
        darkMode: {
          light: "#141413",
          lightgray: "#3A3835",
          gray: "#8A867F",
          darkgray: "#D8D5CC",
          dark: "#FBFAF7",
          secondary: "#C56862",
          tertiary: "#9A968E",
          highlight: "rgba(197, 104, 98, 0.10)",
          textHighlight: "rgba(197, 104, 98, 0.18)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.HeroImage(),
      Plugin.ResponsiveImageRewrite(),
      Plugin.TldrPromote(),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.ResponsiveImages(),
      Plugin.StatusManifest(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      Plugin.CustomOgImages({ imageStructure: editorialImage }),
    ],
  },
}

export default config
