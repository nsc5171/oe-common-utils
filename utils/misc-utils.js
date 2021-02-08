'use strict';
module.exports = {
    valueAt: function valueAt(target, path, fallbackVal) {
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
    options_arg_defn: { arg: 'options', type: 'object', http: 'optionsFromRequest' }
}