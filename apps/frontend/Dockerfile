FROM node:18-alpine AS builder

WORKDIR /app

COPY apps/frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY apps/frontend/ .
COPY packages/ /packages/
ARG BACKEND_URL
ARG NEXT_PUBLIC_BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3001

CMD ["npm", "run", "start"]
