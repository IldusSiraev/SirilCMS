FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
ARG PAYLOAD_URL=http://admin:3001
ENV PAYLOAD_URL=$PAYLOAD_URL
RUN pnpm --filter @siril/web build

FROM node:22-alpine
ENV PAYLOAD_URL=http://admin:3001
WORKDIR /app
COPY --from=build /app/apps/web/.output /app/apps/web/.output
EXPOSE 3000
CMD ["node", "apps/web/.output/server/index.mjs"]
