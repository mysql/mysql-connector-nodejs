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

const config = require('../../../config');
const fixtures = require('../../../fixtures');
const expect = require('chai').expect;

describe('transaction support', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let schema, session;

    beforeEach('create temporary schema', () => {
        return fixtures.createSchema(baseConfig.schema);
    });

    beforeEach('create default session', () => {
        const defaultConfig = Object.assign({}, baseConfig);

        return fixtures.createSession(defaultConfig)
            .then(newSession => {
                session = newSession;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getDefaultSchema();
    });

    beforeEach('create temporary table', () => {
        return session.sql('CREATE TABLE test (name VARCHAR(4))')
            .execute();
    });

    afterEach('delete temporary schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close default session', () => {
        return session.close();
    });

    context('committing transactions', () => {
        it('executes the work in the scope of an ongoing transaction', () => {
            return session.startTransaction()
                .then(() => {
                    return session.sql('INSERT INTO test VALUES (\'bar\')')
                        .execute();
                })
                .then(() => {
                    return session.commit();
                })
                .then(() => {
                    return session.sql('SELECT COUNT(*) FROM test')
                        .execute();
                })
                .then(res => {
                    return expect(res.fetchOne()[0]).to.equal(1);
                });
        });
    });

    context('rolling back transactions', () => {
        it('discards the work in the scope of an ongoing transaction', () => {
            return session.startTransaction()
                .then(() => {
                    return session.sql('INSERT INTO test VALUES (\'bar\')')
                        .execute();
                })
                .then(() => {
                    return session.rollback();
                })
                .then(() => {
                    return session.sql('SELECT COUNT(*) FROM test')
                        .execute();
                })
                .then(res => {
                    return expect(res.fetchOne()[0]).to.equal(0);
                });
        });
    });
});
