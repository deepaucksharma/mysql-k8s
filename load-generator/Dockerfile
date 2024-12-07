# load-generator/Dockerfile
FROM grafana/k6:latest

# Switch to root to install packages
USER root

# Install Node.js and npm
RUN apk add --no-cache nodejs npm

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy all necessary files
COPY health-server.js .
COPY k6-script.js .
COPY start.sh .
COPY newrelic.ini .

# Make start script executable
RUN chmod +x start.sh

# Switch back to k6 user
USER k6

# Use shell to run the start script
ENTRYPOINT ["/bin/sh"]
CMD ["./start.sh"]
