# Docker 部署

## 部署目标

Astro 构建后的产物是静态文件，因此部署目标很简单：

```text
Build Astro project
  -> generate dist/
  -> serve dist/ with Nginx
```

线上不需要运行 Astro 开发服务器，也不需要数据库。

在两仓库方案中，Docker 镜像由站点仓库构建，内容仓库作为运行时目录挂载。这样内容更新不需要重新构建镜像。

## 1Panel 推荐部署

推荐把内容仓库作为站点仓库的子模块：

```bash
git clone --recurse-submodules git@github.com:HY-LiYihan/liyihan-net-site.git
cd liyihan-net-site
cp .env.example .env
```

编辑 `.env`：

```env
LIYIHAN_PORT=8888
LIYIHAN_PLATFORM=linux/amd64
SITE_DOMAIN=liyihan.net
LIYIHAN_REFRESH_TOKEN=replace-with-a-long-random-token
```

启动：

```bash
docker compose up -d
```

访问：

```text
http://server-ip:8888
```

然后在 1Panel 中新建反向代理：

```text
Domain: liyihan.net
Upstream: http://127.0.0.1:8888
```

容器内部 Nginx 会使用 `SITE_DOMAIN` 作为 `server_name`。如果前面有 1Panel / OpenResty / Nginx 反代，真正的 HTTPS 和证书交给 1Panel 管理即可。

## 镜像模型

当前 Docker 镜像不是纯 Nginx 运行镜像。原因是内容仓库要在容器运行时刷新，镜像必须同时具备：

- Node / npm / Astro / Pagefind：用于从挂载内容目录重新构建静态页面。
- Nginx：用于对外托管最终静态文件。
- 刷新服务：用于接收带 token 的刷新请求。
- 原子发布脚本：构建到临时目录，成功后替换 `/usr/share/nginx/html`，失败时保留旧站点。
- Nginx 配置模板：启动时根据 `SITE_DOMAIN` 生成容器内配置。

## 本地构建验证

在项目初始化完成后，可以使用：

```bash
npm ci
npm run build
npm run preview
```

如果使用 Docker：

```bash
docker build -t liyihan-net .
docker run --rm -p 8888:80 \
  -e LIYIHAN_CONTENT_DIR=/content \
  -e LIYIHAN_REFRESH_TOKEN=change-me \
  -e SITE_DOMAIN=liyihan.net \
  -v "$PWD/content:/content:ro" \
  liyihan-net
```

然后访问：

```text
http://localhost:8888
```

## 可选 Nginx 配置

如果需要更精细的缓存和 SPA fallback，可以加入自定义 Nginx 配置。但对 Astro 静态站点来说，通常默认配置已经足够。

一个可选配置示例：

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$ {
    expires 30d;
    add_header Cache-Control "public";
  }
}
```

如果网站全部是 Astro 静态页面，`try_files $uri $uri/ /index.html` 不是必须项；是否保留取决于后续路由方式。

## docker-compose 示例

```yaml
services:
  liyihan-net:
    image: ghcr.io/hy-liyihan/liyihan-net-site:latest
    container_name: liyihan-net
    platform: ${LIYIHAN_PLATFORM:-linux/amd64}
    ports:
      - "${LIYIHAN_PORT:-8888}:80"
    environment:
      LIYIHAN_CONTENT_DIR: /content
      LIYIHAN_REFRESH_TOKEN: ${LIYIHAN_REFRESH_TOKEN:-change-me}
      SITE_DOMAIN: ${SITE_DOMAIN:-liyihan.net}
    volumes:
      - ./content:/content:ro
    restart: unless-stopped
