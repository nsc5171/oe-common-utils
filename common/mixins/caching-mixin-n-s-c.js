'use strict';

const utils = require('../../utils')
const log = require('oe-logger')('CachingMixin_nsc');
const lb = require('loopback');
const mongodb = require('oe-connector-mongodb/lib/mongodb');
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
        },
        deleteCache: function deleteCache() {
            let self = this;
            delete self._cacheInstance;
            return Promise.resolve({ response: "Cache instance deleted successfully." });
        }
    }
};
const defaultCachingModule = 'node-cache';

module.exports = function CachingMixin_nsc(Model, opts) {

    Model.deleteCache = function (options, next) {
        let self = this;
        self[cacheSetupKey].deleteCache().then(resp => next(null, resp)).catch(next);
    };

    Model.remoteMethod('deleteCache', {
        accepts: [
            utils.options_arg_defn
        ],
        http: { verb: 'DELETE' },
        returns: { root: true, type: 'object' }
    });

    if (Model.dataSource.settings && ["true", true].some(v => v === Model.dataSource.settings.disableCaching_nsc)) {
        log.debug(log.defaultContext(), `Skipping caching for datasource ${dataSource.connector.name}`, Model.modelName)
        return;
    }

    checkAndEnableCachingMechForDataSource(Model.dataSource);

    let cacheModuleName = opts.cacheModule && cacheModules[opts.cacheModule] ? opts.cacheModule : defaultCachingModule;
    let cacheModule = cacheModules[cacheModuleName];

    Model[cacheSetupKey] = Object.assign({
        enabled: true,
        moduleName: cacheModuleName,
        opts
    }, cacheModule);


}

