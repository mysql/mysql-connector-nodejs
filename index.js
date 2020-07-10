/*
 * Copyright (c) 2015, 2020, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

const authenticationManager = require('./lib/Authentication/AuthenticationManager');
const client = require('./lib/DevAPI/Client');
const expr = require('./lib/Protocol/Wrappers/Messages/Expr/Expr');
const locking = require('./lib/DevAPI/Locking');
const mysql41Auth = require('./lib/Authentication/MySQL41Auth');
const parseUri = require('./lib/DevAPI/Util/URIParser');
const plainAuth = require('./lib/Authentication/PlainAuth');
const query = require('./lib/DevAPI/Query');
const sha256MemoryAuth = require('./lib/Authentication/SHA256MemoryAuth');
const schema = require('./lib/DevAPI/Schema');

/**
 * @module mysqlx
 */

/**
 * Register default authentication plugins.
 */
authenticationManager.registerPlugin(mysql41Auth);
authenticationManager.registerPlugin(plainAuth);
authenticationManager.registerPlugin(sha256MemoryAuth);

/**
 * Parse a connection specification.
 * @private
 * @param {string|URI} input - connection specification
 * @param {Object} [options] - string validation options
 * @throws {Error} When the input if not a valid connection specification.
 * @returns {Promise.<Session>}
 */
function parseConnectionSpec (input, options) {
    options = Object.assign({ enforceJSON: false }, options);

    const isPlainObject = typeof input === 'object' && !Array.isArray(input);
    const isString = typeof input === 'string';

    if (!isPlainObject && !isString) {
        throw new Error('Invalid parameter. `getSession()` expects a plain JavaScript object, JSON or a connection string');
    }

    if (isPlainObject) {
        return input;
    }

    try {
        return JSON.parse(input);
    } catch (err) {
        if (err.name === 'SyntaxError' && !options.enforceJSON) {
            return parseUri(input);
        }

        throw err;
    }
}

/**
 * Create a legacy X DevAPI connection.
 * @param {string|URI} connection - connection specification
 * @example
 * mysqlx.getSession({ user: 'root' })
 *   .then(session => {
 *     console.log(session.inspect()); // { host: 'localhost', port: 33060, user: 'root', pooling: false, ... }
 *   })
 * @returns {Promise.<Session>}
 */
exports.getSession = function (connection) {
    connection = typeof connection === 'undefined' ? {} : connection;

    try {
        connection = parseConnectionSpec(connection);
    } catch (err) {
        return Promise.reject(err);
    }

    return client({ pooling: { enabled: false, maxSize: 1 }, uri: connection }).getSession();
};

/**
 * Create a new X DevAPI connection pool.
 * @param {string|URI} connection - connection specification
 * @param {PoolingOptions} options - pooling options
 * @example
 * const client = mysqlx.getClient({ user: 'root' }, { pooling: { enabled: true, maxSize: 3 } })
 *
 * client.getSession()
 *   .then(session => {
 *     console.log(session.inspect()); // { host: 'localhost', port: 33060, user: 'root', pooling: true, ... }
 *   })
 * @returns {module:Client}
 */
exports.getClient = function (connection, options) {
    options = Object.assign({ pooling: { enabled: true } }, parseConnectionSpec(options || {}, { enforceJSON: true, allowUndefined: true }));
    connection = parseConnectionSpec(connection);

    return client(Object.assign(options, { uri: connection }));
};

/**
 * Additional parser options.
 * @typedef {Object} ParserOptions
 * @prop {DataModel} [mode] - the parsing mode
 */

/**
 * Parse an expression string into a Mysqlx.Expr.Expr.
 * @param {string} value - expression string
 * @param {ParserOptions} options - additional options
 * @return {proto.Mysqlx.Expr.Expr} The protobuf object version.
 */
exports.expr = function (value, options) {
    return expr.create(value, Object.assign({}, options, { toParse: true })).valueOf();
};

/**
 * Retrieve the connector version number (from package.json).
 * @return {string}
 */
exports.getVersion = function () {
    return require('./package').version;
};

/**
 * Database entity types.
 * @type {DataModel}
 * @const
 * @example
 * mysqlx.Mode.TABLE
 * mysqlx.Mode.DOCUMENT
 */
exports.Mode = query.Type;

/**
 * Locking modes.
 * @type {LockContention}
 * @const
 * @example
 * mysqlx.LockContention.DEFAULT
 * mysqlx.LockContention.NOWAIT
 * mysqlx.LockContention.SKIP_LOCKED
 */
exports.LockContention = locking.LockContention;

/**
 * Schema validation.
 * @type {ValidationLevel}
 * @const
 * @example
 * mysqlx.Schema.ValidationLevel.OFF
 * mysqlx.Schema.ValidationLevel.STRICT
 */
exports.Schema = {
    ValidationLevel: schema.ValidationLevel
};
