FROM node:22-bookworm-slim

WORKDIR /app

# Needed for native modules (better-sqlite3) when a prebuilt binary is unavailable.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000
ENV DB_PATH=/var/data/colabilidades.db

RUN mkdir -p /var/data

EXPOSE 10000

CMD ["npm", "start"]