function checkAndEnableCachingMechForDataSource(dataSource) {


    let cnctrName = dataSource.connector.name;
    if (dataSource[cacheSetupKey] || utils.arrayify(dataSource && dataSource._events && dataSource._events.connected).some(func =>
        func.name === 'CachingMixin_nsc_wrapper')) return dataSource;

    switch (cnctrName) {
        case ('mongodb'): {
            dataSource.on('connected', function CachingMixin_nsc_wrapper() {
                let dsSelf = this;
                if (dsSelf[cacheSetupKey]) return;
                dsSelf[cacheSetupKey] = true;
                if (typeof dsSelf.connector.query === 'function') {
                    const _all = dsSelf.connector.all;
                    dsSelf.connector.all = function cacheOverridenAll(model, filter, options, callback) {
                        var cnctrSelf = this;
                        let args = arguments, modelClass = lb.findModel(model);
                        if (!modelClass || !modelClass[cacheSetupKey]) return _all.apply(dsSelf.connector, args); // if caching not enabled continue with normal flow
                        if (cnctrSelf.debug) {
                            debug('all', model, filter);
                        }
                        filter = filter || {};
                        var idName = cnctrSelf.idName(model);
                        var query = {};
                        if (filter.where) {
                            query = cnctrSelf.buildWhere(model, filter.where, options);
                        }
                        if (filter && filter.group) {
                            cnctrSelf.modifyFilter(filter);
                            var pipeline = cnctrSelf.buildPipeline(model, filter, query);
                        }
                        var fields = filter.fields;
                        var groups = filter.group;

                        // Convert custom column names
                        fields = cnctrSelf.fromPropertyToDatabaseNames(model, fields);

                        let cacheKey = 'all_' + JSON.stringify(Object.assign({}, filter, { where: undefined, include: undefined, query }));
                        if (groups) {
                            // cnctrSelf.modifyFilter(filter);
                            // var pipeline = cnctrSelf.buildPipeline(model, filter, query);
                            cnctrSelf.execute(model, 'aggregate', pipeline, {}, processAggregationResponse);
                            modelClass[cacheSetupKey].get(cacheKey).then(result => {
                                if (result) {
                                    return callback(null, JSON.parse(result));
                                } else {
                                    cnctrSelf.execute(model, 'aggregate', pipeline, {}, (err, cursor) => {
                                        processAggregationResponse(err, cursor, (err, finalResp, currResp) => {
                                            callback(err, finalResp);
                                            modelClass[cacheSetupKey].set(cacheKey, currResp).catch(err => {
                                                log.debug(log.defaultContext(), 'Error when updating cache', cacheKey, model, err)
                                            });
                                            return;
                                        })
                                    });
                                }
                            }).catch(err => {
                                log.debug(log.defaultContext(), 'Error when fetching cache', cacheKey, model, err);
                                return _all.apply(dsSelf.connector, args)
                            });
                        } else if (fields) {
                            var findOpts = { projection: mongodb.fieldsArrayToObj(fields) };
                            modelClass[cacheSetupKey].get(cacheKey).then(result => {
                                if (result) {
                                    return checkForIncludeAndProceed(JSON.parse(result), callback);
                                } else {
                                    cnctrSelf.execute(model, 'find', query, findOpts, (err, cursor) => {
                                        processResponse(err, cursor, (err, finalResp, currResp) => {
                                            callback(err, finalResp);
                                            modelClass[cacheSetupKey].set(cacheKey, currResp).catch(err => {
                                                log.debug(log.defaultContext(), 'Error when updating cache', cacheKey, model, err)
                                            });
                                            return;
                                        })
                                    });
                                }
                            }).catch(err => {
                                log.debug(log.defaultContext(), 'Error when fetching cache', cacheKey, model, err);
                                return _all.apply(dsSelf.connector, args)
                            });
                        } else {
                            modelClass[cacheSetupKey].get(cacheKey).then(result => {
                                if (result) {
                                    return checkForIncludeAndProceed(JSON.parse(result), callback);
                                } else {
                                    cnctrSelf.execute(model, 'find', query, (err, cursor) => {
                                        processResponse(err, cursor, (err, finalResp, currResp) => {
                                            callback(err, finalResp);
                                            modelClass[cacheSetupKey].set(cacheKey, currResp).catch(err => {
                                                log.debug(log.defaultContext(), 'Error when updating cache', cacheKey, model, err)
                                            });
                                            return;
                                        })
                                    });
                                }
                            }).catch(err => {
                                log.debug(log.defaultContext(), 'Error when fetching cache', cacheKey, model, err);
                                return _all.apply(dsSelf.connector, args)
                            });
                        }

                        function checkForIncludeAndProceed(objs, cb) {
                            if (filter && filter.include) {
                                cnctrSelf._models[model].model.include(
                                    objs,
                                    filter.include,
                                    options,
                                    cb
                                );
                            } else {
                                cb(null, objs);
                            }
                        }

                        function processResponse(err, cursor, cb) {
                            // if (!cb) cb = callback;
                            if (err) {
                                return cb(err);
                            }

                            var collation = options && options.collation;
                            if (collation) {
                                cursor.collation(collation);
                            }

                            // don't apply sorting if dealing with a geo query
                            if (!hasNearFilter(filter.where)) {
                                var order = cnctrSelf.buildSort(model, filter.order, options);
                                cursor.sort(order);
                            }

                            if (filter.limit) {
                                cursor.limit(filter.limit);
                            }
                            if (filter.skip) {
                                cursor.skip(filter.skip);
                            } else if (filter.offset) {
                                cursor.skip(filter.offset);
                            }

                            var shouldSetIdValue = idIncluded(fields, idName);
                            var deleteMongoId = !shouldSetIdValue || idName !== '_id';

                            cursor.toArray(function (err, data) {
                                if (cnctrSelf.debug) {
                                    debug('all', model, filter, err, data);
                                }
                                if (err) {
                                    return cb(err);
                                }
                                var objs = data.map(function (o) {
                                    if (shouldSetIdValue) {
                                        cnctrSelf.setIdValue(model, o, o._id);
                                    }
                                    // Don't pass back _id if the fields is set
                                    if (deleteMongoId) {
                                        delete o._id;
                                    }

                                    o = cnctrSelf.fromDatabase(model, o);
                                    return o;
                                });
                                let cacheVal = JSON.stringify(objs);
                                if (filter && filter.include) {
                                    cnctrSelf._models[model].model.include(
                                        objs,
                                        filter.include,
                                        options,
                                        (err, resp) => cb(err, resp, cacheVal)
                                    );
                                } else {
                                    cb(null, objs, cacheVal);
                                }
                            });
                        }

                        function processAggregationResponse(err, cursor) {
                            if (err) {
                                callback(err);
                            }
                            if (filter.group) {
                                Object.keys(filter.group).forEach(function (key) {
                                    key = key.toLowerCase();
                                    if (key !== 'groupby') {
                                        var val = filter.group[key];
                                        Object.keys(val).forEach(function (elem) {
                                            filter.fields.push(val[elem]);
                                        });
                                    }
                                });
                            }
                            cursor.toArray(function (err, data) {
                                if (cnctrSelf.debug) {
                                    debug('all', model, filter, err, data);
                                }
                                if (err) {
                                    return callback(err);
                                }
                                var objs = data.map(function (obj) {
                                    var data = Object.assign(obj, obj._id);
                                    delete data['_id'];
                                    data = cnctrSelf.fromDatabase(model, data);
                                    return data;
                                });
                                let cacheValue = JSON.stringify(objs);
                                callback(null, objs, cacheValue);
                            });
                        }
                    };
                    const _find = dsSelf.connector.find;
                    dsSelf.connector.find = function cacheOverridenFind(model, id, options, callback) {
                        let args = arguments, modelClass = lb.findModel(model);
                        if (!modelClass || !modelClass[cacheSetupKey]) return _find.apply(dsSelf.connector, args); // if caching not enabled continue with normal flow
                        let cacheKey = 'find_' + JSON.stringify(id);
                        modelClass[cacheSetupKey].get(cacheKey).then(result => {
                            if (result) {
                                return callback(null, JSON.parse(result));
                            } else {
                                const finalCb = args[args.length - 1];
                                args[args.length - 1] = function (err, data) {
                                    if (err) {
                                        return finalCb(err);
                                    } else {
                                        finalCb(null, data);
                                        modelClass[cacheSetupKey].set(cacheKey, JSON.stringify(data)).catch(err => {
                                            log.debug(log.defaultContext(), 'Error when updating cache', cacheKey, model, err)
                                        });
                                        return;
                                    }
                                };
                                _find.apply(dsSelf.connector, args);
                            }
                        }).catch(err => {
                            log.debug(log.defaultContext(), 'Error when fetching cache', cacheKey, model, err);
                            return _find.apply(dsSelf.connector, args)
                        });
                    }
                    const _count = dsSelf.connector.count;
                    dsSelf.connector.count = function cacheOverridenCount(model, where, options, callback) {
                        let args = arguments, modelClass = lb.findModel(model);
                        if (!modelClass || !modelClass[cacheSetupKey]) return _count.apply(dsSelf.connector, args); // if caching not enabled continue with normal flow
                        let cacheKey = 'count_' + JSON.stringify(where);
                        modelClass[cacheSetupKey].get(cacheKey).then(result => {
                            if (result) {
                                return callback(null, Number(result));
                            } else {
                                const finalCb = args[args.length - 1];
                                args[args.length - 1] = function (err, count) {
                                    if (err) {
                                        return finalCb(err);
                                    } else {
                                        finalCb(null, count);
                                        modelClass[cacheSetupKey].set(cacheKey, String(count)).catch(err => {
                                            log.debug(log.defaultContext(), 'Error when updating cache', cacheKey, model, err)
                                        });
                                        return;
                                    }
                                };
                                _count.apply(dsSelf.connector, args);
                            }
                        }).catch(err => {
                            log.debug(log.defaultContext(), 'Error when fetching cache', cacheKey, model, err);
                            return _count.apply(dsSelf.connector, args)
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

/*!
 * Decide if id should be included
 * @param {Object} fields
 * @returns {Boolean}
 * @private
 */
function idIncluded(fields, idName) {
    if (!fields) {
        return true;
    }
    if (Array.isArray(fields)) {
        return fields.indexOf(idName) >= 0;
    }
    if (fields[idName]) {
        // Included
        return true;
    }
    if (idName in fields && !fields[idName]) {
        // Excluded
        return false;
    }
    for (var f in fields) {
        return !fields[f]; // If the fields has exclusion
    }
    return true;
}

function hasNearFilter(where) {
    if (!where) return false;
    // TODO: Optimize to return once a `near` key is found
    // instead of searching through everything

    var isFound = false;

    searchForNear(where);

    function found(prop) {
        return prop && prop.near;
    }

    function searchForNear(node) {
        if (!node) {
            return;
        }

        if (Array.isArray(node)) {
            node.forEach(function (prop) {
                isFound = found(prop);

                if (!isFound) {
                    searchForNear(prop);
                }
            });
        } else if (typeof node === 'object') {
            Object.keys(node).forEach(function (key) {
                var prop = node[key];

                isFound = found(prop);

                if (!isFound) {
                    searchForNear(prop);
                }
            });
        }
    }
    return isFound;
}