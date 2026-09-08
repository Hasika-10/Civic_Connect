FROM node:20-slim

# Install build essentials for native modules like better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package definitions
COPY package*.json ./
COPY client/package*.json ./client/

# Install root and client dependencies
RUN npm install
RUN cd client && npm install

# Copy application source
COPY . .

# Build client production bundle
RUN cd client && npm run build

# Initialize and seed database
RUN node server/seed.js

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server/index.js"]
