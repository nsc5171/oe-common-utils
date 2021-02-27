'use strict';

const modeBaseClassWrapper = require('./server/wrappers/toJSON-wrapper.js');
const logger = require('oe-logger');
function gcloudLoggerEnablement() {

    if ([true, "TRUE", "true", "Y"].some(v => v === process.env.ENABLE_GCLOUD_LOGGING)) {
        logger('LOGGER-CONFIG').streams.push(new (require('@google-cloud/logging-bunyan').LoggingBunyan)().stream(process.env.ENABLE_GCLOUD_LOGGING_LVL || 'error'));
    }
    return true;
}

gcloudLoggerEnablement();


module.exports = function (app) {
};