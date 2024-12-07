# api-layer/Dockerfile
FROM node:16-alpine

WORKDIR /app

# Install required tools
RUN apk --no-cache add curl wget netcat-openbsd

# Copy wait-for-it script
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Install dependencies
COPY package.json ./
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Use wait-for-it script as entrypoint
ENTRYPOINT ["/wait-for-it.sh", "mysql", "3306", "--", "node", "server.js"]
