FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @siril/admin build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/apps/admin/.next/standalone /app
COPY --from=build /app/apps/admin/.next/static /app/apps/admin/.next/static
COPY --from=build /app/apps/admin/public /app/apps/admin/public
EXPOSE 3001
CMD ["node", "apps/admin/server.js"]
