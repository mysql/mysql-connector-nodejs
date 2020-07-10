'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');

describe('adding documents to a collection', () => {
    let schema, session, collection;

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
        return schema.createCollection('test')
            .then(c => {
                collection = c;
            });
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('with a single call', () => {
        it('saves documents provided as an array', () => {
            const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];
            let actual = [];

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
            let actual = [];

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

    context('with multiple calls', () => {
        it('saves documents provided as an array', () => {
            const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }, { name: 'baz', age: 50 }];
            let actual = [];

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
            let actual = [];

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

                    /* eslint-disable node/no-deprecated-api */
                    const firstId = new Buffer(actual[0]._id, 'hex');
                    const lastId = new Buffer(actual[1]._id, 'hex');
                    /* eslint-enable node/no-deprecated-api */

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

    context('BUG#29179767 JavaScript Date converted to empty object', () => {
        it('saves a JavaScript Date as a valid JSON value', () => {
            const now = new Date();
            const expected = [{ createdAt: now.toJSON() }];
            const actual = [];

            return collection.add({ name: 'foo', createdAt: now })
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
