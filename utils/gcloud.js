'use strict';
let loggingChecked = false;
module.exports = {
    gcloud: {
        enableLogging: function enableGcloudLogging(oeLogger) {
            if (loggingChecked) return;
            if (!oeLogger) oeLogger = require('oe-logger');
            var levels = {
                'trace': 10,
                'debug': 20,
                'info': 30,
                'warn': 40,
                'error': 50,
                'fatal': 60
            };
            if ([true, "TRUE", "true", "Y"].some(v => v === process.env.ENABLE_GCLOUD_LOGGING)) {
                oeLogger('LOGGER-CONFIG').getLogger().streams.push(new (require('@google-cloud/logging-bunyan').LoggingBunyan)().stream(levels[process.env.ENABLE_GCLOUD_LOGGING_LVL] || 50));
            }
            loggingChecked = true;
        }
    }
}