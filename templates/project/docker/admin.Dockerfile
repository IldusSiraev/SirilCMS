# Сборка из корня репозитория: docker build -f docker/admin.Dockerfile --secret id=npm_token,env=NPM_TOKEN -t {{name}}-admin .
# NPM_TOKEN — PAT с read:packages (пакеты @sirilcms/* в GitHub Packages). Токен не попадает в слои образа.
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN --mount=type=secret,id=npm_token \
    printf '//npm.pkg.github.com/:_authToken=%s\n' "$(cat /run/secrets/npm_token)" > /root/.npmrc \
    && pnpm install --frozen-lockfile \
    && rm -f /root/.npmrc
RUN pnpm --filter {{name}}-admin build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/admin/.next/standalone /app
COPY --from=build /app/admin/.next/static /app/admin/.next/static
EXPOSE 3001
ENV PORT=3001 HOSTNAME=0.0.0.0
CMD ["node", "admin/server.js"]
