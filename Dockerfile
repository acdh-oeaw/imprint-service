# syntax=docker/dockerfile:1

# base
FROM oven/bun:1-slim AS base

WORKDIR /usr/src/app

# build
FROM base AS build

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
ENV NODE_ENV=production
RUN bun run build

# serve
FROM base AS serve

COPY --from=build /usr/src/app/index.js .
COPY --from=build /usr/src/app/content content

USER bun
EXPOSE 3000
ENTRYPOINT [ "bun", "run", "index.js" ]
