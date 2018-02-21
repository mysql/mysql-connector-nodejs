'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const properties = require('test/properties');
const mysqlx = require('index.js');

const config = Object.assign({}, properties, { socket: undefined });

exports.createDatabase = function () {
    return mysqlx
        .getSession(config)
        .then(session => {
            return session.dropSchema(config.schema).then(() => session);
        })
        .then(session => {
            return session.createSchema(config.schema).then(schema => ({ session, schema }));
        });
};

exports.createAccount = function (options) {
    options = Object.assign({}, config, options);

    return mysqlx
        .getSession(config)
        .then(session => {
            return session
                .sql(`CREATE USER IF NOT EXISTS '${options.user}'@'${options.host}' IDENTIFIED WITH ${options.plugin} BY '${options.password}'`)
                .execute()
                .then(() => session);
        })
        .then(session => {
            return session
                .sql(`GRANT SELECT ON ${options.schema}.* TO '${options.user}'@'${options.host}'`)
                .execute()
                .then(() => session);
        })
        .then(session => {
            return session.close();
        });
};

exports.deleteAccount = function (options) {
    options = Object.assign({}, config, options);

    return mysqlx
        .getSession(config)
        .then(session => {
            return session
                .sql(`DROP USER IF EXISTS '${options.user}'@'${options.host}'`)
                .execute()
                .then(() => session);
        })
        .then(session => {
            return session.close();
        });
};

exports.teardown = function (session, schema) {
    if (!session) {
        return Promise.reject(new Error(`cannot close \`${session}\` session`));
    }

    const schemaName = !schema ? config.schema : schema.getName();

    return session
        .dropSchema(schemaName)
        .then(() => {
            return session.close();
        });
};
