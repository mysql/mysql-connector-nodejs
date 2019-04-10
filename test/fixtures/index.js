'use strict';

/* eslint-env node, mocha */

const config = require('../../test/properties');
const mysqlx = require('../../');

exports.createAccount = function (options) {
    options = Object.assign({}, config, { host: '%', plugin: 'caching_sha2_password', schema: '*' }, options);

    const baseConfig = Object.assign({}, config, { port: options.port, schema: undefined, socket: undefined });

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
    options = Object.assign({}, config, options, { schema: undefined, socket: undefined });

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

    const baseConfig = Object.assign({}, config, { port: options.port, schema: undefined, socket: undefined });

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

    const baseConfig = Object.assign({}, config, { schema: undefined, socket: undefined });

    return mysqlx.getSession(baseConfig)
        .then(session => {
            return session.dropSchema(options.schema)
                .then(() => {
                    return session.close();
                });
        });
};
