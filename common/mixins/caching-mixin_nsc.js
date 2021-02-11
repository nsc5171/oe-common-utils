
'use strict';

const utils = require('../../utils')
const log = require('oe-logger')('CachingMixin_nsc');
const lb = require('loopback');
const cacheSetupKey = '_caching_mixin_nsc'
const cacheModules = {
    'node-cache': {
        get: function nodeCacheGetter(key) {
            let self = this;
            self.init()
            return Promise.resolve(self._cacheInstance.get.apply(self._cacheInstance, arguments));
        },
        set: function nodeCacheSetter(key, value) {
            let self = this;
            self.init()
            return Promise.resolve(self._cacheInstance.set.apply(self._cacheInstance, arguments));
        },
        has: function nodeCacheSetter(key, value) {
            let self = this;
            self.init()
            return Promise.resolve(self._cacheInstance.has.apply(self._cacheInstance, arguments));
        },
        implmtn: require('node-cache'),
        init: function initNodeCache() {
            let self = this;
            if (!self._cacheInstance) self._cacheInstance = new (self.implmtn)(self.opts || undefined);
            return self._cacheInstance;
        }
    }
};
const defaultCachingModule = 'node-cache';


modeule.exports = function CachingMixin_nsc(Model, opts) {

    if (Model.dataSource.settings && ["true", true].some(v => v === Model.dataSource.settings.disableCaching_nsc)) {
        log.debug(log.defaultContext(), `Skipping caching for datasource ${dataSource.connector.name}`, Model.modelName)
        return;
    }

    checkAndEnableCachingMechForDataSource(Model.dataSource);

    let cacheModuleName = opts.cacheModule && cacheModules[opts.cacheModule] ? opts.cacheModule : defaultCachingModule;
    let cacheModule = cacheModules[opts.cacheModule];

    Model[cacheSetupKey] = Object.apply({
        enabled: true,
        moduleName: cacheModuleName,
        opts
    }, cacheModule);


}

function checkAndEnableCachingMechForDataSource(dataSource) {


    if (utils.arrayify(dataSource && dataSource._events && dataSource._events.connected).some(func =>
        func.name === 'CachingMixin_nsc_wrapper')) return dataSource;

    switch (dataSource.connector.name) {
        case ('mongodb'): {
            dataSource.on('connected', function CachingMixin_nsc_wrapper() {
                let self = this;
                if (typeof self.connector.query === 'function') {
                    const _all = self.connector.all;
                    self.connector.all = function (model, command, queryObj, cb) {
                        if ((!['find', 'findOne'].includes(command))) return _all.apply(self.connector, arguments); // if not select continue with normal flow
                        let modelClass = model && lb.findModel(model);
                        if (!modelClass || !modelClass[cacheSetupKey]) return _all.apply(self.connector, arguments); // if caching not enabled continue with normal flow
                        modelClass[cacheSetupKey].get(JSON.stringify(queryObj)).then(result=>{

                        })
                    }
                    const _find = self.connector.find;
                    self.connector.find = function (model, command, queryObj, cb) {
                        if ((!['find', 'findOne'].includes(command))) return _find.apply(self.connector, arguments); // if not select continue with normal flow
                        let modelClass = model && lb.findModel(model);
                        if (!modelClass || !modelClass[cacheSetupKey]) return _find.apply(self.connector, arguments); // if caching not enabled continue with normal flow
                        modelClass[cacheSetupKey].get(JSON.stringify(queryObj)).then(result=>{

                        })
                    }
                }
            });
            break;
        }
        default: {
            log.error(log.defaultContext(), 'Caching not supported yet for datasource type : ' + dataSource.connector.name, Model.modelName)
        }
    }

}

