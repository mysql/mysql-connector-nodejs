'use strict';

const config = require('../config');
const mysqlx = require('../../');

module.exports = function (options) {
    options = Object.assign({}, config, options);

    return mysqlx.getSession(options);
};
