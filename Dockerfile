FROM node:22-bookworm-slim

WORKDIR /app

# Required for native modules such as better-sqlite3 when prebuilt binaries are unavailable.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=10000
ENV DB_PATH=/var/data/colabilidades.db

EXPOSE 10000

CMD ["npm", "start"]
