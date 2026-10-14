# Сборка из корня репозитория: docker build -f docker/web.Dockerfile --secret id=npm_token,env=NPM_TOKEN -t {{name}}-web .
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN --mount=type=secret,id=npm_token \
    printf '//npm.pkg.github.com/:_authToken=%s\n' "$(cat /run/secrets/npm_token)" > /root/.npmrc \
    && pnpm install --frozen-lockfile \
    && rm -f /root/.npmrc
# PAYLOAD_URL — внутренний адрес админки в сети compose; запекается при сборке, не секрет
ARG PAYLOAD_URL=http://admin:3001
ENV PAYLOAD_URL=$PAYLOAD_URL
RUN pnpm --filter {{name}}-web build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/web/.output /app/web/.output
EXPOSE 3000
CMD ["node", "web/.output/server/index.mjs"]
