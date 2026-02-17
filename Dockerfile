FROM node:18-alpine

WORKDIR /app

# Install server dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm install concurrently nodemon

# Install client dependencies and build
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install

# Copy source code
COPY . .

# Build Next.js client
RUN cd client && npm run build

# Expose ports
EXPOSE 3000 3001

# Start both server and client
CMD ["npx", "concurrently", "node server.js", "cd client && npm start"]
