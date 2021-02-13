const ModelBaseClass = require('loopback-datasource-juggler/lib/model.js');
const List = require('loopback-datasource-juggler/lib/list.js');


ModelBaseClass.prototype.toJSON = function toJSONSerializerFuncOverriden() {
    const data = {};
    const self = this;
    const Model = this.constructor;

    // if it is already an Object
    if (Model === Object) {
        return self;
    }

    const persistUndefinedAsNull = Model.definition.settings.persistUndefinedAsNull;

    const props = Model.definition.properties;
    let keys = Object.keys(props);
    let propertyName, val;

    for (let i = 0; i < keys.length; i++) {
        propertyName = keys[i];
        val = self[propertyName];

        // Exclude functions
        if (typeof val === 'function') {
            continue;
        }
        // Exclude hidden properties
        if (Model.isHiddenProperty(propertyName)) {
            continue;
        }

        if (val instanceof List) {
            data[propertyName] = val.toJSON();
        } else {
            if (val !== undefined && val !== null && val.toJSON) {
                data[propertyName] = val.toJSON();
            } else {
                if (val === undefined && persistUndefinedAsNull) {
                    val = null;
                }
                data[propertyName] = val;
            }
        }
    }


    // Find its own properties which can be set via myModel.myProperty = 'myValue'.
    // If the property is not declared in the model definition, no setter will be
    // triggered to add it to __data
    keys = Object.keys(self);
    let size = keys.length;
    for (let i = 0; i < size; i++) {
        propertyName = keys[i];
        if (props[propertyName]) {
            continue;
        }
        if (propertyName.indexOf('__') === 0) {
            continue;
        }
        if (Model.isHiddenProperty(propertyName)) {
            continue;
        }
        if (data[propertyName] !== undefined) {
            continue;
        }
        val = self[propertyName];
        if (val !== undefined) {
            if (typeof val === 'function') {
                continue;
            }
            if (val !== null && val.toJSON) {
                data[propertyName] = val.toJSON();
            } else {
                data[propertyName] = val;
            }
        } else if (persistUndefinedAsNull) {
            data[propertyName] = null;
        }
    }
    // Now continue to check __data
    keys = Object.keys(self.__data);
    size = keys.length;
    for (let i = 0; i < size; i++) {
        propertyName = keys[i];
        if (propertyName.indexOf('__') === 0) {
            continue;
        }
        if (data[propertyName] === undefined) {
            if (Model.isHiddenProperty(propertyName)) {
                continue;
            }
            const ownVal = self[propertyName];
            // The ownVal can be a relation function
            val = (ownVal !== undefined && (typeof ownVal !== 'function')) ? ownVal : self.__data[propertyName];
            if (typeof val === 'function') {
                continue;
            }

            if (val !== undefined && val !== null && val.toJSON) {
                data[propertyName] = val.toJSON();
            } else if (val === undefined && persistUndefinedAsNull) {
                data[propertyName] = null;
            } else {
                data[propertyName] = val;
            }
        }
    }
    return data;
};

List.prototype.toJSON = function () {
    const items = [];
    this.forEach(function (item) {
        if (item && Array.isArray(item) && item.toArray) {
            const subArray = item.toArray();
            items.push(subArray);
        } else if (item && typeof item === 'object' && item.toObject) {
            items.push(item.toJSON());
        } else {
            items.push(item);
        }
    });
    return items;
};
