const express = require('express');
const app = express();

// Global variables to track k6 test status
let testStartTime = null;
let lastRequestTime = null;
let totalRequests = 0;
let failedRequests = 0;

// Update metrics
function updateMetrics(success) {
    lastRequestTime = new Date();
    totalRequests++;
    if (!success) failedRequests++;
}

// Health check endpoint
app.get('/health', (req, res) => {
    const now = new Date();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.status(200).json({
        status: 'healthy',
        timestamp: now.toISOString(),
        checks: {
            uptime: `${uptime} seconds`,
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
            }
        }
    });
});

// Readiness check endpoint
app.get('/ready', (req, res) => {
    const now = new Date();
    const testRunning = testStartTime !== null;
    const lastRequestAge = lastRequestTime ? (now - lastRequestTime) / 1000 : null;

    // Consider the service not ready if:
    // 1. Test hasn't started yet
    // 2. Last request was more than 30 seconds ago (potential hang)
    // 3. Error rate is above 20%
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
    const isReady = testRunning && 
                    (lastRequestAge === null || lastRequestAge < 30) && 
                    errorRate < 20;

    if (isReady) {
        res.status(200).json({
            status: 'ready',
            timestamp: now.toISOString(),
            metrics: {
                testRunning,
                totalRequests,
                failedRequests,
                errorRate: `${errorRate.toFixed(2)}%`,
                lastRequestAge: lastRequestAge ? `${lastRequestAge.toFixed(1)} seconds ago` : 'N/A'
            }
        });
    } else {
        res.status(503).json({
            status: 'not ready',
            timestamp: now.toISOString(),
            reason: !testRunning ? 'Test not started' :
                    lastRequestAge >= 30 ? 'No recent requests' :
                    'Error rate too high',
            metrics: {
                testRunning,
                totalRequests,
                failedRequests,
                errorRate: `${errorRate.toFixed(2)}%`,
                lastRequestAge: lastRequestAge ? `${lastRequestAge.toFixed(1)} seconds ago` : 'N/A'
            }
        });
    }
});

// Metrics update endpoint (called by k6 test)
app.post('/metrics', express.json(), (req, res) => {
    const { success } = req.body;
    if (testStartTime === null) testStartTime = new Date();
    updateMetrics(success);
    res.status(200).send('Metrics updated');
});

const PORT = process.env.HEALTH_PORT || 8080;
app.listen(PORT, () => {
    console.log(`Health check server running on port ${PORT}`);
});
