# ── Build frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Build backend ───────────────────────────────────────────
FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx tsc

# ── Production image ────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# Backend production deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Compiled backend
COPY --from=backend-build /app/backend/dist ./backend/dist

# Frontend static build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Drizzle config + schema for migrations
COPY backend/drizzle.config.ts ./backend/
COPY backend/src/db/ ./backend/src/db/

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "backend/dist/server.js"]
