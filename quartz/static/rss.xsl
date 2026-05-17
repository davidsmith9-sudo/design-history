<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="zh-TW">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="/rss/channel/title"/> · RSS</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400;500&amp;family=Inter:wght@400;500;600&amp;family=Noto+Serif+TC:wght@400;500;600&amp;family=Noto+Sans+TC:wght@400;500&amp;display=swap"/>
        <style>
          :root {
            --paper: #FBFAF7;
            --graphite: #1A1A1A;
            --darkgray: #3A3835;
            --gray: #8A867F;
            --lightgray: #D8D5CC;
            --accent: #7A2E2A;
          }
          * { box-sizing: border-box; }
          html { background: var(--paper); }
          body {
            margin: 0;
            padding: 4rem 2rem;
            font-family: "Inter", "Noto Sans TC", sans-serif;
            color: var(--darkgray);
            line-height: 1.6;
            max-width: 760px;
            margin: 0 auto;
            font-size: 16px;
          }
          .rss-banner {
            border: 1px solid var(--lightgray);
            padding: 1rem 1.5rem;
            font-family: "Inter", sans-serif;
            font-size: 0.78rem;
            letter-spacing: 0.04em;
            color: var(--gray);
            margin-bottom: 3rem;
            background: rgba(122, 46, 42, 0.04);
          }
          .rss-banner strong {
            color: var(--accent);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.22em;
            font-size: 0.65rem;
            margin-right: 0.6rem;
          }
          .rss-eyebrow {
            display: flex;
            align-items: baseline;
            gap: 0.6rem;
            font-family: "Inter", sans-serif;
            font-size: 0.62rem;
            text-transform: uppercase;
            letter-spacing: 0.28em;
            color: var(--accent);
            font-weight: 500;
            margin-bottom: 1.5rem;
          }
          .rss-eyebrow .sep { color: var(--lightgray); }
          .rss-eyebrow .tc {
            color: var(--darkgray);
            font-family: "Fraunces", "Noto Serif TC", serif;
            text-transform: none;
            letter-spacing: 0.16em;
            font-size: 0.7rem;
          }
          h1 {
            font-family: "Fraunces", "Noto Serif TC", serif;
            font-size: clamp(2.4rem, 5vw, 3.8rem);
            font-weight: 300;
            letter-spacing: -0.035em;
            line-height: 1.02;
            color: var(--graphite);
            margin: 0 0 1rem;
          }
          .rss-desc {
            font-family: "Fraunces", "Noto Serif TC", serif;
            font-size: 1.15rem;
            color: var(--darkgray);
            line-height: 1.55;
            margin: 0 0 3rem;
            padding-bottom: 2.5rem;
            border-bottom: 1px solid var(--lightgray);
            max-width: 56ch;
          }
          .rss-section-label {
            display: block;
            font-family: "Inter", sans-serif;
            font-size: 0.62rem;
            text-transform: uppercase;
            letter-spacing: 0.28em;
            color: var(--gray);
            font-weight: 500;
            margin: 0 0 1rem;
            padding-bottom: 0.7rem;
            border-bottom: 1px solid var(--lightgray);
          }
          .rss-section-label::before {
            content: "── ";
            color: var(--accent);
          }
          ul.rss-items {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          ul.rss-items > li {
            list-style: none;
            border-bottom: 1px solid var(--lightgray);
            padding: 1.5rem 0.25rem;
            transition: padding-left 0.25s ease, background 0.25s ease;
          }
          ul.rss-items > li:hover {
            padding-left: 1.25rem;
            background: linear-gradient(to right, rgba(216,213,204,0.18) 0%, transparent 70%);
          }
          .rss-item-num {
            display: inline-block;
            font-family: "Inter", sans-serif;
            font-size: 0.6rem;
            text-transform: uppercase;
            letter-spacing: 0.24em;
            color: var(--accent);
            font-weight: 600;
            margin-bottom: 0.4rem;
            font-feature-settings: "tnum";
          }
          .rss-item-title {
            font-family: "Fraunces", "Noto Serif TC", serif;
            font-size: 1.25rem;
            font-weight: 400;
            letter-spacing: -0.01em;
            line-height: 1.3;
            margin: 0 0 0.4rem;
          }
          .rss-item-title a {
            color: var(--graphite);
            text-decoration: underline;
            text-decoration-thickness: 1px;
            text-decoration-color: transparent;
            text-underline-offset: 4px;
            transition: text-decoration-color 0.2s ease;
          }
          .rss-item-title a:hover {
            text-decoration-color: var(--accent);
          }
          .rss-item-meta {
            font-family: "Inter", sans-serif;
            font-size: 0.78rem;
            color: var(--gray);
            letter-spacing: 0.02em;
          }
          .rss-item-desc {
            font-family: "Inter", sans-serif;
            font-size: 0.92rem;
            color: var(--darkgray);
            line-height: 1.6;
            margin: 0.5rem 0 0;
            max-width: 58ch;
          }
          footer {
            margin-top: 5rem;
            padding-top: 2rem;
            border-top: 1px solid var(--lightgray);
            font-family: "Inter", sans-serif;
            font-size: 0.78rem;
            color: var(--gray);
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
          }
          footer a {
            color: var(--graphite);
            text-decoration: underline;
            text-decoration-color: var(--lightgray);
            text-underline-offset: 3px;
          }
        </style>
      </head>
      <body>
        <div class="rss-banner">
          <strong>RSS</strong>
          這是 RSS feed XML 檔。要訂閱請把這個 URL 加進你的 RSS 閱讀器(Feedly / Inoreader / NetNewsWire 等),或繼續往下瀏覽預覽。
        </div>
        <div class="rss-eyebrow">
          <span class="en">RSS Feed</span>
          <span class="sep">·</span>
          <span class="tc">訂閱來源</span>
        </div>
        <h1><xsl:value-of select="/rss/channel/title"/></h1>
        <p class="rss-desc"><xsl:value-of select="/rss/channel/description"/></p>

        <span class="rss-section-label">Latest items · 最新條目</span>
        <ul class="rss-items">
          <xsl:for-each select="/rss/channel/item">
            <li>
              <span class="rss-item-num">
                <xsl:variable name="pos"><xsl:number value="position()" format="01"/></xsl:variable>
                <xsl:value-of select="$pos"/> ──
              </span>
              <h2 class="rss-item-title">
                <a href="{link}"><xsl:value-of select="title"/></a>
              </h2>
              <div class="rss-item-meta">
                <xsl:value-of select="pubDate"/>
              </div>
              <p class="rss-item-desc">
                <xsl:value-of select="description"/>
              </p>
            </li>
          </xsl:for-each>
        </ul>

        <footer>
          <span>設計史筆記 · Design History Notes</span>
          <a href="/">← 返回首頁</a>
        </footer>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
