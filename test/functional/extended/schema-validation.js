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
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

describe('schema validation behavior on older servers', () => {
    let schema, session;

    // server container defined in docker.compose.yml
    const baseConfig = { host: 'mysql-8.0.3', socket: undefined };

    beforeEach('create default schema', () => {
        return fixtures.createSchema(config.schema, baseConfig);
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(Object.assign({}, config, baseConfig))
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getSchema(config.schema);
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('fails to create a collection with a valid JSON schema', () => {
        const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
        const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

        return schema.createCollection('test', options)
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.equal('Your MySQL server does not support the requested operation. Please update to MySQL 8.0.19 or a later version.'));
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
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.equal('Your MySQL server does not support the requested operation. Please update to MySQL 8.0.19 or a later version.'));
    });
});
