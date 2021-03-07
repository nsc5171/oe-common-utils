'use strict';

const miscUtils = require('./misc-utils');

module.exports = {
    modelUtils: Object.assign((() => {
        try {
            return require('loopback-datasource-juggler/lib/utils') || {};
        } catch (err) {
            return {};
        }
    })(), {
        getRemoteMethodsOfModel: function getRemoteMethodsOfModel(model) {
            if (typeof model === 'string') model = miscUtils.lb.findModel(model);
            return miscUtils.arrayify(miscUtils.valueAt(model, 'sharedClass._methods'));
        }
    })
}