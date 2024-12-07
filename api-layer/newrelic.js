// api-layer/newrelic.js
'use strict';

/**
 * New Relic agent configuration.
 */
exports.config = {
  app_name: ['MySQL Performance Demo - API Layer'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || 'your_license_key',
  logging: {
    level: 'info',
    enabled: true,
    filepath: 'logs/newrelic_agent.log'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 4,
    record_sql: 'obfuscated',
    explain_threshold: 500
  },
  slow_sql: {
    enabled: true,
    max_samples: 10
  },
  distributed_tracing: {
    enabled: true
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [401, 404]
  },
  labels: {
    environment: process.env.NODE_ENV || 'development',
    service: 'api-layer'
  }
};
