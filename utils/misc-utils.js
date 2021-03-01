'use strict';

const hb = require('handlebars');
const lb = require('loopback');

module.exports = {
    valueAt,
    valueResolver: function (target, defFallbackVal) {
        return {
            get: function resolverFactory(path, fallbackVal) {
                if (fallbackVal === undefined) fallbackVal = defFallbackVal;
                return valueAt(target, path, fallbackVal);
            }
        }
    },
    arrayify: function arrayify(inp) {
        return inp === undefined ? [] : Array.isArray(inp) ? inp : [inp];
    },
    safeParse: function safeParse(inp) {
        try {
            return JSON.parse(inp);
        } catch (err) {
            return;
        }
    },
    num: number,
    randomNum: function randomNum(len) {
        len = number(len);
        if (len < 1) {
            return;
        } else if (len > 16) {
            len = 16;
        }
        let tenPowLenM1 = Math.pow(10, len - 1);
        return Math.floor(Math.random() * (9 * tenPowLenM1 - 1) + tenPowLenM1);
    },
    hb,
    lb,
    options_arg_defn: { arg: 'options', type: 'object', http: 'optionsFromRequest' }
}

function valueAt(target, path, fallbackVal) {
    let op = target;
    let steps;
    if (Array.isArray(path)) {
        steps = path;
    } else {
        steps = typeof path === 'string' ? path.split('.') : [];
    }
    try {
        steps.forEach(s => op = op[s]);
    } catch (err) {
        op = fallbackVal;
    }
    return op === undefined ? fallbackVal : op;
}

function number(inp) {
    return Number(inp) || 0;
}