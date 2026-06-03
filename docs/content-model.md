# 内容模型

## 核心原则

网站内容应以 Markdown / MDX 为中心，而不是依赖后台 CMS。

这样做的好处：

- 内容可以被 Git 版本管理。
- 迁移和备份简单。
- 写作体验接近普通 Markdown。
- 需要复杂展示时可以切换到 MDX。
- 论文、项目、博客可以使用统一的 frontmatter 元数据。

## Markdown 与 MDX 的分工

### Markdown

适合纯文本或轻量页面：

- 简短博客。
- 普通说明文档。
- 读书笔记。
- 不需要交互的项目介绍。

### MDX

适合需要增强展示的页面：

- 论文页面中嵌入视频。
- 项目页面中嵌入 demo。
- 文章中嵌入图表。
- 使用自定义 CSS / JS。
- 调用 React / Vue / Svelte / Astro 组件。

MDX 可以理解为：

```text
MDX = Markdown + components
```

它保留 Markdown 的写作效率，同时允许页面直接使用组件。

## 典型 MDX 示例

```mdx
---
title: "A Research Project"
description: "Project summary."
date: 2026-06-03
tags: ["research", "visualization"]
---

import YouTube from "@components/YouTube.astro";
import InteractiveDemo from "@components/InteractiveDemo.tsx";

# A Research Project

This page describes a research project.

<YouTube id="dQw4w9WgXcQ" />

<InteractiveDemo />

<style>
  .highlight {
    color: red;
  }
</style>
```

## 建议内容目录

如果内容仍放在站点仓库内，可以采用类似结构：

```text
src/
  content/
    blog/
      paper-reading.mdx
      research-note.md
    projects/
      topovisnav.mdx
      multilingual-corpus-lab.mdx
    pages/
      cv.md
      about.md
    publications/
      publications.bib
  components/
    YouTube.astro
    PublicationCard.astro
    ProjectCard.astro
    InteractiveDemo.tsx
  pages/
    index.astro
    publications.astro
    projects.astro
    blog/
      [slug].astro
```

实际目录应优先遵循所选主题的约定。如果使用 Astro Scholar，应先保留主题默认结构，再逐步迁移内容。

如果采用两仓库模型，内容仓库建议直接以集合目录作为顶层结构：

```text
liyihan-net-content/
  blog/
    astro-mdx-docker.mdx
    research-note.md
  projects/
    topovisnav.mdx
    multilingual-corpus-lab.md
  publications/
    omnitrav.md
    static-academic-websites.mdx
  pages/
    cv.md
    about.md
  assets/
    images/
    papers/
    videos/
  bibliography/
    publications.bib
```

站点仓库通过 `LIYIHAN_CONTENT_DIR=/path/to/liyihan-net-content` 读取这些集合。MDX 中引用站点组件时应使用 `@components/...` 这类稳定别名，不要使用依赖文件相对位置的 `../../components/...`。

## Frontmatter 建议

文章和项目建议统一使用 frontmatter：

```yaml
---
title: "Project Title"
description: "Short summary for SEO and cards."
date: 2026-06-03
updated: 2026-06-03
tags:
  - research
  - visualization
draft: false
featured: true
---
```

项目页可额外增加：

```yaml
---
repo: "https://github.com/HY-LiYihan/example"
demo: "https://example.com"
paper: "/papers/example.pdf"
cover: "/images/projects/example-cover.png"
---
```

论文条目建议优先用 BibTeX 管理，再由主题生成 Publications 页面。

## 嵌入内容类型

MDX 可以支持这些常见嵌入：

- 视频：YouTube、Bilibili、本地视频。
- 链接卡片：GitHub、论文、项目主页。
- iframe：外部 demo、地图、可视化页面。
- 交互组件：React / Vue / Svelte 小程序。
- 图表：Observable、D3、ECharts、Vega-Lite 等。
- 样式：页面局部 CSS。
- 脚本：页面局部 JavaScript。

建议把重复使用的嵌入方式封装为组件，而不是在每篇 MDX 中复制 iframe 或脚本。

## 内容迁移策略

1. 先迁移稳定页面：About、CV、Publications。
2. 再迁移 Projects，并为每个项目补齐 frontmatter。
3. 最后迁移 Blog / Notes。
4. 对需要视频、demo、图表的文章使用 `.mdx`。
5. 对纯文本文章继续使用 `.md`。
