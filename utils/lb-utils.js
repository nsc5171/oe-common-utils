'use strict';

const miscUtils = require('./misc-utils');

module.exports = {
    modelUtils: {
        getRemoteMethodsOfModel: function getRemoteMethodsOfModel(model) {
            if (typeof model === 'string') model = miscUtils.lb.findModel(model);
            return miscUtils.arrayify(miscUtils.valueAt(model, 'sharedClass._methods'));
        }
    }
}