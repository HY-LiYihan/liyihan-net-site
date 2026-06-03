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

## 推荐 Dockerfile 模型

```dockerfile
FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache nginx wget

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
  && mkdir -p /usr/share/nginx/html /run/nginx /var/lib/nginx/tmp

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```

这个 Dockerfile 不再是纯 Nginx 运行镜像。原因是内容仓库要在容器运行时刷新，镜像必须同时具备：

- Node / npm / Astro / Pagefind：用于从挂载内容目录重新构建静态页面。
- Nginx：用于对外托管最终静态文件。
- 刷新服务：用于接收带 token 的刷新请求。
- 原子发布脚本：构建到临时目录，成功后替换 `/usr/share/nginx/html`，失败时保留旧站点。

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
docker run --rm -p 8080:80 \
  -e LIYIHAN_CONTENT_DIR=/content \
  -e LIYIHAN_REFRESH_TOKEN=change-me \
  -v "$PWD/src/content:/content:ro" \
  liyihan-net
```

然后访问：

```text
http://localhost:8080
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
    build: .
    ports:
      - "8080:80"
    environment:
      LIYIHAN_CONTENT_DIR: /content
      LIYIHAN_REFRESH_TOKEN: change-me-local
    volumes:
      - ./src/content:/content:ro
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

生产 Compose 的目标形态是：

```yaml
services:
  liyihan-net:
    image: ghcr.io/hy-liyihan/liyihan-net-site:latest
    ports:
      - "8080:80"
    environment:
      LIYIHAN_CONTENT_DIR: /content
      LIYIHAN_REFRESH_TOKEN: replace-with-a-long-random-token
    volumes:
      - /srv/liyihan-net-content:/content:ro
    restart: unless-stopped
```

内容更新流程：

```bash
cd /srv/liyihan-net-content
git pull
```

然后通过 `/en/admin/` 或 `/zh/admin/` 的刷新按钮触发容器内重新执行构建。也可以直接调用接口：

```bash
curl -X POST http://localhost:8080/api/refresh \
  -H "X-Refresh-Token: replace-with-a-long-random-token"
```

这个步骤会重新生成 Astro 静态页面和 Pagefind 索引，并把内容仓库的 `assets/` 复制到站点的 `/assets/`。构建结果先进入临时目录，成功后再替换 Nginx 静态目录；构建失败时旧站点继续可用。

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
docker run -d --name liyihan-net --restart unless-stopped -p 8080:80 \
  -e LIYIHAN_CONTENT_DIR=/content \
  -e LIYIHAN_REFRESH_TOKEN=replace-with-a-long-random-token \
  -v /srv/liyihan-net-content:/content:ro \
  ghcr.io/hy-liyihan/liyihan-net-site:latest
```

如果服务器使用 `compose.yaml`，可以把镜像改为远端镜像：

```yaml
services:
  liyihan-net:
    image: ghcr.io/hy-liyihan/liyihan-net-site:latest
    ports:
      - "8080:80"
    environment:
      LIYIHAN_CONTENT_DIR: /content
      LIYIHAN_REFRESH_TOKEN: replace-with-a-long-random-token
    volumes:
      - /srv/liyihan-net-content:/content:ro
    restart: unless-stopped
```

如果在服务器上从源码部署，则流程是：

```text
git pull
docker compose build
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
