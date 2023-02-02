/*
 * Copyright (c) 2020, 2023, Oracle and/or its affiliates.
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
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');

describe('adding documents to a collection using CRUD', () => {
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

    context('with a single call', () => {
        context('using JavaScript Object literals', () => {
            it('saves documents provided as an array', () => {
                const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];
                const actual = [];

                return collection
                    .add(documents)
                    .execute()
                    .then(() => collection.find().execute(doc => actual.push(doc)))
                    .then(() => {
                        expect(actual).to.have.lengthOf(documents.length);
                        actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'age', 'name'));
                    });
            });

            it('saves documents provided as multiple arguments', () => {
                const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];
                const actual = [];

                return collection
                    .add(documents[0], documents[1])
                    .execute()
                    .then(() => collection.find().execute(doc => actual.push(doc)))
                    .then(() => {
                        expect(actual).to.have.lengthOf(documents.length);
                        actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'age', 'name'));
                    });
            });
        });

        context('using JSON strings', () => {
            it('saves documents provided as an array', () => {
                const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];

                return collection
                    .add(documents.map(d => JSON.stringify(d)))
                    .execute()
                    .then(() => collection.find().execute())
                    .then(res => {
                        res.fetchAll().forEach((doc, i) => {
                            expect(doc.name).to.equal(documents[i].name);
                            expect(doc.age).to.equal(documents[i].age);
                        });
                    });
            });

            it('saves documents provided as multiple arguments', () => {
                const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];

                return collection
                    .add(JSON.stringify(documents[0]), JSON.stringify(documents[1]))
                    .execute()
                    .then(() => collection.find().execute())
                    .then(res => {
                        res.fetchAll().forEach((doc, i) => {
                            expect(doc.name).to.equal(documents[i].name);
                            expect(doc.age).to.equal(documents[i].age);
                        });
                    });
            });
        });

        context('using X DevAPI expressions', () => {
            it('saves documents provided as an array', () => {
                const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];

                return collection
                    .add(documents.map(d => mysqlx.expr(JSON.stringify(d))))
                    .execute()
                    .then(() => collection.find().execute())
                    .then(res => {
                        res.fetchAll().forEach((doc, i) => {
                            expect(doc.name).to.equal(documents[i].name);
                            expect(doc.age).to.equal(documents[i].age);
                        });
                    });
            });

            it('saves documents provided as multiple arguments', () => {
                const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];

                return collection
                    .add(mysqlx.expr(JSON.stringify(documents[0])), mysqlx.expr(JSON.stringify(documents[1])))
                    .execute()
                    .then(() => collection.find().execute())
                    .then(res => {
                        res.fetchAll().forEach((doc, i) => {
                            expect(doc.name).to.equal(documents[i].name);
                            expect(doc.age).to.equal(documents[i].age);
                        });
                    });
            });
        });
    });

    context('with multiple calls', () => {
        it('saves documents provided as an array', () => {
            const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }, { name: 'baz', age: 50 }];
            const actual = [];

            return collection
                .add(documents[0])
                .add([documents[1], documents[2]])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'age', 'name'));
                });
        });

        it('saves documents provided as multiple arguments', () => {
            const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }, { name: 'baz', age: 50 }];
            const actual = [];

            return collection
                .add(documents[0])
                .add(documents[1], documents[2])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'age', 'name'));
                });
        });
    });

    context('with an empty array', () => {
        it('does not throw an error if the collection exists', () => {
            return collection.add([]).execute();
        });

        it('does not throw an error if the collection does not exist', () => {
            return schema.dropCollection('test')
                .then(() => collection.add([]).execute());
        });
    });

    context('uuid generation', () => {
        it('generates a UUID as the document id by default', () => {
            const actual = [];

            return collection
                .add({ name: 'foo' })
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual[0]._id).to.match(/^[a-f0-9]{28,32}$/));
        });

        it('does not generate a UUID if the document already provides an id', () => {
            const documents = [{ _id: '1', name: 'foo' }];
            const actual = [];

            return collection
                .add(documents[0])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(documents));
        });

        it('generates the random node identifier once per session', () => {
            const actual = [];

            return collection
                .add([{ name: 'foo' }, { name: 'bar' }])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual[0]._id.substring(0, 12)).to.equal(actual[1]._id.substring(0, 12)));
        });

        it('generates sequential UUIDs if some documents already provide an id', () => {
            const documents = [{ name: 'foo' }, { _id: '1', name: 'bar' }, { name: 'baz' }];
            const actual = [];

            return collection
                .add(documents[0])
                .execute()
                .then(() => collection.add(documents[1]).execute())
                .then(() => collection.add(documents[2]).execute())
                .then(() => {
                    return collection
                        .find('name = "foo" OR name = "baz"')
                        .sort('name DESC')
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => {
                    expect(actual).to.have.lengthOf(2);

                    const firstId = Buffer.from(actual[0]._id, 'hex');
                    const lastId = Buffer.from(actual[1]._id, 'hex');

                    expect(firstId.readUInt8(firstId.length - 1)).to.equal(lastId.readUInt8(lastId.length - 1) - 1);
                });
        });

        it('returns the list of server generated ids on the result', () => {
            const documents = [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }];
            const actual = [];

            let ids = [];

            return collection.add(documents)
                .execute()
                .then(result => {
                    ids = result.getGeneratedIds();
                })
                .then(() => {
                    return collection.find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => {
                    expect(actual.map(doc => doc._id)).to.deep.equal(ids);
                });
        });
    });

    // JavaScript can happily store Number.MAX_SAFE_INTEGER + 1 and Number.MAX_SAFE_INTEGER - 1.
    context('unsafe numeric values', () => {
        context('specified using a JavaScript string', () => {
            it('saves values of plain JavaScript object fields without losing precision', async () => {
                const unsafePositive = Number.MAX_SAFE_INTEGER + 1;
                const unsafeNegative = Number.MIN_SAFE_INTEGER - 1;
                const doc = { unsafePositive, unsafeNegative };
                const want = { unsafePositive: `${unsafePositive}`, unsafeNegative: `${unsafeNegative}` };

                await collection.add(doc)
                    .execute();

                const res = await collection.find()
                    .fields('unsafePositive', 'unsafeNegative')
                    .execute();

                expect(res.fetchOne()).to.deep.equal(want);
            });

            it('BUG#34767204 saves values of JSON string fields without losing precision', async () => {
                const signedBigInt = '-9223372036854775808';
                const unsafeDecimal = '9.9999999999999999';
                const unsignedBigInt = '18446744073709551615';
                const doc = `{ "signedBigInt": ${signedBigInt}, "unsafeDecimal": ${unsafeDecimal}, "unsignedBigInt": ${unsignedBigInt} }`;
                const want = { signedBigInt, unsafeDecimal, unsignedBigInt };

                await collection.add(doc)
                    .execute();

                const res = await collection.find()
                    .fields('signedBigInt', 'unsignedBigInt', 'unsafeDecimal')
                    .execute();

                expect(res.fetchOne()).to.deep.equal(want);
            });
        });

        context('specified using a JavaScript BigInt', () => {
            it('saves values of plain JavaScript object fields without losing precision', async () => {
                const unsafeNegative = BigInt('-9223372036854775808');
                const unsafePositive = BigInt('18446744073709551615');
                const doc = { unsafePositive, unsafeNegative };
                const want = { unsafePositive: `${unsafePositive}`, unsafeNegative: `${unsafeNegative}` };

                await collection.add(doc)
                    .execute();

                const res = await collection.find()
                    .fields('unsafePositive', 'unsafeNegative')
                    .execute();

                expect(res.fetchOne()).to.deep.equal(want);
            });

            it('saves values of JSON string fields without losing precision', async () => {
                const unsafeNegative = BigInt('-9223372036854775808');
                const unsafePositive = BigInt('18446744073709551615');
                const doc = `{ "unsafePositive": ${unsafePositive}, "unsafeNegative": ${unsafeNegative} }`;
                const want = { unsafePositive: `${unsafePositive}`, unsafeNegative: `${unsafeNegative}` };

                await collection.add(doc)
                    .execute();

                const res = await collection.find()
                    .fields('unsafePositive', 'unsafeNegative')
                    .execute();

                expect(res.fetchOne()).to.deep.equal(want);
            });
        });
    });

    context('BUG#29179767 JavaScript Date converted to empty object', () => {
        it('saves a JavaScript Date as a valid JSON value', () => {
            const now = (new Date()).toJSON();
            const createdAt = now.substring(0, now.length - 1).concat('+00:00');
            const expected = [{ createdAt }];
            const actual = [];

            return collection.add({ name: 'foo', createdAt })
                .execute()
                .then(() => {
                    return collection.find('name = :name')
                        .fields('createdAt')
                        .bind('name', 'foo')
                        .execute(doc => actual.push(doc));
                })
                .then(() => {
                    expect(actual).to.deep.equal(expected);
                });
        });
    });

    context('BUG#30401962 affected items', () => {
        it('returns the number of documents that have been added to a collection', () => {
            const documents = [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }];
            const expected = documents.length;

            return collection.add(documents)
                .execute()
                .then(res => expect(res.getAffectedItemsCount()).to.equal(expected));
        });
    });

    context('unsafe number of affected items', () => {
        it('returns the number of documents as a JavaScript string', async () => {
            const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.STRING, schema: schema.getName() };
            const documents = [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }];
            const want = documents.length.toString();

            const session = await mysqlx.getSession(itConfig);
            const res = await session.getDefaultSchema().getCollection(collection.getName()).add(documents)
                .execute();

            const got = res.getAffectedItemsCount();

            await session.close();

            expect(got).to.equal(want);
        });

        it('returns the number of documents as a JavaScript BigInt', async () => {
            const itConfig = { ...config, ...baseConfig, integerType: mysqlx.IntegerType.BIGINT, schema: schema.getName() };
            const documents = [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }];
            const want = BigInt(documents.length);

            const session = await mysqlx.getSession(itConfig);
            const res = await session.getDefaultSchema().getCollection(collection.getName()).add(documents)
                .execute();

            const got = res.getAffectedItemsCount();

            await session.close();

            expect(got).to.equal(want);
        });
    });

    context('BUG#34959626 argument type strictness', () => {
        it('ignores values of unknown type', async () => {
            // e.g. JavaScript functions should be ignored
            const ignored = () => {};
            const want = { _id: '1', name: 'foo', nested: {} };

            await collection.add({ ...want, ignored, nested: { ignored } })
                .execute();

            const res = await collection.find()
                .execute();

            const got = res.fetchOne();
            expect(got).to.deep.equal(want);
        });
    });

    context('when debug mode is enabled', () => {
        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'add.js');
        const docs = [{ name: 'foo', count: 2 }, { name: 'bar', count: 5 }];

        it('logs the basic operation parameters', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Insert', script, [schema.getName(), collection.getName(), JSON.stringify(docs)])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudAdd = proc.logs[0];
                    expect(crudAdd).to.contain.keys('collection', 'data_model');
                    expect(crudAdd.collection).to.contain.keys('name', 'schema');
                    expect(crudAdd.collection.name).to.equal(collection.getName());
                    expect(crudAdd.collection.schema).to.equal(schema.getName());
                    expect(crudAdd.data_model).to.equal('DOCUMENT');
                });
        });

        it('logs the row data', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Insert', script, [schema.getName(), collection.getName(), JSON.stringify(docs)])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudAdd = proc.logs[0];
                    expect(crudAdd).to.contain.keys('row');
                    expect(crudAdd.row).to.be.an('array').and.have.lengthOf(docs.length);

                    const rows = crudAdd.row;
                    rows.forEach(row => {
                        expect(row).to.have.keys('field');
                        expect(row.field).to.be.an('array').and.have.lengthOf(1); // each doc is kind-of-a colum
                        expect(row.field[0]).to.have.keys('type', 'object');
                        expect(row.field[0].type).to.equal('OBJECT');
                        expect(row.field[0].object).to.have.keys('fld');
                        expect(row.field[0].object.fld).to.be.an('array').and.have.lengthOf(2); // number of properties in each doc
                    });

                    const fields = rows[0].field[0].object.fld;
                    fields.forEach(field => {
                        expect(field).to.have.keys('key', 'value');
                        expect(field.value).to.have.keys('type', 'literal');
                        expect(field.value.type).to.equal('LITERAL');
                    });

                    expect(fields[0].key).to.equal('name');
                    expect(fields[0].value.literal).to.have.keys('type', 'v_string');
                    expect(fields[0].value.literal.type).to.equal('V_STRING');
                    expect(fields[0].value.literal.v_string).to.have.keys('value');
                    expect(fields[0].value.literal.v_string.value).to.equal('foo');

                    expect(fields[1].key).to.equal('count');
                    expect(fields[1].value.literal).to.have.keys('type', 'v_unsigned_int');
                    expect(fields[1].value.literal.type).to.equal('V_UINT');
                    expect(fields[1].value.literal.v_unsigned_int).to.equal(2);
                });
        });

        it('logs the table changes metadata', () => {
            return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [schema.getName(), collection.getName(), JSON.stringify(docs)])
                .then(proc => {
                    // LOCAL notices are decoded twice (needs to be improved)
                    // so there are no assurances about the correct length
                    expect(proc.logs).to.have.length.above(0);

                    const generatedIdsNotice = proc.logs[proc.logs.length - 1];
                    expect(generatedIdsNotice).to.have.keys('type', 'scope', 'payload');
                    expect(generatedIdsNotice.type).to.equal('SESSION_STATE_CHANGED');
                    expect(generatedIdsNotice.scope).to.equal('LOCAL');
                    expect(generatedIdsNotice.payload).to.have.keys('param', 'value');
                    expect(generatedIdsNotice.payload.param).to.equal('GENERATED_DOCUMENT_IDS');
                    expect(generatedIdsNotice.payload.value).to.be.an('array').and.have.lengthOf(2);

                    const ids = generatedIdsNotice.payload.value;
                    ids.forEach(id => {
                        expect(id).to.have.keys('type', 'v_octets');
                        expect(id.type).to.equal('V_OCTETS');
                        expect(id.v_octets).to.have.keys('value');
                        expect(id.v_octets.value).to.have.keys('type', 'data');
                        expect(id.v_octets.value.type).to.equal('Buffer');
                    });
                });
        });
    });
});
