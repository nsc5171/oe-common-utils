'use strict';

let processErrorsHandled = false;
const miscUtils = require('./misc-utils');
const async = require('async');

const DEFAULT_ERR = {
    "errCode": "default-err",
    "errMessage": "Unknown Error. Contact System Admin",
    "errCategory": "business",
    "moreInformation": "An unkown error has occurred. Please contact system administrator for help."
};

module.exports = {
    errorHandling: {
        safeHandlingProcessErrors: function safeHandlingProcessErrors() {
            if (processErrorsHandled) return;
            process
                .on('unhandledRejection', (reason, p) => {
                    console.error(reason, 'Unhandled Rejection at Promise', p);
                })
                .on('uncaughtException', err => {
                    console.error(err, 'Uncaught Exception thrown');
                    process.exit(1);
                });
            processErrorsHandled = true;
        }
    },
    errorUtil: {
        chainErrOnCb: function chainErrOnCb(errCode, opts, options, cb) {
            if (typeof opts !== 'object'); opts = { ctx: {} };
            let ErrorClass = miscUtils.lb.findModel('Error'), apiCtx = {};
            async.waterfall([
                function findErrInst(stepDone) {
                    if (!errCode) return process.nextTick(stepDone);
                    ErrorClass.findOne({ where: { errCode: errCode } }, options, (err, errInst) => {
                        apiCtx.errInst = errInst;
                        return stepDone(err);
                    });
                },
                function checkForErrInst(stepDone) {
                    if (apiCtx.errInst) return process.nextTick(stepDone);
                    ErrorClass.findOne({ where: { errCode: 'default-err' } }, options, (err, errInst) => {
                        apiCtx.errInst = errInst || new ErrorClass(DEFAULT_ERR);
                        return stepDone(err);
                    });
                },
                function processMsg(stepDone) {
                    errInst.status = miscUtils.num(opts.status) || 422;
                    errInst.message = hb.compile(errInst.message)(typeof opts.ctx === 'object' ? opts.ctx : {});
                    return stepDone(errInst);
                }
            ], cb);
        }
    }
}