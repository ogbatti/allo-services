FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --workspace=@allo/shared --workspace=@allo/api --include-workspace-root

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY config config
RUN npm run build -w @allo/shared \
  && npm run db:generate -w @allo/api \
  && npm run build -w @allo/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/config ./config
# Never ship local .env into the demo image (Fly secrets provide DATABASE_URL)
RUN rm -f /app/apps/api/.env /app/apps/api/.env.local /app/apps/api/.env.production
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]
