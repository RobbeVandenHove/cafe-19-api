FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/mikro-orm.config.ts ./mikro-orm.config.ts

EXPOSE 3000

CMD ["sh", "-c", "npx mikro-orm migration:up --config /app/dist/mikro-orm.config.js && npx mikro-orm seeder:run --config /app/dist/mikro-orm.config.js && npm start"]