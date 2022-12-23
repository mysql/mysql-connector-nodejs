/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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
const mysqlx = require('../../../../');
const path = require('path');

describe('upserting single documents in collections using CRUD', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let schema, session, collection;

    beforeEach('create default schema', () => {
        return fixtures.createSchema(baseConfig.schema);
    });

    beforeEach('create session using default schema', () => {
        const defaultConfig = Object.assign({}, config, baseConfig);

        return mysqlx.getSession(defaultConfig)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getDefaultSchema();
    });

    beforeEach('create collection', () => {
        return schema.createCollection('test')
            .then(c => {
                collection = c;
            });
    });

    beforeEach('add fixtures', () => {
        return collection
            .add({ _id: '1', name: 'foo' })
            .add({ _id: '2', name: 'bar' })
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('when the replacement document does not contain an _id property', () => {
        context('and a document with the same id does not exist', () => {
            it('adds a new document with the given properties', async () => {
                const unsafeNegative = '-9223372036854775808';
                const unsafePositive = '18446744073709551615';
                const want = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }, { _id: '3', unsafeNegative, unsafePositive }];

                let res = await collection.addOrReplaceOne('3', { unsafeNegative: BigInt(unsafeNegative), unsafePositive: BigInt(unsafePositive) });

                expect(res.getAffectedItemsCount()).to.equal(1);

                res = await collection.find().execute();

                const got = res.fetchAll();

                expect(got).to.deep.equal(want);
            });
        });

        context('and a document with the same id already exists', () => {
            it('replaces the given properties of the document', async () => {
                const unsafeNegative = '-9223372036854775808';
                const unsafePositive = '18446744073709551615';
                const want = [{ _id: '1', unsafePositive, unsafeNegative }, { _id: '2', name: 'bar' }];

                let res = await collection.addOrReplaceOne('1', { unsafeNegative: BigInt(unsafeNegative), unsafePositive: BigInt(unsafePositive) });
                // the existing row is re-created (leading to two different operations)
                // see https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html
                expect(res.getAffectedItemsCount()).to.equal(2);

                res = await collection.find().execute();
                const got = res.fetchAll();

                expect(got).to.deep.equal(want);
            });
        });
    });

    context('when the replacement document contains a matching _id property', () => {
        it('adds a new document with the provided properties if it does not exist', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz', age: 23 }];
            const actual = [];

            return collection.addOrReplaceOne('3', { _id: '3', name: 'baz', age: 23 })
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(1);
                    return collection.find().execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('replaces any existing document with the given id', () => {
            const expected = [{ _id: '1', age: 23 }, { _id: '2', name: 'bar' }];
            const actual = [];

            return collection.addOrReplaceOne('1', { _id: '1', age: 23 })
                .then(result => {
                    // the existing row is re-created (leading to two different operations)
                    // see https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html
                    expect(result.getAffectedItemsCount()).to.equal(2);

                    return collection.find().execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('when the replacement document contains a non-matching _id property', () => {
        it('fails if both ids already match existing documents', () => {
            return collection.addOrReplaceOne('1', { _id: '2', name: 'baz', age: 23 })
                .then(() => {
                    return expect.fail();
                })
                .catch((err) => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_DOCUMENT_ID_MISMATCH);
                });
        });

        it('fails if both ids do no match any existing document', () => {
            return collection.addOrReplaceOne('3', { _id: '4', name: 'baz', age: 23 })
                .then(() => {
                    return expect.fail();
                })
                .catch((err) => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_DOCUMENT_ID_MISMATCH);
                });
        });

        it('fails if the reference id matches an existing document but the replacement document id does not', () => {
            return collection.addOrReplaceOne('2', { _id: '3', name: 'baz', age: 23 })
                .then(() => {
                    return expect.fail();
                })
                .catch((err) => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_DOCUMENT_ID_MISMATCH);
                });
        });

        it('fails if the reference id does not match an existing document but the replacement document id does', () => {
            return collection.addOrReplaceOne('3', { _id: '2', name: 'baz', age: 23 })
                .then(() => {
                    return expect.fail();
                })
                .catch((err) => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_DOCUMENT_ID_MISMATCH);
                });
        });
    });

    context('when the collection contains a unique key', () => {
        beforeEach('create unique key constraint', () => {
            return session
                .sql(`ALTER TABLE \`${schema.getName()}\`.\`${collection.getName()}\` ADD COLUMN name VARCHAR(3) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(doc, '$.name'))) VIRTUAL UNIQUE KEY NOT NULL`)
                .execute();
        });

        it('fails if the document already exists but the collection contains another document with the same unique key value', () => {
            return collection.addOrReplaceOne('1', { name: 'bar' })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DUPLICATE_ENTRY);
                });
        });

        it('fails if the document does not exist but the collection contains another document with the same unique key value', () => {
            return collection.addOrReplaceOne('3', { name: 'bar' })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DUPLICATE_ENTRY);
                });
        });

        it('creates a new document when it does not exist and the properties do not contain a duplicate unique key value', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            const actual = [];

            return collection.addOrReplaceOne('3', { name: 'baz' })
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(1);
                    return collection.find().execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('replaces an existing document when the properties do not contain a duplicate unique key value', () => {
            const expected = [{ _id: '1', name: 'baz' }, { _id: '2', name: 'bar' }];
            const actual = [];

            return collection.addOrReplaceOne('1', { name: 'baz' })
                .then(result => {
                    // the existing row is re-created (leading to two different operations)
                    // see https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html
                    expect(result.getAffectedItemsCount()).to.equal(2);
                    return collection.find().execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('replaces an existing document when the properties contain the same unique key values', () => {
            const expected = [{ _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar' }];
            const actual = [];

            return collection.addOrReplaceOne('1', { name: 'foo', age: 23 })
                .then(result => {
                    // the existing row is re-created (leading to two different operations)
                    // see https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html
                    expect(result.getAffectedItemsCount()).to.equal(2);

                    return collection.find().execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('when debug mode is enabled', () => {
        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'upsert.js');
        const doc = { name: 'foo' };

        it('logs the upsert data', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Insert', script, [schema.getName(), collection.getName(), JSON.stringify(doc)])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudAdd = proc.logs[0];
                    expect(crudAdd.row).to.have.lengthOf(1); // single document
                    return expect(crudAdd.upsert).to.be.true;
                });
        });
    });
});
