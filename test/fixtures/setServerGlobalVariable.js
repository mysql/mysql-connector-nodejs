'use strict';

const config = require('../config');
const mysqlx = require('../../');

module.exports = function (name, value, options) {
    options = Object.assign({}, config, options, { schema: undefined });

    return mysqlx.getSession(options)
        .then(session => {
            return session.sql(`SET GLOBAL ${name}=${value}`)
                .execute()
                .then(() => session.close());
        });
};
