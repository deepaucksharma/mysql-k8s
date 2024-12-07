# load-generator/Dockerfile
FROM loadimpact/k6:latest

# Copy k6 script and New Relic config
COPY k6-script.js /scripts/k6-script.js
COPY newrelic.ini /etc/newrelic.ini

# Set environment variables for New Relic
ENV NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
ENV NEW_RELIC_APP_NAME="k6 Load Generator"

# Run the k6 test
CMD ["run", "/scripts/k6-script.js"]
