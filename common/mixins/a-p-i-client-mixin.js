
'use strict';

const utils = require('../../utils')

module.exports = function APIClientMixin(Model) {

    Model.defineProperty('requestDtls', {
        "type": "object"
    });

    Model.defineProperty('serviceName', {
        "type": "string",
        "required": true
    });

    Model.defineProperty('response', {
        "type": "object"
    });

    Model.defineProperty('status', {
        "type": "number"
    });

    Model.remoteMethod('invokeAPI', {
        accepts: [
            {
                arg: 'data', type: {
                    "serviceName": {
                        type: "string",
                        required: true
                    },
                    "requestDtls": {
                        type: "object"
                    }
                }, required: true, http: { source: 'body' }
            },
            utils.options_arg_defn
        ],
        http: { verb: 'POST' },
        returns: { root: true, type: 'object' }
    });

    Model.invokeAPI = function invokeAPI(data, options, next) {
        let self = this;
        self.create(data, options, (err, resp) => {
            next(err, resp && resp.response, resp);
        })
    }

}