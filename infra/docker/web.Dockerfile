FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
ARG PAYLOAD_URL=http://admin:3001
ENV PAYLOAD_URL=$PAYLOAD_URL
RUN pnpm --filter @sirilcms/reference-web build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/apps/reference-web/.output /app/apps/reference-web/.output
EXPOSE 3000
CMD ["node", "apps/reference-web/.output/server/index.mjs"]
