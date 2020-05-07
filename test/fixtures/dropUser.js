'use strict';

const config = require('../config');
const mysqlx = require('../../');

module.exports = function (user, options) {
    options = Object.assign({}, config, options, { auth: 'PLAIN', password: '', schema: undefined, ssl: true, user: 'root' });

    return mysqlx.getSession(options)
        .then(session => {
            return session.sql(`DROP USER IF EXISTS '${user}'@'%'`)
                .execute()
                .then(() => {
                    return session.close();
                });
        });
};
