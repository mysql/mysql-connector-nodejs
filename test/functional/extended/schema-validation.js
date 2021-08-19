/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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

/* eslint-env node, mocha */

const config = require('../../config');
const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

describe('schema validation behavior on older servers', () => {
    let schema, session;

    // server container defined in docker.compose.yml
    const baseConfig = { host: 'mysql-8.0.3', socket: undefined, schema: config.schema || 'mysql-connector-nodejs_test' };

    beforeEach('create default schema', () => {
        const schemalessConfig = Object.assign({}, config, baseConfig, { schema: undefined });

        return fixtures.createSchema(baseConfig.schema, schemalessConfig);
    });

    beforeEach('create session using default schema', () => {
        const defaultSessionConfig = Object.assign({}, config, baseConfig);

        return mysqlx.getSession(defaultSessionConfig)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getDefaultSchema();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('fails to create a collection with a valid JSON schema', () => {
        const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
        const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

        return schema.createCollection('test', options)
            .then(() => {
                return expect.fail();
            })
            .catch(err => {
                return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_COLLECTION_OPTIONS_NOT_SUPPORTED);
            });
    });

    it('re-uses an existing collection without a schema', () => {
        const options = { reuseExisting: true };

        return schema.createCollection('test')
            .then(() => schema.createCollection('test', options));
    });

    it('fails to modify a collection with a valid JSON schema', () => {
        const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
        const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

        return schema.modifyCollection('test', options)
            .then(() => {
                return expect.fail();
            })
            .catch(err => {
                return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_COLLECTION_OPTIONS_NOT_SUPPORTED);
            });
    });
});
