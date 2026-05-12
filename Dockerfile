FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun build --target=node --outdir=dist src/server.ts

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["bun", "dist/server.js"]
