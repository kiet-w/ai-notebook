FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
COPY backend/prisma.config.ts ./
COPY backend/prisma ./prisma/

RUN npm install

COPY backend/tsconfig*.json ./
COPY backend/src ./src/
COPY backend/start.js ./

RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=7860

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/start.js ./start.js

RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 7860

CMD ["sh", "-c", "npx prisma db push && node start.js"]
