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
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');

describe('schema management', () => {
    const baseConfig = { schema: undefined };

    let session;

    beforeEach('create default session', () => {
        const defaultConfig = Object.assign({}, config, baseConfig);

        return fixtures.createSession(defaultConfig)
            .then(newSession => {
                session = newSession;
            });
    });

    afterEach('close default session', () => {
        return session.close();
    });

    context('creating a new schema', () => {
        context('when the schema name is valid', () => {
            const schemaName = 'foo';

            afterEach('delete the schema', () => {
                return session.sql(`DROP DATABASE IF EXISTS ${schemaName}`)
                    .execute();
            });

            it('succeeds when a schema with the given name does not exist yet', () => {
                return session.createSchema(schemaName)
                    .then(() => {
                        return session.sql('SHOW DATABASES')
                            .execute();
                    })
                    .then(res => {
                        return expect(res.fetchAll().map(row => row[0])).to.deep.include(schemaName);
                    });
            });

            it('fails when the schema with a given name already exists', () => {
                // try creating the same schema twice
                return session.createSchema(schemaName)
                    .then(() => session.createSchema(schemaName))
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_DB_CREATE_EXISTS);
                    });
            });
        });

        it('fails when the schema name is not valid', () => {
            const schemaName = '';

            return session.createSchema(schemaName)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(errors.ER_WRONG_DB_NAME);
                });
        });
    });

    context('listing existing schemas', () => {
        it('should return a list of schema instances mapping the existing databases in the server', () => {
            return session.getSchemas()
                .then(schemas => {
                    return session.sql('SHOW DATABASES')
                        .execute()
                        .then(res => {
                            return expect(schemas.map(schema => schema.getName())).to.deep.equal(res.fetchAll().map(row => row[0]));
                        });
                });
        });
    });

    context('dropping schemas', () => {
        it('succeeds when a schema with the given name exists', () => {
            const schemaName = 'foo';

            return session.sql(`CREATE DATABASE IF NOT EXISTS ${schemaName}`)
                .execute()
                .then(() => {
                    return session.dropSchema(schemaName);
                });
        });

        it('succeeds when a schema with the given name does not exist', () => {
            const schemaName = 'foo';

            return session.sql(`DROP DATABASE IF EXISTS ${schemaName}`)
                .execute()
                .then(() => {
                    return session.dropSchema(schemaName);
                });
        });

        it('fails when the schema name is not valid', () => {
            const schemaName = '';

            return session.dropSchema(schemaName)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(errors.ER_WRONG_DB_NAME);
                });
        });
    });
});
