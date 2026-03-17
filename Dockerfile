FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3111
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3111
CMD ["sh", "-c", "npm run db:migrate:deploy && node -e \"const { PrismaClient } = require('@prisma/client'); const { spawnSync } = require('child_process'); (async () => { const prisma = new PrismaClient(); let count = 0; try { count = await prisma.user.count(); } catch { count = 0; } try { await prisma.$disconnect(); } catch {} if (count === 0) { console.log('Seeding database...'); const r = spawnSync('npm', ['run', 'db:seed'], { stdio: 'inherit' }); if (typeof r.status === 'number') process.exit(r.status); if (r.error) { console.error(r.error); process.exit(1); } } })().catch((e) => { console.error(e); process.exit(1); });\" && npm run start"]
