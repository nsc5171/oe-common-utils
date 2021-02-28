'use strict';

const miscUtils = require('./misc-utils');

module.exports = {
    restStatusCategory: function restStatusCategory(inp) {
        return Math.floor(miscUtils.num(inp) / 100);
    }
};