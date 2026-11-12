FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "node database/scripts/migrate.mjs up && (node database/scripts/seed.mjs || true) && node backend/server.js"]
