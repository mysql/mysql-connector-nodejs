'use strict';

const config = require('../config');
const mysqlx = require('../../');

module.exports = function (user, plugin, password, options) {
    options = Object.assign({}, config, options, { auth: 'PLAIN', password: '', schema: undefined, ssl: true, user: 'root' });

    return mysqlx.getSession(options)
        .then(session => {
            return session.sql(`CREATE USER IF NOT EXISTS '${user}'@'%' IDENTIFIED WITH ${plugin} BY '${password}'`)
                .execute()
                .then(() => {
                    return session.sql(`GRANT ALL ON *.* TO '${user}'@'%'`)
                        .execute();
                })
                .then(() => {
                    return session.close();
                });
        });
};
