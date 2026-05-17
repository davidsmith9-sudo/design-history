import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// 詳情頁底部評論 — Giscus(GitHub Discussions)
// 啟用前先到 https://giscus.app 取得 repoId / categoryId,填入下方
// 若不想顯示某頁,frontmatter 加 comments: false
const commentsComponent = Component.Comments({
  provider: "giscus",
  options: {
    repo: "davidsmith9-sudo/design-history",
    // TODO: 從 https://giscus.app 取得後填入
    repoId: "REPLACE_WITH_REPO_ID",
    category: "General",
    categoryId: "REPLACE_WITH_CATEGORY_ID",
    mapping: "pathname",
    reactionsEnabled: true,
    inputPosition: "bottom",
    lightTheme: "light",
    darkTheme: "dark",
    lang: "zh-TW",
  },
})

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.TopNav()],
  afterBody: [
    Component.ArticleRelated(),
    Component.ArticleSources(),
    Component.EyeBacklinks(),
    Component.ConditionalRender({
      component: commentsComponent,
      condition: (page) => {
        const fm: any = page.fileData.frontmatter ?? {}
        return ["流派", "人物", "作品", "理論"].includes(fm.type)
      },
    }),
    // CursorFollower 在 100-user test 中得到 3 個負評(P3 阿姨以為中毒, P7 卡 CPU, P11 過時),0 個正評,移除。
    // 檔案保留 quartz/components/CursorFollower.tsx 以便日後復原。
    Component.GridFilter(),
    Component.Timeline(),
    Component.Genealogy(),
    Component.ChapterStrip(),
    Component.HeroIntro(),
    Component.YearRail(),
    Component.ArticleActions(),
    Component.PageTransition(),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/davidsmith9-sudo/design-history",
      RSS: "/index.xml",
      "關於本站": "/00-總覽/關於",
      "授權 · License": "/00-總覽/授權",
      "重設偏好": "/00-總覽/關於#reset",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleHero(),
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: (page) => {
        const fm: any = page.fileData.frontmatter ?? {}
        const t = fm.type
        const heroTypes = ["流派", "人物", "作品", "理論"]
        return !heroTypes.includes(t)
      },
    }),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [],
}
