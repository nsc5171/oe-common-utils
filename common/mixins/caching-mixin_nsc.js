
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


module.exports = function CachingMixin_nsc(Model, opts) {

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
                    self.connector.all = function cacheOverridenAll(model, filter, options, callback) {
                        let args = arguments;
                        if (!modelClass || !modelClass[cacheSetupKey]) return _all.apply(self.connector, args); // if caching not enabled continue with normal flow
                        let cacheKey = 'filter_' + JSON.stringify(filter);
                        modelClass[cacheSetupKey].get().then(result => {
                            if (result) {
                                return callback(null, result);
                            } else {
                                const finalCb = args[args.length - 1];
                                args[args.length - 1] = function (err, objs) {
                                    if (err) {
                                        return finalCb(err);
                                    } else {
                                        finalCb(null, objs);
                                        modelClass[cacheSetupKey].set(cacheKey, objs).catch(err => {
                                            log.debug(log.defaultContext(), 'Error when updating cache', cacheKey, model, err)
                                        });
                                        return;
                                    }
                                };
                                _all.apply(self.connector, args);
                            }
                        }).catch(err => {
                            log.debug(log.defaultContext(), 'Error when fetching cache', cacheKey, model, err);
                            return _all.apply(self.connector, args)
                        });
                    }
                    const _find = self.connector.find;
                    self.connector.find = function (model, id, options, callback) {
                        let args = arguments;
                        if (!modelClass || !modelClass[cacheSetupKey]) return _find.apply(self.connector, args); // if caching not enabled continue with normal flow
                        let cacheKey = 'id_' + JSON.stringify(id);
                        modelClass[cacheSetupKey].get().then(result => {
                            if (result) {
                                return callback(null, result);
                            } else {
                                const finalCb = args[args.length - 1];
                                args[args.length - 1] = function (err, data) {
                                    if (err) {
                                        return finalCb(err);
                                    } else {
                                        finalCb(null, data);
                                        modelClass[cacheSetupKey].set(cacheKey, data).catch(err => {
                                            log.debug(log.defaultContext(), 'Error when updating cache', cacheKey, model, err)
                                        });
                                        return;
                                    }
                                };
                                _find.apply(self.connector, args);
                            }
                        }).catch(err => {
                            log.debug(log.defaultContext(), 'Error when fetching cache', cacheKey, model, err);
                            return _find.apply(self.connector, args)
                        });
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

