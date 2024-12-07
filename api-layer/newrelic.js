// api-layer/newrelic.js
'use strict';
/**
 * New Relic agent configuration.
 */
exports.config = {
  app_name: ['API Layer'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || 'your_license_key',
  logging: {
    level: 'info',
  },
};
