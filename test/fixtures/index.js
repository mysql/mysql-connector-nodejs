'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const properties = require('test/properties');
const mysqlx = require('index.js');

const config = Object.assign({}, properties, { socket: undefined });

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

exports.teardown = function () {
    return mysqlx
        .getSession(config)
        .then(session => {
            return session.dropSchema(config.schema).then(() => session);
        })
        .then(session => {
            return session.close();
        });
};
