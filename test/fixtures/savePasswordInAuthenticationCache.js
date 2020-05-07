'use strict';

const config = require('../config');
const mysqlx = require('../../');

module.exports = function (options) {
    // Subsequent sha2 hashes require the password to be saved as plain text in the cache
    options = Object.assign({}, config, options, { auth: 'PLAIN', schema: undefined, ssl: !options.socket ? true : options.ssl });

    return mysqlx.getSession(options)
        .then(session => session.close());
};
