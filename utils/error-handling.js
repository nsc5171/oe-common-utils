'use strict';

let processErrorsHandled = false;

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
    }
}