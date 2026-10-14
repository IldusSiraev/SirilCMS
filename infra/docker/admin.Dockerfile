FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @sirilcms/reference-admin build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/apps/reference-admin/.next/standalone /app
COPY --from=build /app/apps/reference-admin/.next/static /app/apps/reference-admin/.next/static
COPY --from=build /app/apps/reference-admin/public /app/apps/reference-admin/public
EXPOSE 3001
CMD ["node", "apps/reference-admin/server.js"]
