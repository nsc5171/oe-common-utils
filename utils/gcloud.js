'use strict';
let loggingChecked = false;
module.exports = {
    gcloud: {
        enableLogging: function enableGcloudLogging(oeLogger) {
            if (loggingChecked) return;
            if (!oeLogger) oeLogger = require('oe-logger');
            if ([true, "TRUE", "true", "Y"].some(v => v === process.env.ENABLE_GCLOUD_LOGGING)) {
                logger('LOGGER-CONFIG').getLogger().streams.push(new (require('@google-cloud/logging-bunyan').LoggingBunyan)().stream(process.env.ENABLE_GCLOUD_LOGGING_LVL || 'error'));
            }
            loggingChecked = true;
        }
    }
}