# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src

ARG VITE_API_URL=http://localhost:8081/api
RUN VITE_API_URL="$VITE_API_URL" npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine

LABEL org.opencontainers.image.source="https://github.com/MauricioFrison-70/gestione-ordini-frontend" \
      org.opencontainers.image.description="Frontend React del sistema dimostrativo Gestione Ordini"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/health || exit 1
