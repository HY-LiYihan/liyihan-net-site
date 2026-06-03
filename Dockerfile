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

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
