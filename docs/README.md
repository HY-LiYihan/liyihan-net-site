# 文档目录

本目录用于记录 `liyihan.net` 的网站架构、内容模型和部署方式。

推荐阅读顺序：

1. [two-repo-plan.md](two-repo-plan.md)：先理解站点仓库和内容仓库如何拆分。
2. [architecture.md](architecture.md)：再理解整体技术路线和框架分层。
3. [content-model.md](content-model.md)：理解内容如何用 Markdown / MDX / 组件组织。
4. [themes.md](themes.md)：选择合适的学术主题作为起点。
5. [deployment.md](deployment.md)：最后看 Docker 和 Nginx 部署方式。

## 总体结论

当前实现是：

```text
Astro + MDX + React + Pagefind + Docker + GitHub Actions
```

这个组合适合个人学术网站，因为它同时满足：

- 内容可长期维护。
- 支持比 Markdown 更强的交互和展示能力。
- 主页、CV、Publications、Projects、Blog、Search 已有可运行实现。
- 构建结果是纯静态站点，并可以从外部内容目录生成。
- 部署方式简单、稳定、成本低。

## 推荐仓库名

```text
HY-LiYihan/liyihan-net-site
HY-LiYihan/liyihan-net-content
```

这组命名比 `liyihan.net` / `liyihan.net-content` 更清楚：一眼能看出哪个仓库负责网站实现，哪个仓库负责内容资产。

## 文档边界

这些文档描述的是当前项目源码的维护方式。后续可以继续补充：

- 内容迁移规范。
- 服务器和域名配置。