```

## 内容仓库挂载

目标仓库名：

```text
HY-LiYihan/liyihan-net-site
HY-LiYihan/liyihan-net-content
```

本地开发或构建时，可以直接让 Astro 读取外部内容仓库：

```bash
LIYIHAN_CONTENT_DIR=../liyihan-net-content npm run dev
LIYIHAN_CONTENT_DIR=../liyihan-net-content npm run build
```

生产 Compose 的目标形态是当前仓库里的 `compose.yaml`：

```yaml
services:
  liyihan-net:
    image: ghcr.io/hy-liyihan/liyihan-net-site:latest
    platform: ${LIYIHAN_PLATFORM:-linux/amd64}
    ports:
      - "${LIYIHAN_PORT:-8888}:80"
    environment:
      LIYIHAN_CONTENT_DIR: /content
      LIYIHAN_REFRESH_TOKEN: ${LIYIHAN_REFRESH_TOKEN}
      SITE_DOMAIN: ${SITE_DOMAIN:-liyihan.net}
    volumes:
      - ./content:/content:ro
    restart: unless-stopped
```

只更新内容仓库：

```bash
cd /path/to/liyihan-net-site
git -C content pull
```

然后通过 `/en/admin/` 或 `/zh/admin/` 的刷新按钮触发容器内重新执行构建。也可以直接调用接口：

```bash
curl -X POST http://localhost:8888/api/refresh \
  -H "X-Refresh-Token: replace-with-a-long-random-token"
```

这个步骤会重新读取 `site.config.json`，重新生成 Astro 静态页面和 Pagefind 索引，并把内容仓库的 `assets/` 复制到站点的 `/assets/`。构建结果先进入临时目录，成功后再替换 Nginx 静态目录；构建失败时旧站点继续可用。

刷新接口必须设置 `LIYIHAN_REFRESH_TOKEN`。未设置 token 时，刷新服务会拒绝请求，避免公网用户触发构建。

内容资产建议使用版本化文件名，例如 `paper-2026-v2.pdf` 或带 hash 的图片名。Nginx 对 `/assets/` 使用较短缓存，对构建生成的 CSS/JS/图片继续使用长期缓存。

## 生产部署思路

GitHub Actions 会发布镜像：

```text
ghcr.io/hy-liyihan/liyihan-net-site
```

当前 CI 先发布 `linux/amd64` 镜像。站点运行镜像包含 Node 构建依赖，用于运行时刷新内容；如果未来服务器需要 ARM，再恢复 `linux/arm64` 多架构发布并单独验证构建耗时。

服务器可以直接拉取默认分支的最新镜像：

```bash
docker pull ghcr.io/hy-liyihan/liyihan-net-site:latest
docker run -d --name liyihan-net --restart unless-stopped -p 8888:80 \
  -e LIYIHAN_CONTENT_DIR=/content \
  -e LIYIHAN_REFRESH_TOKEN=replace-with-a-long-random-token \
  -e SITE_DOMAIN=liyihan.net \
  -v "$PWD/content:/content:ro" \
  ghcr.io/hy-liyihan/liyihan-net-site:latest
```

如果服务器使用 `compose.yaml`，可以把镜像改为远端镜像：

```yaml
services:
  liyihan-net:
    image: ghcr.io/hy-liyihan/liyihan-net-site:latest
    platform: ${LIYIHAN_PLATFORM:-linux/amd64}
    ports:
      - "${LIYIHAN_PORT:-8888}:80"
    environment:
      LIYIHAN_CONTENT_DIR: /content
      LIYIHAN_REFRESH_TOKEN: ${LIYIHAN_REFRESH_TOKEN}
      SITE_DOMAIN: ${SITE_DOMAIN:-liyihan.net}
    volumes:
      - ./content:/content:ro
    restart: unless-stopped
```

如果更新站点实现，则流程是：

```text
git pull
git submodule update --init --recursive
docker compose pull
docker compose up -d
```

如果后续接入 GitHub Actions，可以把流程改为：

```text
push to GitHub
  -> GitHub Actions builds image
  -> push image to registry
  -> server pulls image
  -> docker compose up -d
```

## 域名与 HTTPS

生产环境中，`liyihan.net` 可以通过以下方式接入 HTTPS：

- 使用服务器上的反向代理，例如 Nginx Proxy Manager、Caddy、Traefik。
- 使用 Certbot 为 Nginx 申请证书。
- 如果部署在 Cloudflare 后方，也可以使用 Cloudflare 的 HTTPS 和缓存能力。

推荐的简洁方案是：容器内只跑静态 Nginx，HTTPS 和域名由服务器级反向代理统一处理。
