FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/backend/package*.json ./
RUN npm ci

COPY apps/backend/ .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY apps/backend/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/src/main.js"]
