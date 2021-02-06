'use strict';
const utils = require('../../utils');
module.exports = function (AppConfig) {
    AppConfig.on('attach', function cacheAppConfig() {
        refreshCache();
    });

    AppConfig.getConfig = function getConfig(key = 'settings') {
        return utils.valueAt(this, ['__syncCacheMap', key, 'value']);
    }

    function refreshCache() {
        AppConfig.find({}, {
            "tenantId": "default"
        }, (err, insts) => {
            if (Array.isArray(insts)) {
                AppConfig.__syncCacheMap = insts.reduce((fin, curr) => {
                    fin[curr.key] = curr.toObject();
                    return fin;
                }, {})
                setTimeout(refreshCache, utils.valueAt(AppConfig, ['__syncCacheMap', 'refreshConfig', 'value', 'interval']) || 300000);
            }
        });
    }
};
