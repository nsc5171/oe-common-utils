'use strict';

const utils = require('../../utils');
const lb = require('loopback');
const lbUtils = require('loopback-datasource-juggler/lib/utils');

let customizedKey = inp => 'nsc' + inp;

let keys = {
    foreignKey: customizedKey('foreignKey')
}

let VALIDNS = {
    [keys.foreignKey]: {
        extractor: ({ Model, propDefn, fieldName }) => {
            return utils.arrayify(utils.valueAt(propDefn, [keys.foreignKey])).reduce((fin, cfg) => {
                let { model, foreignKey, where } = typeof cfg === 'object' ? cfg : {}, modelClass;
                if (model) {
                    modelClass = lb.findModel(model);
                    if (modelClass) {
                        if (foreignKey) {
                            if (!utils.valueAt(modelClass, ['definition', 'properties', foreignKey])) {
                                return fin;
                            }
                        } else {
                            foreignKey = modelClass.getIdName();
                        }
                        
                    }
                }
                return fin;
            }, []);
        }
    }
}

module.exports = function ValidationMixin_nsc(Model) {

    if (!Array.isArray(Model.customValidations)) Model.customValidations = [];


    function fetchCustomValidationFunctions() {

    }

}