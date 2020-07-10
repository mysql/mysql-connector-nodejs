'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');

describe('modifying documents in a collection', () => {
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

    context('with truthy condition', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        it('updates properties of all documents in a collection', () => {
            const expected = [{ _id: '1', name: 'qux' }, { _id: '2', name: 'qux' }];
            let actual = [];

            return collection.modify('true')
                .set('name', 'qux')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('removes properties of all documents in a collection', () => {
            const expected = [{ _id: '1' }, { _id: '2' }];
            let actual = [];

            return collection.modify('true')
                .unset('name')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with filtering condition', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('updates properties of the documents from a collection that match the criteria', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'qux' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .modify('name = "bar"')
                .set('name', 'qux')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('removes properties of the documents from a collection that match the criteria', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .modify('name = "bar"')
                .unset('name')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('modifies a given number of documents', () => {
            const expected = [{ _id: '1', name: 'qux' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection.modify('true')
                .set('name', 'qux')
                .limit(1)
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('single document replacement', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('replaces the entire document if it exists', () => {
            const expected = [{ _id: '1', age: 23 }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .replaceOne('1', { _id: '3', age: 23 })
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(1);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('does nothing if the document does not exist', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .replaceOne('4', { _id: '1', name: 'baz', age: 23 })
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(0);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('modifies all documents that match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '1', name: 'qux' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'qux' }];
            let actual = [];

            return collection
                .modify("_id in ('1', '3')")
                .set('name', 'qux')
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('modifies all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'qux' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .modify("_id not in ('1', '3')")
                .set('name', 'qux')
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('patching objects', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', age: 23, address: { city: 'bar', street: 'baz', zip: 'qux' } })
                .add({ _id: '2', name: 'bar', age: 42, address: { city: 'baz', street: 'qux', zip: 'quux' } })
                .add({ _id: '3', name: 'baz', age: 23, address: { city: 'qux', street: 'quux', zip: 'biz' } })
                .execute();
        });

        it('updates all matching documents of a collection', () => {
            const expected = [
                { _id: '1', name: 'qux', age: 23, address: { city: 'bar', street: 'baz', zip: 'qux' } },
                { _id: '2', name: 'bar', age: 42, address: { city: 'baz', street: 'qux', zip: 'quux' } },
                { _id: '3', name: 'qux', age: 23, address: { city: 'qux', street: 'quux', zip: 'biz' } }
            ];

            let actual = [];

            return collection
                .modify('age = 23')
                .patch({ name: 'qux' })
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('replaces values of document fields at any nesting level', () => {
            const expected = [
                { _id: '1', name: 'qux', age: 23, address: { city: 'foo', street: 'bar', zip: 'qux' } },
                { _id: '2', name: 'bar', age: 42, address: { city: 'baz', street: 'qux', zip: 'quux' } },
                { _id: '3', name: 'baz', age: 23, address: { city: 'qux', street: 'quux', zip: 'biz' } }
            ];

            let actual = [];

            return collection
                .modify('_id = "1"')
                .patch({ name: 'qux', address: { city: 'foo', street: 'bar' } })
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('adds new document fields at any nesting level', () => {
            const expected = [
                { _id: '1', name: 'foo', age: 23, more: true, address: { city: 'bar', street: 'baz', zip: 'qux', more: true } },
                { _id: '2', name: 'bar', age: 42, more: true, address: { city: 'baz', street: 'qux', zip: 'quux', more: true } },
                { _id: '3', name: 'baz', age: 23, more: true, address: { city: 'qux', street: 'quux', zip: 'biz', more: true } }
            ];

            let actual = [];

            return collection.modify('true')
                .patch({ more: true, address: { more: true } })
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('deletes document fields at any nesting level', () => {
            const expected = [
                { _id: '1', name: 'foo', address: { city: 'bar', street: 'baz' } },
                { _id: '2', name: 'bar', age: 42, address: { city: 'baz', street: 'qux', zip: 'quux' } },
                { _id: '3', name: 'baz', address: { city: 'qux', street: 'quux' } }
            ];

            let actual = [];

            return collection
                .modify('age = 23')
                .patch({ age: null, address: { zip: null } })
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('avoids any change to the `_id` field', () => {
            const expected = [
                { _id: '1', name: 'qux', age: 23 },
                { _id: '2', name: 'bar', age: 42, address: { city: 'baz', street: 'qux', zip: 'quux' } },
                { _id: '3', name: 'baz', age: 23, address: { city: 'qux', street: 'quux', zip: 'biz' } }
            ];

            let actual = [];

            return collection
                .modify('_id = "1"')
                .patch({ _id: '4', name: 'qux', address: null })
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('update order', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', age: 23 })
                .add({ _id: '2', name: 'bar', age: 42 })
                .add({ _id: '3', name: 'baz', age: 23 })
                .execute();
        });

        it('modifies documents with a given order provided as an expression array', () => {
            const expected = [{ _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar', age: 42, updated: true }, { _id: '3', name: 'baz', age: 23 }];
            const actual = [];

            return collection.modify('true')
                .set('updated', true)
                .limit(1)
                .sort(['age DESC'])
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('modifies documents with a given order provided as multiple expressions', () => {
            const expected = [{ _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar', age: 42 }, { _id: '3', name: 'baz', age: 23, updated: true }];
            const actual = [];

            return collection.modify('true')
                .set('updated', true)
                .limit(1)
                .sort('age ASC', 'name ASC')
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#29179767 JavaScript Date converted to empty object', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        it('updates a single field using a valid JSON value from a JavaScript Date object', () => {
            const now = new Date();
            const expected = [{ createdAt: now.toJSON() }];
            const actual = [];

            return collection.modify('_id = :id')
                .bind('id', '1')
                .set('createdAt', now)
                .execute()
                .then(() => {
                    return collection.find('_id = :id')
                        .fields('createdAt')
                        .bind('id', '1')
                        .execute(doc => actual.push(doc));
                })
                .then(() => {
                    expect(actual).to.deep.equal(expected);
                });
        });

        it('updates a multiple fields using valid JSON values from JavaScript Date objects', () => {
            const now = new Date();
            const expected = [{ createdAt: now.toJSON(), updatedAt: now.toJSON() }];
            const actual = [];

            return collection.modify('_id = :id')
                .bind('id', '1')
                .patch({ createdAt: now, updatedAt: now })
                .execute()
                .then(() => {
                    return collection.find('_id = :id')
                        .fields('createdAt', 'updatedAt')
                        .bind('id', '1')
                        .execute(doc => actual.push(doc));
                })
                .then(() => {
                    expect(actual).to.deep.equal(expected);
                });
        });
    });

    context('BUG#30401962 affected items', () => {
        beforeEach('add fixtures', () => {
            return collection.add({ name: 'foo' }, { name: 'bar' }, { name: 'baz' })
                .execute();
        });

        context('without limit', () => {
            it('returns the number of documents that have been updated in the collection', () => {
                return collection.modify('true')
                    .set('name', 'quux')
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(3));
            });
        });

        context('with limit', () => {
            it('returns the number of documents that have been updated in the collection', () => {
                const limit = 2;

                return collection.modify('true')
                    .set('name', 'quux')
                    .limit(limit)
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(limit));
            });
        });
    });

    context('when debug mode is enabled', () => {
        beforeEach('populate table', () => {
            return collection.add({ _id: '1', name: 'foo', count: 2 })
                .execute();
        });

        it('logs the update operation data when replacing a document', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'replace.js');
            const doc = { name: 'bar', count: -3 };

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Update', script, [schema.getName(), collection.getName(), JSON.stringify(doc)])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudUpdate = proc.logs[0];
                    expect(crudUpdate).to.contain.keys('operation');
                    expect(crudUpdate.operation).to.be.an('array').and.to.have.lengthOf(1);
                    expect(crudUpdate.operation[0]).to.have.keys('source', 'operation', 'value');
                    // eslint-disable-next-line no-unused-expressions
                    expect(crudUpdate.operation[0].source).to.be.an('object').and.be.empty; // source is required
                    expect(crudUpdate.operation[0].operation).to.equal('ITEM_SET');
                    expect(crudUpdate.operation[0].value).to.have.keys('type', 'object');
                    expect(crudUpdate.operation[0].value.type).to.equal('OBJECT');
                    expect(crudUpdate.operation[0].value.object).to.have.keys('fld');
                    expect(crudUpdate.operation[0].value.object.fld).to.be.an('array').and.have.lengthOf(2);

                    const fields = crudUpdate.operation[0].value.object.fld;
                    fields.forEach(field => {
                        expect(field).to.have.keys('key', 'value');
                        expect(field.value).to.have.keys('type', 'literal');
                        expect(field.value.type).to.equal('LITERAL');
                    });

                    expect(fields[0].key).to.equal('name');
                    expect(fields[0].value.literal).to.have.keys('type', 'v_string');
                    expect(fields[0].value.literal.type).to.equal('V_STRING');
                    expect(fields[0].value.literal.v_string).to.have.keys('value');
                    expect(fields[0].value.literal.v_string.value).to.equal('bar');

                    expect(fields[1].key).to.equal('count');
                    expect(fields[1].value.literal).to.have.keys('type', 'v_signed_int');
                    expect(fields[1].value.literal.type).to.equal('V_SINT');
                    expect(fields[1].value.literal.v_signed_int).to.equal(-3);
                });
        });

        it('logs the update operation data when patching documents', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'patch.js');
            const doc = { active: true };

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Update', script, [schema.getName(), collection.getName(), '_id = 1', JSON.stringify(doc)])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudUpdate = proc.logs[0];
                    expect(crudUpdate).to.contain.keys('operation');
                    expect(crudUpdate.operation).to.be.an('array').and.to.have.lengthOf(1);
                    expect(crudUpdate.operation[0]).to.have.keys('source', 'operation', 'value');
                    // eslint-disable-next-line no-unused-expressions
                    expect(crudUpdate.operation[0].source).to.be.an('object').and.be.empty; // source is required
                    expect(crudUpdate.operation[0].operation).to.equal('MERGE_PATCH');
                    expect(crudUpdate.operation[0].value).to.have.keys('type', 'object');
                    expect(crudUpdate.operation[0].value.type).to.equal('OBJECT');
                    expect(crudUpdate.operation[0].value.object).to.have.keys('fld');
                    expect(crudUpdate.operation[0].value.object.fld).to.be.an('array').and.have.lengthOf(1);
                    expect(crudUpdate.operation[0].value.object.fld[0]).to.have.keys('key', 'value');
                    expect(crudUpdate.operation[0].value.object.fld[0].key).to.equal('active');
                    expect(crudUpdate.operation[0].value.object.fld[0].value).to.have.keys('type', 'literal');
                    expect(crudUpdate.operation[0].value.object.fld[0].value.type).to.equal('LITERAL');
                    expect(crudUpdate.operation[0].value.object.fld[0].value.literal).to.have.keys('type', 'v_bool');
                    expect(crudUpdate.operation[0].value.object.fld[0].value.literal.type).to.equal('V_BOOL');
                    // eslint-disable-next-line no-unused-expressions
                    expect(crudUpdate.operation[0].value.object.fld[0].value.literal.v_bool).to.be.true;
                });
        });

        it('logs the update operation data when deleting properties', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'unset.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Update', script, [schema.getName(), collection.getName(), 'count'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudUpdate = proc.logs[0];
                    expect(crudUpdate).to.contain.keys('operation');
                    expect(crudUpdate.operation).to.be.an('array').and.to.have.lengthOf(1);
                    expect(crudUpdate.operation[0]).to.have.keys('source', 'operation');
                    expect(crudUpdate.operation[0].source).to.have.keys('document_path');
                    expect(crudUpdate.operation[0].source.document_path).to.be.an('array').and.have.lengthOf(1);
                    expect(crudUpdate.operation[0].source.document_path[0]).to.have.keys('type', 'value');
                    expect(crudUpdate.operation[0].source.document_path[0].type).to.equal('MEMBER');
                    expect(crudUpdate.operation[0].source.document_path[0].value).to.equal('count');
                    expect(crudUpdate.operation[0].operation).to.equal('ITEM_REMOVE');
                });
        });
    });
});
