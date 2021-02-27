'use strict';

const modeBaseClassWrapper = require('./server/wrappers/toJSON-wrapper.js');
const logger = require('oe-logger');
const utils = require('./utils');

function gcloudLoggerEnablement() {
    let loggerCfg = utils.safeParse(process.env.LOGGER_CONFIG);
    if (typeof loggerCfg !== 'object') return;
    let streams = utils.arrayify(loggerCfg.logStreams);
    let gcloudLogger = streams.find(i => i.type === 'gcloud-logging');
    if (gcloudLogger) {
        logger('LOGGER-CONFIG').streams.push(new (require('@google-cloud/logging-bunyan').LoggingBunyan)().stream(gcloudLogger.level || 'error'));
    }
    return true;
}

gcloudLoggerEnablement();


module.exports = function (app) {
};