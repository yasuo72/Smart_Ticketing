FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run db:generate --workspace apps/api
RUN npm run build:api

FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN mkdir -p apps/web \
  && printf '%s\n' '{"name":"@ai-ticketing/web","version":"0.1.0","private":true}' > apps/web/package.json
RUN npm ci --omit=dev --workspace apps/api
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/prisma.config.ts apps/api/prisma.config.ts
COPY --from=build /app/apps/api/scripts apps/api/scripts
RUN chmod +x apps/api/scripts/*.sh
EXPOSE 4000
CMD ["sh", "./apps/api/scripts/start-prod.sh"]
