# -- Stage 1: Install deps & build frontend --
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/

RUN npm install --workspace=@noteunix/frontend

COPY packages/frontend/ packages/frontend/
COPY packages/backend/ packages/backend/

RUN npm run build -w @noteunix/frontend

# -- Stage 2: Production --
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/

RUN npm install --omit=dev --workspace=@noteunix/backend

COPY packages/backend/ packages/backend/
COPY --from=builder /app/packages/frontend/dist packages/frontend/dist

ENV NODE_ENV=production
EXPOSE 5000

USER appuser

CMD ["node", "packages/backend/src/server.js"]
