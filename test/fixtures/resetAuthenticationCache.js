'use strict';

const config = require('../config');
const mysqlx = require('../../');

module.exports = function (options) {
    options = Object.assign({}, config, options, { auth: 'PLAIN', schema: undefined, ssl: !options.socket ? true : options.socket });

    return mysqlx.getSession(options)
        .then(session => {
            return session.sql('FLUSH PRIVILEGES')
                .execute()
                .then(() => session.close());
        });
};
