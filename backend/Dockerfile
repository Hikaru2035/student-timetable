FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate \
 && npm prune --omit=dev \
 && npm cache clean --force

RUN addgroup -g 1001 -S nodejs \
 && adduser -S appuser -u 1001

USER appuser

EXPOSE 3001

CMD ["node", "src/index.js"]