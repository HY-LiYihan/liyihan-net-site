# 整体架构

## 目标

`liyihan.net` 计划构建为一个轻量、可维护、可扩展的个人学术网站，主要承载：

- 个人简介与研究方向。
- CV / Resume。
- Publications。
- Projects。
- Blog / Notes。
- 视频、链接、图表、交互 demo、小程序等增强内容。

核心要求是：内容应尽量以 Markdown / MDX 写作，站点应易于部署，且不需要维护数据库或复杂后台系统。后续维护按两仓库模型推进：站点实现和长期内容分离。

## 推荐技术栈

```text
Content:    External Markdown / MDX / BibTeX repository
Framework:  Astro
Theme:      Astro Scholar 或 Astro Academia
Search:     Pagefind
Build:      Node.js
Runtime:    Static HTML / CSS / JS
Hosting:    Docker + Nginx
```

## 分层说明

### 0. 仓库边界

推荐维护两个仓库：

```text
HY-LiYihan/liyihan-net-site
HY-LiYihan/liyihan-net-content
```

`liyihan-net-site` 保存 Astro 代码、组件、样式、Docker 和 CI/CD。`liyihan-net-content` 保存 Markdown / MDX、CV、论文、项目、图片和 PDF。站点仓库通过 `LIYIHAN_CONTENT_DIR` 读取外部内容目录。

### 1. 内容层

内容层负责保存所有长期维护的文本、论文、项目和博客内容。

典型内容包括：

- `.md`：普通文章、说明页、笔记。
- `.mdx`：需要嵌入组件、视频、交互 demo 的增强文章。
- `.bib`：论文条目，用于自动生成 Publications 页面。
- 图片、视频封面、PDF、项目截图等静态资产。

在两仓库模式下，内容层不再属于站点源码仓库。站点仓库只保留少量过渡样例或测试内容，生产内容从挂载的内容仓库读取。

### 2. 组件层

组件层负责把复杂展示封装成可复用模块。

例如：

- `YouTube.astro`：嵌入 YouTube 视频。
- `Bilibili.astro`：嵌入 Bilibili 视频。
- `PublicationCard.astro`：论文卡片。
- `ProjectCard.astro`：项目卡片。
- `InteractiveDemo.tsx`：React 交互小程序。
- `Chart.tsx`：图表或可视化组件。

MDX 的价值在这里最明显：文章本身仍然像 Markdown 一样写，但可以直接调用这些组件。

### 3. 页面层

页面层负责组织网站路由和页面结构。

建议保留以下主要页面：

```text
/
/cv
/publications
/projects
/blog
/blog/[slug]
/notes
/tags/[tag]
```

如果使用 Astro Scholar，大部分页面结构已经存在，只需要按照主题约定补充内容和配置。

### 4. 构建层

Astro 在构建时会把外部内容、组件和页面组合成静态文件：

```text
liyihan-net-content/
        +
liyihan-net-site/src/
        |
        v
LIYIHAN_CONTENT_DIR=/content astro build
        |
        v
dist/
```

`dist/` 中是最终部署产物，通常包括 HTML、CSS、JS、图片和搜索索引。

### 5. 部署层

部署层不运行 Astro 开发服务器，而是只托管构建后的静态文件。

推荐基础方式：

```text
Docker build
  -> npm ci
  -> npm run build
  -> copy dist/ to nginx html root
  -> nginx serves static files
```

最终线上运行的是一个 Nginx 容器，不需要数据库。

两仓库目标形态中，Docker 镜像只随 `liyihan-net-site` 更新；`liyihan-net-content` 作为目录挂载。内容变更后，刷新入口在容器内重新执行 Astro build 和 Pagefind，更新静态产物，但不重建 Docker 镜像。

## 为什么不是 Ghost / Halo / WordPress

Ghost、Halo、WordPress 这类 CMS 更适合后台编辑、多人发布、评论系统和动态内容管理。但对个人学术站点来说，它们会引入额外负担：

- 需要数据库。
- 需要运行后台服务。
- 内容与 Git 版本管理结合不如 Markdown / MDX 直接。
- 自定义交互和组件通常没有 MDX 灵活。

Astro 的优势是：本地写作、Git 管理、静态构建、轻量部署。

## 推荐总体流程

```text
Write MD / MDX / BibTeX in content repo
        |
        v
Mount content repo into site container
        |
        v
Astro renders pages
        |
        v
astro build generates dist/
        |
        v
Docker image packages dist/
        |
        v
Nginx serves liyihan.net
```
