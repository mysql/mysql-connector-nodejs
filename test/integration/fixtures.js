'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const config = require('test/integration/properties');
const mysqlx = require('index.js');

exports.setup = function () {
    let session;

    return mysqlx
        .getSession(config)
        .then(s => {
            session = s;

            return session.dropSchema(config.schema);
        })
        .then(() => {
            return session.createSchema(config.schema);
        })
        .catch(err => {
            // Nonexistent databases should not result in errors.
            if (err.info && err.info.code === 1008) {
                return session.createSchema(config.schema);
            }

            throw err;
        })
        .then(schema => {
            return { session, schema };
        });
};

exports.teardown = function (session) {
    return session
        .dropSchema(config.schema)
        .then(() => {
            session.close();
        });
};