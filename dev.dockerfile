# syntax=docker/dockerfile:1

FROM node:26.6.0-bookworm-slim AS frontend

WORKDIR /app/frontend

COPY frontend/ ./
COPY frontend/.env .env
RUN --mount=type=cache,target=/root/.npm npm ci
COPY frontend/ ./
RUN npm run build

FROM node:26.6.0-bookworm-slim AS backend-build

WORKDIR /app/backend

COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY backend/ ./
RUN npm run build -- --declaration false --declarationMap false --sourceMap false

FROM node:26.6.0-bookworm-slim

WORKDIR /app/backend

COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY --from=backend-build /app/backend/dist/ ./src/
COPY --from=frontend /app/frontend/dist ./src/app/public
COPY backend/.env.dev .env.dev

EXPOSE 3000

ENV NODE_ENV=dev
CMD ["node", "src/app/api/index.js"]