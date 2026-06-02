# liyihan.net

这是一个使用 **Astro + MDX + Docker** 构建的个人学术网站。

目标是把现有个人主页、CV、Publications、Projects、Blog 等内容迁移到一个轻量、可维护、可部署的静态站点中：

- 内容以 Markdown / MDX 为主，方便长期写作和版本管理。
- 页面可嵌入视频、链接、iframe、自定义组件、CSS、JavaScript 和交互小程序。
- 使用学术站点结构组织主页、CV、Publications、Projects、Blog 和 Search。
- 构建结果为静态 HTML / CSS / JS，通过 Docker + Nginx 部署。
- 不依赖数据库、PHP 或后台 CMS，运维复杂度低。

## 技术栈

首选技术路线：

```text
Astro + MDX + React + Pagefind + Docker + Nginx + GitHub Actions
```

其中：

- **Astro** 负责静态站点生成、路由、组件集成和构建。
- **MDX** 负责增强版 Markdown 内容写作。
- **React** 用于需要客户端交互的 MDX 组件。
- **Pagefind** 负责构建后的静态搜索索引。
- **Docker** 负责把构建后的静态文件打包为可部署服务。
- **Nginx** 负责托管最终的静态站点。

## 本地开发

安装依赖：

```bash
npm ci
```

启动开发服务器：

```bash
npm run dev
```

构建并生成搜索索引：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## Docker 本地部署

构建镜像：

```bash
docker build -t liyihan-net:local .
```

运行容器：

```bash
docker run --rm -p 8080:80 liyihan-net:local
```

访问：

```text
http://localhost:8080
```

正式内容入口为：

```text
http://localhost:8080/en/
http://localhost:8080/zh/
```

根路径 `/` 会自动选择默认语言：部署在 Cloudflare 后面时，Nginx 会优先读取 `CF-IPCountry` 请求头；没有该头时，根页面会用客户端 IP 地理位置 API 和浏览器语言作为兜底。

也可以使用 Compose：

```bash
docker compose up --build
```

## 远端镜像部署

GitHub Actions 会把默认分支和版本标签构建为 Docker 镜像并发布到 GitHub Container Registry：

```text
ghcr.io/hy-liyihan/liyihan.net
```

服务器部署时只需要拉取镜像并运行：

```bash
docker pull ghcr.io/hy-liyihan/liyihan.net:latest
docker run -d --name liyihan-net --restart unless-stopped -p 8080:80 ghcr.io/hy-liyihan/liyihan.net:latest
```

## 文档结构

```text
docs/
  README.md
  architecture.md
  content-model.md
  themes.md
  deployment.md
```

各文档用途：

- [docs/README.md](docs/README.md)：文档目录和阅读顺序。
- [docs/architecture.md](docs/architecture.md)：整体原理、框架分层和网站结构。
- [docs/content-model.md](docs/content-model.md)：Markdown、MDX、组件和内容组织方式。
- [docs/themes.md](docs/themes.md)：推荐学术主题对比与选型建议。
- [docs/deployment.md](docs/deployment.md)：Docker / Nginx 部署思路和示例。

## 为什么选择 Astro

Astro 适合这个网站的核心原因：

- 原生支持 Markdown，并可通过集成支持 MDX。
- 可以在内容页面中嵌入 Astro、React、Vue、Svelte 等组件。
- 默认输出静态资源，非常适合个人学术站点。
- 对 SEO、RSS、站内搜索、OG 图、页面性能都比较友好。
- Docker 部署简单，最终通常只需要一个 Nginx 容器。

## 为什么选择 MDX

普通 Markdown 适合纯文本写作，但不适合复杂展示。MDX 可以在 Markdown 中直接使用组件，让论文展示、项目 demo、视频、图表、交互实验和自定义样式都进入同一套内容系统。

示例：

```mdx
import YouTube from "../components/YouTube.astro";
import Demo from "../components/Demo.tsx";

## 我的论文展示

<YouTube id="dQw4w9WgXcQ" />

<Demo />

<style>
  .highlight {
    color: red;
  }
</style>
```

## 下一步实施顺序

1. 替换 `src/content/` 中的示例内容。
2. 补充 CV、真实 Publications、Projects 和 Blog。
3. 推送到 GitHub `main` 分支触发 CI/CD。
4. 在服务器拉取 `ghcr.io/hy-liyihan/liyihan.net:latest` 部署。
