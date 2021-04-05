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

const Level = require('../../../../lib/logger').Level;
const config = require('../../../config');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const warnings = require('../../../../lib/constants/warnings');
const path = require('path');

// TODO(rui.quelhas): extract tests into proper self-contained suites.
describe('collection miscellaneous tests', () => {
    let schema, session;

    beforeEach('create default schema', () => {
        return fixtures.createSchema(config.schema);
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(config)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getSchema(config.schema);
    });

    beforeEach('create collection', () => {
        return schema.createCollection('test');
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('checks if a collection exists in the database', () => {
        return schema.createCollection('foobar')
            .then(collection => collection.existsInDatabase())
            .then(result => expect(result).to.be.true);
    });

    it('checks if a collection does not exist in the database', () => {
        const collection = schema.getCollection('foobar');

        return collection.existsInDatabase()
            .then(result => expect(result).to.be.false);
    });

    context('creating a collection', () => {
        context('when one does not exist', () => {
            it('creates a new collection in the associated schema', () => {
                return schema.createCollection('foobar')
                    .then(collection => {
                        expect(collection.getName()).to.equal('foobar');
                        return expect(collection.getSchema().getName()).to.deep.equal(schema.getName());
                    });
            });
        });

        context('when one already exists', () => {
            let schemaName;

            beforeEach('create the schema', () => {
                schemaName = 'foobar';

                return schema.createCollection(schemaName);
            });

            it('returns the existing schema when it is allowed', () => {
                return schema.createCollection(schemaName, { reuseExisting: true })
                    .then(collection => {
                        expect(collection.getName()).to.equal('foobar');
                        return expect(collection.getSchema().getName()).to.deep.equal(schema.getName());
                    });
            });

            context('when using a deprecation option to allow re-using the existing schema', () => {
                it('writes a deprecation message to the debug log when debug mode is enabled', () => {
                    const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'create-collection-deprecated.js');

                    return fixtures.collectLogs('api:schema.createCollection', script, [schema.getName(), 'foobar'], { level: Level.WARNING })
                        .then(proc => {
                            expect(proc.logs).to.have.lengthOf(1);
                            return expect(proc.logs[0]).to.equal(warnings.MESSAGES.WARN_DEPRECATED_CREATE_COLLECTION_REUSE_EXISTING);
                        });
                });

                it('writes a deprecation message to stdout when debug mode is not enabled', done => {
                    const warningMessages = [];

                    process.on('warning', warning => {
                        if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                            warningMessages.push(warning.message);
                        }

                        if (warning.name && warning.name === 'NoWarning') {
                            process.removeAllListeners('warning');

                            expect(warningMessages).to.have.lengthOf(1);
                            expect(warningMessages[0]).to.equal(warnings.MESSAGES.WARN_DEPRECATED_CREATE_COLLECTION_REUSE_EXISTING);

                            return done();
                        }
                    });

                    schema.createCollection(schemaName, { ReuseExistingObject: true })
                        .then(() => {
                            process.emitWarning('No more warnings.', 'NoWarning');
                        });
                });
            });

            it('fails if its not allowed to re-use the existing schema', () => {
                return schema.createCollection(schemaName)
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        return expect(err.info.code).to.equal(errors.ER_TABLE_EXISTS_ERROR);
                    });
            });
        });
    });

    it('@regression does not apply padding when retrieving server-side auto-generated _id values using SQL', () => {
        const ids = [];

        return schema.getCollection('test').add({ name: 'foo' })
            .execute()
            .then(() => {
                return session.sql(`SELECT _id FROM ${schema.getName()}.test`)
                    .execute(row => ids.push(row[0]));
            })
            .then(() => ids.forEach(id => expect(id).to.have.lengthOf(28)));
    });

    context('collection size', () => {
        beforeEach('ensure non-existing collection', () => {
            return schema.dropCollection('noop');
        });

        beforeEach('add fixtures', () => {
            return schema.getCollection('test')
                .add({ name: 'foo' })
                .add({ name: 'bar' })
                .add({ name: 'baz' })
                .execute();
        });

        it('retrieves the total number of documents in a collection', () => {
            return schema.getCollection('test').count()
                .then(actual => expect(actual).to.equal(3));
        });

        it('fails if the collection does not exist in the given schema', () => {
            return schema.getCollection('noop').count()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(`Collection '${schema.getName()}.noop' doesn't exist`);
                });
        });
    });

    context('collections in the schema', () => {
        it('checks if a collection exists in the database', () => {
            return schema.createCollection('foo')
                .then(() => schema.getCollection('foo').existsInDatabase())
                .then(exists => expect(exists).to.be.true);
        });

        it('distinguishes tables from collections', () => {
            return schema.createCollection('foo')
                .then(() => schema.getTable('foo').existsInDatabase())
                .then(exists => expect(exists).to.be.false);
        });
    });
});
