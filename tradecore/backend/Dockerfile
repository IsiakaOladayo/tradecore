FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs \
 && adduser  -S tradecore -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY backend/src ./src
COPY backend/package.json ./
COPY database/schema.sql ./

USER tradecore
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "backend/src/index.js"]
