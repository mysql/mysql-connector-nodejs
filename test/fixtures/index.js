'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const config = require('test/properties');
const mysqlx = require('index');

exports.createAccount = function (options) {
    options = Object.assign({}, config, { host: '%', plugin: 'caching_sha2_password', schema: '*' }, options);

    const baseConfig = Object.assign({}, config, { port: options.port, schema: undefined });

    return mysqlx.getSession(baseConfig)
        .then(session => {
            return session.sql(`CREATE USER IF NOT EXISTS '${options.user}'@'${options.host}' IDENTIFIED WITH ${options.plugin} BY '${options.password}'`)
                .execute()
                .then(() => {
                    return session.sql(`GRANT ALL ON ${options.schema}.* TO '${options.user}'@'${options.host}'`)
                        .execute();
                })
                .then(() => {
                    return session.close();
                });
        });
};

exports.createDefaultSchema = function (options) {
    options = Object.assign({}, config, options, { schema: undefined });

    return mysqlx.getSession(options)
        .then(session => {
            return session.dropSchema(config.schema)
                .then(() => {
                    return session.createSchema(config.schema);
                })
                .then(() => {
                    return session.close();
                });
        });
};

exports.deleteAccount = function (options) {
    options = Object.assign({}, config, { host: '%' }, options);

    const baseConfig = Object.assign({}, config, { port: options.port, schema: undefined });

    return mysqlx.getSession(baseConfig)
        .then(session => {
            return session.sql(`DROP USER IF EXISTS '${options.user}'@'${options.host}'`)
                .execute()
                .then(() => {
                    return session.close();
                });
        });
};

exports.deleteDefaultSchema = function (options) {
    options = Object.assign({}, config, options);

    return mysqlx.getSession(config)
        .then(session => {
            return session.dropSchema(config.schema)
                .then(() => {
                    return session.close();
                });
        });
};
