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

const Level = require('../../../../lib/logger').Level;
const config = require('../../../config');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');
const path = require('path');
const warnings = require('../../../../lib/constants/warnings');

describe('finding documents in collections using CRUD', () => {
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

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('without criteria', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        context('with a callback', () => {
            it('includes all documents in the collection', () => {
                const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];
                const actual = [];

                return collection.find()
                    .execute(doc => {
                        actual.push(doc);
                    })
                    .then(() => {
                        expect(actual).to.have.lengthOf(expected.length);
                        expect(actual).to.deep.include.all.members(expected);
                    });
            });

            it('does not fail when trying to use a pull-based cursor', () => {
                const noop = () => {};

                return collection.find()
                    .execute(noop)
                    .then(result => {
                        // eslint-disable-next-line no-unused-expressions
                        expect(result.fetchOne()).to.not.exist;
                        expect(result.fetchAll()).to.deep.equal([]);
                    });
            });
        });

        context('without a callback', () => {
            it('returns the first document in the resultset', () => {
                const expected = { _id: '1', name: 'foo' };

                return collection.find()
                    .sort('_id')
                    .execute()
                    .then(result => {
                        let actual = result.fetchOne();
                        expect(actual).to.deep.equal(expected);

                        actual = result.fetchAll();
                        expect(actual).to.have.lengthOf(1);
                    });
            });

            it('returns all documents in the collection', () => {
                const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];

                return collection.find()
                    .execute()
                    .then(result => {
                        let actual = result.fetchAll();
                        expect(actual).to.have.lengthOf(expected.length);
                        expect(actual).to.deep.include.all.members(expected);

                        actual = result.fetchAll();
                        return expect(actual).to.be.empty;
                    });
            });

            it('returns the resultset as an array', () => {
                const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];

                return collection.find()
                    .execute()
                    .then(result => {
                        let actual = result.toArray();
                        expect(actual).to.have.lengthOf(expected.length);
                        expect(actual).to.deep.include.all.members(expected);

                        actual = result.toArray();
                        expect(actual).to.have.lengthOf(expected.length);
                    });
            });
        });
    });

    context('with binding query', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: 'foo', foo: 'bar', size: 42 })
                .add({ _id: 'bar', bar: 'baz', size: 23 })
                .execute();
        });

        it('returns documents that match a criteria specified with named parameter pairs', () => {
            const expected = [{ _id: 'foo', foo: 'bar', size: 42 }];
            const actual = [];

            return collection
                .find('size = :size')
                .bind('size', 42)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns documents that match a criteria specified with a named parameter mapping', () => {
            const expected = [{ _id: 'foo', foo: 'bar', size: 42 }];
            const actual = [];

            return collection
                .find('size = :size')
                .bind({ size: 42 })
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        context('with a list of placeholders', () => {
            it('returns documents that match a criteria specified as a string', async () => {
                const expected = [{ _id: 'foo', foo: 'bar', size: 42 }];

                const got = await collection.find('size in [:s1, :s2, :s3]')
                    .bind({ s1: 42, s2: 50, s3: 57 })
                    .execute();

                expect(got.fetchAll()).to.deep.equal(expected);
            });

            it('returns documents that match a criteria specified as an X DevAPI expression', async () => {
                const expected = [{ _id: 'foo', foo: 'bar', size: 42 }];

                const got = await collection.find(mysqlx.expr('size in [:s1, :s2, :s3]'))
                    .bind({ s1: 42, s2: 50, s3: 57 })
                    .execute();

                expect(got.fetchAll()).to.deep.equal(expected);
            });
        });

        context('with a JSON object containing placeholders', () => {
            it('returns documents that match a criteria specified as a string', async () => {
                const expected = [{ _id: 'foo', foo: 'bar', size: 42 }];

                const got = await collection.find('size in json_extract({ "keys": [:s1, :s2, :s3] }, "$.keys[*]")')
                    .bind({ s1: 42, s2: 50, s3: 57 })
                    .execute();

                expect(got.fetchAll()).to.deep.equal(expected);
            });

            it('returns documents that match a criteria specified as an X DevAPI expression', async () => {
                const expected = [{ _id: 'foo', foo: 'bar', size: 42 }];

                const got = await collection.find(mysqlx.expr('size in json_extract({ "keys": [:s1, :s2, :s3] }, "$.keys[*]")'))
                    .bind({ s1: 42, s2: 50, s3: 57 })
                    .execute();

                expect(got.fetchAll()).to.deep.equal(expected);
            });
        });

        context('BUG#33940584', () => {
            it('fails with the corresponding server error if the placeholder value is not supported', () => {
                return collection.find('size = :size')
                    .bind('size', { size: 42 })
                    .execute()
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        return expect(err.info.code).to.equal(errors.ER_X_EXPR_BAD_VALUE);
                    });
            });
        });
    });

    context('with projection', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', size: 42 })
                .add({ _id: '2', name: 'bar', size: 23 })
                .execute();
        });

        it('includes only columns provided as an expression array', () => {
            const expected = [{ name: 'foo', size: 42 }, { name: 'bar', size: 23 }];
            const actual = [];

            return collection
                .find()
                .fields(['name', 'size'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('includes only columns provided as expression arguments', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];
            const actual = [];

            return collection
                .find()
                .fields('_id', 'name')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('performs computed projections', () => {
            const expected = [{ name: 'bar', newSize: 24 }, { name: 'foo', newSize: 43 }];
            const actual = [];

            return collection
                .find()
                .fields(mysqlx.expr('{ "name": name, "newSize": size + 1 }'))
                .sort('size ASC')
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with aggregations', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ name: 'foo', age: 23, active: true })
                .add({ name: 'bar', age: 42, active: false })
                .add({ name: 'baz', age: 50, active: true })
                .add({ name: 'qux', age: 35, active: false })
                .execute();
        });

        it('includes all the aggregation results', () => {
            const expected = [{ active: true, age: 36.5 }, { active: false, age: 38.5 }];

            return collection.find()
                .fields('active', 'avg(age) as age')
                .groupBy('active')
                .execute()
                .then(res => {
                    expect(res.fetchAll()).to.deep.equal(expected);
                });
        });

        it('includes only the aggregation results that match a given criteria', () => {
            const expected = [{ active: false, age: 38.5 }];

            return collection.find()
                .fields('active', 'avg(age) as age')
                .groupBy('active')
                .having('avg(age) > 37')
                .execute()
                .then(res => {
                    expect(res.fetchAll()).to.deep.equal(expected);
                });
        });
    });

    context('with limit and/or offset', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: 1, name: 'foo' })
                .add({ _id: 2, name: 'bar' })
                .add({ _id: 3, name: 'baz' })
                .add({ _id: 4, name: 'qux' })
                .add({ _id: 5, name: 'quux' })
                .execute();
        });

        it('returns a given number of documents specified with a JavaScript number', () => {
            const expected = [{ _id: 1, name: 'foo' }, { _id: 2, name: 'bar' }, { _id: 3, name: 'baz' }];
            const actual = [];

            return collection
                .find()
                .limit(3)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns a given number of documents specified with a JavaScript string', () => {
            const expected = [{ _id: 1, name: 'foo' }, { _id: 2, name: 'bar' }, { _id: 3, name: 'baz' }];
            const actual = [];

            return collection
                .find()
                .limit('3')
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns a given number of documents specified with a JavaScript BigInt', () => {
            const expected = [{ _id: 1, name: 'foo' }, { _id: 2, name: 'bar' }, { _id: 3, name: 'baz' }];
            const actual = [];

            return collection
                .find()
                .limit(3n)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns the documents after a given offset specified with a JavaScript number', () => {
            const expected = [{ _id: 3, name: 'baz' }, { _id: 4, name: 'qux' }];
            const actual = [];

            return collection
                .find()
                .limit(2)
                .offset(2)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns the documents after a given offset specified with a JavaScript string', () => {
            const expected = [{ _id: 3, name: 'baz' }, { _id: 4, name: 'qux' }];
            const actual = [];

            return collection
                .find()
                .limit(2)
                .offset('2')
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns the documents after a given offset specified with a JavaScript BigInt', () => {
            const expected = [{ _id: 3, name: 'baz' }, { _id: 4, name: 'qux' }];
            const actual = [];

            return collection
                .find()
                .limit(2)
                .offset(2n)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        context('when an offset is provided using the limit() method', () => {
            it('writes a deprecation warning to the log when debug mode is enabled', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'find-with-limit-offset.js');

                return fixtures.collectLogs('api.limit', script, [schema.getName(), collection.getName(), 1, 1], { level: Level.WARNING })
                    .then(proc => {
                        expect(proc.logs).to.have.lengthOf(1);
                        return expect(proc.logs[0]).to.equal(warnings.MESSAGES.WARN_DEPRECATED_LIMIT_WITH_OFFSET);
                    });
            });

            it('writes a deprecation warning to stdout when debug mode is not enabled', done => {
                process.on('warning', warning => {
                    if ((!warning.name || warning.name !== warnings.TYPES.DEPRECATION) || (!warning.code || !warning.code.startsWith(warnings.CODES.DEPRECATION))) {
                        return;
                    }

                    process.removeAllListeners('warning');
                    expect(warning.message).to.equal(warnings.MESSAGES.WARN_DEPRECATED_LIMIT_WITH_OFFSET);

                    return done();
                });

                collection.find()
                    .limit(2, 3)
                    .execute();
            });
        });

        context('when the setCount() method is used', () => {
            it('writes a deprecation warning to stdout', done => {
                process.on('warning', warning => {
                    if ((!warning.name || warning.name !== warnings.TYPES.DEPRECATION) || (!warning.code || !warning.code.startsWith(warnings.CODES.DEPRECATION))) {
                        return;
                    }

                    process.removeAllListeners('warning');
                    expect(warning.message).to.equal(warnings.MESSAGES.WARN_DEPRECATED_LIMIT_SET_COUNT);

                    return done();
                });

                collection.find()
                    .setCount(1)
                    .execute();
            });
        });
    });

    context('single document retrieval', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: 2, name: 'bar' })
                .execute();
        });

        context('when a document with a given id exists', () => {
            it('returns the document if _id is a String', () => {
                const expected = { _id: '1', name: 'foo' };

                return collection.getOne('1')
                    .then(doc => expect(doc).to.deep.equal(expected));
            });

            it('returns the document if _id is not a String', () => {
                const expected = { _id: 2, name: 'bar' };

                return collection.getOne(2)
                    .then(doc => expect(doc).to.deep.equal(expected));
            });
        });

        context('when a document with a given id does not exist', () => {
            it('returns null if the given id is a non-empty String', () => {
                return collection.getOne('3')
                    .then(doc => expect(doc).to.be.null);
            });

            it('returns null if a document id is an empty String', () => {
                return collection.getOne('')
                    .then(doc => expect(doc).to.be.null);
            });

            it('returns null if a document id is null', () => {
                return collection.getOne(null)
                    .then(doc => expect(doc).to.be.null);
            });

            it('returns null if a document id is not defined', () => {
                return collection.getOne()
                    .then(doc => expect(doc).to.be.null);
            });
        });
    });

    context('predicate expressions', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', list: [1, 4] })
                .add({ _id: '2', name: 'bar', list: [4, 7] })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        context('where the property value', () => {
            it('is part of a set of values being provided', () => {
                const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
                const actual = [];

                return collection.find("_id in ('1', '3')")
                    .fields('_id', 'name')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });

            it('is not part of a set of values being provided', () => {
                const expected = [{ _id: '2', name: 'bar' }];
                const actual = [];

                return collection.find("_id not in ('1', '3')")
                    .fields('_id', 'name')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('where a list of values being provided', () => {
            it('overlaps a list of values of a given document property', () => {
                const expected = [{ _id: '1' }];
                const actual = [];

                return collection.find('[1, 2, 3] OVERLAPS list')
                    .fields('_id')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });

            it('does not overlap a list of values of a given document property', () => {
                const expected = [{ _id: '1' }];
                const actual = [];

                return collection.find('[6, 7] NOT OVERLAPS list')
                    .fields('_id')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('where a list of values of a given document property', () => {
            it('overlaps a list of values being provided', () => {
                const expected = [{ _id: '1' }, { _id: '2' }];
                const actual = [];

                return collection.find('list OVERLAPS [4]')
                    .fields('_id')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });

            it('does not overlap a list of values being provided', () => {
                const expected = [{ _id: '1' }, { _id: '2' }];
                const actual = [];

                return collection.find('list NOT OVERLAPS [8, 9]')
                    .fields('_id')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });
    });

    context('sorting results', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', age: 23 })
                .add({ _id: '2', name: 'bar', age: 42 })
                .add({ _id: '3', name: 'baz', age: 23 })
                .execute();
        });

        it('sorts the results according the order clauses provided as an expression array', () => {
            const expected = [{ _id: '3', name: 'baz', age: 23 }, { _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar', age: 42 }];
            const actual = [];

            return collection.find()
                .sort(['age ASC', 'name ASC'])
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('sorts the results according the order clauses provided as expression arguments', () => {
            const expected = [{ _id: '2', name: 'bar', age: 42 }, { _id: '3', name: 'baz', age: 23 }, { _id: '1', name: 'foo', age: 23 }];
            const actual = [];

            return collection.find()
                .sort('age DESC', 'name ASC')
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#29766014', () => {
        const now = new Date();

        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', updatedAt: now })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        it('does not fail when a placeholder is assigned a JavaScript Date instance', () => {
            const updatedAt = now.toJSON().substring(0, now.toJSON().length - 1).concat('+00:00');
            const expected = [{ _id: '1', name: 'foo', updatedAt }];
            const actual = [];

            return collection.find('updatedAt = :date')
                .bind('date', updatedAt)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#29807792', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ name: 'foo', age: 42 })
                .add({ name: 'bar', age: 23 })
                .execute();
        });

        it('correctly encodes cast types', () => {
            const expected = [{ name: 'foo' }];
            const actual = [];

            return collection.find("CAST('42' AS UNSIGNED INTEGER) = age")
                .fields('name')
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#34728259', () => {
        const signedBigInt = '-9223372036854775808';
        const unsignedBigInt = '18446744073709551615';

        beforeEach('populate collection', () => {
            return session.sql(`INSERT INTO \`${schema.getName()}\`.\`${collection.getName()}\` (doc) VALUES ('{ "_id": "1", "signedBigInt": ${signedBigInt}, "unsignedBigInt": ${unsignedBigInt} }')`)
                .execute();
        });

        it('returns unsafe numeric field values as strings', () => {
            return collection.find()
                .fields('signedBigInt', 'unsignedBigInt')
                .execute()
                .then(res => {
                    return expect(res.fetchOne()).to.deep.equal({ signedBigInt, unsignedBigInt });
                });
        });
    });

    context('upstream numeric values specified with a JavaScript BigInt', () => {
        const unsafeNegative = '-9223372036854775808';
        const unsafePositive = '18446744073709551615';

        beforeEach('populate the collection', async () => {
            await collection.add({ unsafeNegative: BigInt(unsafeNegative), unsafePositive: BigInt(unsafePositive) })
                .execute();
        });

        context('in the statements created by the application', () => {
            it('do not lose precision in filtering criteria placeholder assignments', async () => {
                const want = { unsafeNegative, unsafePositive };

                const res = await collection.find('unsafeNegative = :negative AND unsafePositive = :positive')
                    .bind('negative', BigInt(unsafeNegative))
                    .bind('positive', BigInt(unsafePositive))
                    .fields('unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                expect(got).to.deep.equal(want);
            });
        });
    });

    context('integer values in a result set', () => {
        const safeNegative = Number.MIN_SAFE_INTEGER + 1;
        const safePositive = Number.MAX_SAFE_INTEGER - 1;
        const unsafeNegative = '-9223372036854775808';
        const unsafePositive = '18446744073709551615';

        beforeEach('populate the collection', async () => {
            await collection.add({ safeNegative, safePositive, unsafeNegative: BigInt(unsafeNegative), unsafePositive: BigInt(unsafePositive) })
                .execute();
        });

        context('consumed using a pull-based cursor', () => {
            it('can always be decoded as a JavaScript string', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = { safeNegative: `${safeNegative}`, safePositive: `${safePositive}`, unsafeNegative, unsafePositive };

                const res = await session.getDefaultSchema().getCollection(collection.getName())
                    .find()
                    .fields('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can always be decoded as a JavaScript BigInt', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = { safeNegative: BigInt(safeNegative), safePositive: BigInt(safePositive), unsafeNegative: BigInt(unsafeNegative), unsafePositive: BigInt(unsafePositive) };

                const res = await session.getDefaultSchema().getCollection(collection.getName())
                    .find()
                    .fields('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript string only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = { safeNegative, safePositive, unsafeNegative: `${unsafeNegative}`, unsafePositive: `${unsafePositive}` };

                const res = await session.getDefaultSchema().getCollection(collection.getName())
                    .find()
                    .fields('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript BigInt only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = { safeNegative, safePositive, unsafeNegative: BigInt(unsafeNegative), unsafePositive: BigInt(unsafePositive) };

                const res = await session.getDefaultSchema().getCollection(collection.getName())
                    .find()
                    .fields('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('are decoded by default as a JavaScript string when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, schema: schema.getName() };
                const session = await mysqlx.getSession(itConfig);
                const want = { safeNegative, safePositive, unsafeNegative: `${unsafeNegative}`, unsafePositive: `${unsafePositive}` };

                const res = await session.getDefaultSchema().getCollection(collection.getName())
                    .find()
                    .fields('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute();

                const got = res.fetchOne();

                await session.close();

                expect(got).to.deep.equal(want);
            });
        });

        context('consumed using a push-based cursor', () => {
            it('can always be decoded as a JavaScript string', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(`mysqlx://${itConfig.user}:${itConfig.password}@${itConfig.host}:${itConfig.port}/${itConfig.schema}?integer-type=${itConfig.integerType}`);
                const want = [{ safeNegative: `${safeNegative}`, safePositive: `${safePositive}`, unsafeNegative, unsafePositive }];
                const got = [];

                await session.getDefaultSchema().getCollection(collection.getName())
                    .find()
                    .fields('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute(doc => got.push(doc));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can always be decoded as a JavaScript BigInt', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(`mysqlx://${itConfig.user}:${itConfig.password}@${itConfig.host}:${itConfig.port}/${itConfig.schema}?integer-type=${itConfig.integerType}`);
                const want = [{ safeNegative: BigInt(safeNegative), safePositive: BigInt(safePositive), unsafeNegative: BigInt(unsafeNegative), unsafePositive: BigInt(unsafePositive) }];
                const got = [];

                await session.getDefaultSchema().getCollection(collection.getName())
                    .find()
                    .fields('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute(doc => got.push(doc));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript string only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_STRING, schema: schema.getName() };
                const session = await mysqlx.getSession(`mysqlx://${itConfig.user}:${itConfig.password}@${itConfig.host}:${itConfig.port}/${itConfig.schema}?integer-type=${itConfig.integerType}`);
                const want = [{ safeNegative, safePositive, unsafeNegative: `${unsafeNegative}`, unsafePositive: `${unsafePositive}` }];
                const got = [];

                await session.getDefaultSchema().getCollection(collection.getName())
                    .find()
                    .fields('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute(doc => got.push(doc));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('can be decoded as a JavaScript BigInt only when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.UNSAFE_BIGINT, schema: schema.getName() };
                const session = await mysqlx.getSession(`mysqlx://${itConfig.user}:${itConfig.password}@${itConfig.host}:${itConfig.port}/${itConfig.schema}?integer-type=${itConfig.integerType}`);
                const want = [{ safeNegative, safePositive, unsafeNegative: BigInt(unsafeNegative), unsafePositive: BigInt(unsafePositive) }];
                const got = [];

                await session.getDefaultSchema().getCollection(collection.getName())
                    .find()
                    .fields('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute(doc => got.push(doc));

                await session.close();

                expect(got).to.deep.equal(want);
            });

            it('are decoded by default as a JavaScript string when they lose precision', async () => {
                const itConfig = { ...config, ...baseConfig, schema: schema.getName() };
                const session = await mysqlx.getSession(`mysqlx://${itConfig.user}:${itConfig.password}@${itConfig.host}:${itConfig.port}/${itConfig.schema}?integer-type=${itConfig.integerType}`);
                const want = [{ safeNegative, safePositive, unsafeNegative: `${unsafeNegative}`, unsafePositive: `${unsafePositive}` }];
                const got = [];

                await session.getDefaultSchema().getCollection(collection.getName())
                    .find()
                    .fields('safeNegative', 'safePositive', 'unsafeNegative', 'unsafePositive')
                    .execute(doc => got.push(doc));

                await session.close();

                expect(got).to.deep.equal(want);
            });
        });
    });

    context('when debug mode is enabled', () => {
        beforeEach('populate collection', () => {
            return collection.add({ name: 'foo', count: 2 })
                .add({ name: 'bar', count: 5 })
                .add({ name: 'foo', count: 10 })
                .execute();
        });

        it('logs the basic operation parameters', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'find.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), collection.getName()])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('collection', 'data_model');
                    expect(crudFind.collection).to.contain.keys('name', 'schema');
                    expect(crudFind.collection.name).to.equal(collection.getName());
                    expect(crudFind.collection.schema).to.equal(schema.getName());
                    expect(crudFind.data_model).to.equal('DOCUMENT');
                });
        });

        it('logs the criteria statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'find-with-criteria.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), collection.getName(), 'name = :v', 'v', 'foo'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('criteria', 'args');
                    expect(crudFind.criteria).to.contain.keys('type', 'operator');
                    expect(crudFind.criteria.type).to.equal('OPERATOR');
                    expect(crudFind.criteria.operator).to.contain.keys('name', 'param');
                    expect(crudFind.criteria.operator.name).to.equal('==');
                    expect(crudFind.criteria.operator.param).to.be.an('array').and.have.lengthOf(2);
                    expect(crudFind.criteria.operator.param[0]).to.contain.keys('type', 'identifier');
                    expect(crudFind.criteria.operator.param[0].type).to.equal('IDENT');
                    expect(crudFind.criteria.operator.param[0].identifier).contain.keys('document_path');
                    expect(crudFind.criteria.operator.param[0].identifier.document_path).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.criteria.operator.param[0].identifier.document_path[0]).to.contain.keys('type', 'value');
                    expect(crudFind.criteria.operator.param[0].identifier.document_path[0].type).to.equal('MEMBER');
                    expect(crudFind.criteria.operator.param[0].identifier.document_path[0].value).to.equal('name');
                    expect(crudFind.criteria.operator.param[1]).to.contain.keys('type', 'position');
                    expect(crudFind.criteria.operator.param[1].type).to.equal('PLACEHOLDER');
                    expect(crudFind.criteria.operator.param[1].position).to.equal(0);
                    expect(crudFind.args).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.args[0]).to.contain.keys('type', 'v_string');
                    expect(crudFind.args[0].type).to.equal('V_STRING');
                    expect(crudFind.args[0].v_string).to.contain.keys('value');
                    expect(crudFind.args[0].v_string.value).to.equal('foo');
                });
        });

        it('logs the projection statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'find-with-projection.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), collection.getName(), 'name AS col'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('projection');
                    expect(crudFind.projection).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.projection[0]).contain.keys('source', 'alias');
                    expect(crudFind.projection[0].source).to.contain.keys('type', 'identifier');
                    expect(crudFind.projection[0].source.type).to.equal('IDENT');
                    expect(crudFind.projection[0].source.identifier.document_path).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.projection[0].source.identifier.document_path[0]).to.contain.keys('type', 'value');
                    expect(crudFind.projection[0].source.identifier.document_path[0].type).to.equal('MEMBER');
                    expect(crudFind.projection[0].source.identifier.document_path[0].value).to.equal('name');
                    expect(crudFind.projection[0].alias).to.equal('col');
                });
        });

        it('logs the order statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'find-with-order.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), collection.getName(), 'count DESC'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('order');
                    expect(crudFind.order).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.order[0]).to.contain.keys('expr', 'direction');
                    expect(crudFind.order[0].expr).to.contain.keys('type', 'identifier');
                    expect(crudFind.order[0].expr.type).to.equal('IDENT');
                    expect(crudFind.order[0].expr.identifier).to.contain.keys('document_path');
                    expect(crudFind.order[0].expr.identifier.document_path).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.order[0].expr.identifier.document_path[0]).to.contain.keys('type', 'value');
                    expect(crudFind.order[0].expr.identifier.document_path[0].type).to.equal('MEMBER');
                    expect(crudFind.order[0].expr.identifier.document_path[0].value).to.equal('count');
                });
        });

        it('logs the grouping statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'find-with-grouping.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), collection.getName(), 'count'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('grouping');
                    expect(crudFind.grouping).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.grouping[0]).to.contain.keys('type', 'identifier');
                    expect(crudFind.grouping[0].type).equal('IDENT');
                    expect(crudFind.grouping[0].identifier).to.contain.keys('document_path');
                    expect(crudFind.grouping[0].identifier.document_path).to.be.an('array');
                    expect(crudFind.grouping[0].identifier.document_path[0]).to.contain.keys('type', 'value');
                    expect(crudFind.grouping[0].identifier.document_path[0].type).to.equal('MEMBER');
                    expect(crudFind.grouping[0].identifier.document_path[0].value).to.equal('count');
                });
        });

        it('logs the grouping criteria statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'find-with-grouping-criteria.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), collection.getName(), 'SUM(count)', 'name', 'SUM(count) > 2'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('grouping_criteria');
                    expect(crudFind.grouping_criteria).to.contain.keys('type', 'operator');
                    expect(crudFind.grouping_criteria.type).equal('OPERATOR');
                    expect(crudFind.grouping_criteria.operator).to.contain.keys('name', 'param');
                    expect(crudFind.grouping_criteria.operator.name).to.equal('>');
                    expect(crudFind.grouping_criteria.operator.param).to.be.an('array').and.have.lengthOf(2);
                    expect(crudFind.grouping_criteria.operator.param[0]).to.contain.keys('type', 'function_call');
                    expect(crudFind.grouping_criteria.operator.param[0].type).to.equal('FUNC_CALL');
                    expect(crudFind.grouping_criteria.operator.param[0].function_call).to.contain.keys('name', 'param');
                    expect(crudFind.grouping_criteria.operator.param[0].function_call.name).to.contain.keys('name');
                    expect(crudFind.grouping_criteria.operator.param[0].function_call.name.name).to.equal('SUM');
                    expect(crudFind.grouping_criteria.operator.param[0].function_call.param).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.grouping_criteria.operator.param[0].function_call.param[0]).to.contain.keys('type', 'identifier');
                    expect(crudFind.grouping_criteria.operator.param[0].function_call.param[0].type).to.equal('IDENT');
                    expect(crudFind.grouping_criteria.operator.param[0].function_call.param[0].identifier).to.contain.keys('document_path');
                    expect(crudFind.grouping_criteria.operator.param[0].function_call.param[0].identifier.document_path).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.grouping_criteria.operator.param[0].function_call.param[0].identifier.document_path[0]).to.contain.keys('type', 'value');
                    expect(crudFind.grouping_criteria.operator.param[0].function_call.param[0].identifier.document_path[0].type).to.equal('MEMBER');
                    expect(crudFind.grouping_criteria.operator.param[0].function_call.param[0].identifier.document_path[0].value).to.equal('count');
                    expect(crudFind.grouping_criteria.operator.param[1]).to.contain.keys('type', 'literal');
                    expect(crudFind.grouping_criteria.operator.param[1].type).to.equal('LITERAL');
                    expect(crudFind.grouping_criteria.operator.param[1].literal).to.contain.keys('type', 'v_unsigned_int');
                    expect(crudFind.grouping_criteria.operator.param[1].literal.type).to.equal('V_UINT');
                    expect(crudFind.grouping_criteria.operator.param[1].literal.v_unsigned_int).to.equal(2);
                });
        });

        it('logs the correct locking parameters', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'find-with-locking.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), collection.getName(), mysqlx.LockContention.NOWAIT])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('locking', 'locking_options');
                    expect(crudFind.locking).to.equal('EXCLUSIVE_LOCK');
                    expect(crudFind.locking_options).to.equal('NOWAIT');
                });
        });

        it('logs limit parameters specified with a JavaScript number', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'find-with-limit.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), collection.getName(), 1, 1])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('limit');
                    expect(crudFind.limit).to.contain.keys('row_count', 'offset');
                    expect(crudFind.limit.row_count).to.equal(1);
                    expect(crudFind.limit.offset).to.equal(1);
                });
        });

        it('logs the result set row data sent by the server', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'find-with-projection.js');

            return fixtures.collectLogs('protocol:inbound:Mysqlx.Resultset.Row', script, [schema.getName(), collection.getName(), 'name'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(3); // number of rows

                    const rows = proc.logs;
                    rows.forEach(row => expect(row).to.contain.keys('fields'));
                    expect(rows[0].fields).to.deep.equal([{ name: 'foo' }]);
                    expect(rows[1].fields).to.deep.equal([{ name: 'bar' }]);
                    expect(rows[2].fields).to.deep.equal([{ name: 'foo' }]);
                });
        });
    });
});
