
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

# Include MikroORM configuration and migration files if needed
COPY --from=builder /app/src ./src

EXPOSE 3000

CMD ["sh", "-c", "npm run m:g:u && npm run seed && npm start"]
