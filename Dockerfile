# Build stage - frontend
FROM node:20-alpine AS frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage - server (with Prisma)
FROM node:20-alpine AS server
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate

# Production image
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=server /app/node_modules ./node_modules
COPY --from=server /app/prisma ./prisma
COPY --from=frontend /app/client/dist ./client/dist
ENV NODE_ENV=production
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
