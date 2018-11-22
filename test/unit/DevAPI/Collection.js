'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const result = require('lib/DevAPI/Result');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Collection', () => {
    let collection, collectionRemove, execute, sqlExecute;

    beforeEach('create fakes', () => {
        collectionRemove = td.function();
        execute = td.function();
        sqlExecute = td.function();

        collection = proxyquire('lib/DevAPI/Collection', {
            './CollectionRemove': collectionRemove,
            './SqlExecute': sqlExecute
        });
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getName()', () => {
        it('should return the collection name', () => {
            expect(collection(null, null, 'foobar').getName()).to.equal('foobar');
        });
    });

    context('getSchema()', () => {
        it('should return the instance of the collection schema', () => {
            const getSchema = td.function();
            const getName = td.function();
            const session = { getSchema };
            const schema = { getName };
            const coll = collection(session, schema, 'bar');

            td.when(getName()).thenReturn('foo');
            td.when(getSchema('foo')).thenReturn(schema);

            return expect(coll.getSchema().getName()).to.equal('foo');
        });
    });

    context('getSession()', () => {
        it('should return the associated session', () => {
            const instance = collection({ foo: 'bar' });

            expect(instance.getSession()).to.deep.equal({ foo: 'bar' });
        });
    });

    context('existsInDatabase()', () => {
        it('should return true if exists in database', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = collection('foo', schema, 'baz');

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback(['baz']))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar', filter: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.existsInDatabase()).to.eventually.be.true;
        });

        it('should return false if it does not exist in database', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = collection('foo', schema, 'baz');

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback([]))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar', filter: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.existsInDatabase()).to.eventually.be.false;
        });
    });

    context('count()', () => {
        it('should return the number of documents in a collection', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = collection('foo', schema, 'baz');

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback([1]))).thenResolve();
            td.when(sqlExecute('foo', 'SELECT COUNT(*) FROM `bar`.`baz`')).thenReturn({ execute });

            return expect(instance.count()).to.eventually.equal(1);
        });

        it('should fail if an unexpected error is thrown', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = collection('foo', schema, 'baz');
            const error = new Error('foobar');

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback([1]))).thenReject(error);
            td.when(sqlExecute('foo', 'SELECT COUNT(*) FROM `bar`.`baz`')).thenReturn({ execute });

            return expect(instance.count()).to.eventually.be.rejectedWith(error);
        });

        // TODO(Rui): Maybe this will become the job of the plugin at some point.
        it('should replace "Table" by "Collection" on server error messages', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = collection('foo', schema, 'baz');
            const error = new Error("Table 'bar.baz' doesn't exist.");

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback([1]))).thenReject(error);
            td.when(sqlExecute('foo', 'SELECT COUNT(*) FROM `bar`.`baz`')).thenReturn({ execute });

            return expect(instance.count()).to.eventually.be.rejectedWith("Collection 'bar.baz' doesn't exist.");
        });
    });

    context('inspect()', () => {
        it('should hide internals', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = collection(null, schema, 'bar');
            const expected = { schema: 'foo', collection: 'bar' };

            td.when(getName()).thenReturn('foo');

            expect(instance.inspect()).to.deep.equal(expected);
        });
    });

    context('add()', () => {
        it('should return an instance of the proper class', () => {
            const instance = collection().add({});

            expect(instance.getClassName()).to.equal('CollectionAdd');
        });

        it('should acknowledge documents provided as an array', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            const instance = collection().add(documents);

            expect(instance.getItems()).to.deep.equal(documents);
        });

        it('should acknowledge documents provided as multiple arguments', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            const instance = collection().add(documents[0], documents[1]);

            expect(instance.getItems()).to.deep.equal(documents);
        });
    });

    context('modify()', () => {
        it('should return an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const name = 'baz';
            const query = 'true';
            const instance = collection(session, schema, name).modify(query);

            expect(instance.getClassName()).to.equal('CollectionModify');
        });
    });

    context('replaceOne()', () => {
        let collection, collectionModify, execute, setDouble;

        beforeEach('create fakes', () => {
            collectionModify = td.function();
            execute = td.function();
            setDouble = td.function();

            collection = proxyquire('lib/DevAPI/Collection', {
                './CollectionModify': collectionModify
            });
        });

        it('should return the result of executing a modify operation for a given document', () => {
            const instance = collection('foo', 'bar', 'baz');
            const state = { ok: true };
            const expected = result(state);

            td.when(execute()).thenResolve(expected);
            td.when(setDouble('$', { a: 'quux' })).thenReturn({ execute });
            td.when(collectionModify('foo', 'bar', 'baz', '_id = "qux"')).thenReturn({ set: setDouble });

            return expect(instance.replaceOne('qux', { a: 'quux' })).to.eventually.deep.equal(expected);
        });

        it('should escape the id value', () => {
            /* eslint-disable no-useless-escape */
            const documentId = 'b\"ar';
            /* eslint-enable no-useless-escape */
            const criteria = `_id = "b\\"ar"`;
            const instance = collection('foo', 'bar', 'baz');
            const state = { ok: true };
            const expected = result(state);

            td.when(execute()).thenResolve(expected);
            td.when(setDouble(), { ignoreExtraArgs: true }).thenReturn({ execute });
            td.when(collectionModify('foo', 'bar', 'baz', criteria)).thenReturn({ set: setDouble });

            return expect(instance.replaceOne(documentId, { a: 'a' })).to.eventually.deep.equal(expected);
        });

        it('should fail if an unexpected error is thrown when modifying the document', () => {
            const instance = collection('foo', 'bar', 'baz');
            const error = new Error('foobar');

            td.when(execute()).thenReject(error);
            td.when(setDouble(), { ignoreExtraArgs: true }).thenReturn({ execute });
            td.when(collectionModify('foo', 'bar', 'baz', '_id = "qux"')).thenReturn({ set: setDouble });

            return expect(instance.replaceOne('qux', { a: 'quux' })).to.eventually.be.rejectedWith(error);
        });
    });

    context('addOrReplaceOne()', () => {
        let collectionAdd, collectionDouble, execute;

        beforeEach('create fakes', () => {
            collectionAdd = td.function();
            execute = td.function();

            collectionDouble = proxyquire('lib/DevAPI/Collection', {
                './CollectionAdd': collectionAdd
            });
        });

        it('should return the result of executing a "upsert" operation for a given document', () => {
            const expected = { ok: 'true' };
            const name = 'foo';
            const schema = 'baz';
            const session = 'qux';
            const instance = collectionDouble(session, schema, name);

            td.when(execute()).thenResolve(expected);
            td.when(collectionAdd(session, schema, name, [{ _id: 'foo', name: 'bar' }], { upsert: true })).thenReturn({ execute });

            return expect(instance.addOrReplaceOne('foo', { name: 'bar' })).to.eventually.deep.equal(expected);
        });

        it('should escape the id value', () => {
            const expected = { ok: 'true' };
            const name = 'foo';
            const schema = 'baz';
            const session = 'qux';
            const instance = collectionDouble(session, schema, name);

            td.when(execute()).thenResolve(expected);
            td.when(collectionAdd(session, schema, name, [{ _id: 'fo\\"o', name: 'bar' }], { upsert: true })).thenReturn({ execute });

            return expect(instance.addOrReplaceOne('fo"o', { name: 'bar' })).to.eventually.deep.equal(expected);
        });

        it('should ignore any additional `_id` property', () => {
            const expected = { ok: 'true' };
            const name = 'foo';
            const schema = 'baz';
            const session = 'qux';
            const instance = collectionDouble(session, schema, name);

            td.when(execute()).thenResolve(expected);
            td.when(collectionAdd(session, schema, name, [{ _id: 'foo', name: 'bar' }], { upsert: true })).thenReturn({ execute });

            return expect(instance.addOrReplaceOne('foo', { _id: 'baz', name: 'bar' })).to.eventually.deep.equal(expected);
        });

        it('should fail if an unexpected error is thrown', () => {
            const error = new Error('foobar');
            const name = 'foo';
            const schema = 'baz';
            const session = 'qux';
            const instance = collectionDouble(session, schema, name);

            td.when(execute()).thenReject(error);
            td.when(collectionAdd(session, schema, name, [{ _id: 'foo', name: 'bar' }], { upsert: true })).thenReturn({ execute });

            return expect(instance.addOrReplaceOne('foo', { _id: 'baz', name: 'bar' })).to.eventually.be.rejectedWith(error);
        });
    });

    context('getOne()', () => {
        let collectionFind, execute;

        beforeEach('create fakes', () => {
            collectionFind = td.function();
            collection = proxyquire('lib/DevAPI/Collection', {
                './CollectionFind': collectionFind
            });
            execute = td.function();
        });

        it('should return the document instance if it exists', () => {
            const collectionName = 'foobar';
            const documentId = 'foo';
            const criteria = `_id = "${documentId}"`;
            const expected = { _id: documentId, name: 'bar' };
            const schema = 'baz';
            const session = 'qux';
            const instance = collection(session, schema, collectionName);

            td.when(execute(td.callback(expected))).thenResolve();
            td.when(collectionFind(session, schema, collectionName, criteria)).thenReturn({ execute });

            return expect(instance.getOne(documentId)).to.eventually.deep.equal(expected);
        });

        it('should escape the id value', () => {
            const collectionName = 'foobar';
            /* eslint-disable no-useless-escape */
            const documentId = 'fo\"o';
            /* eslint-enable no-useless-escape */
            const criteria = `_id = "fo\\"o"`;
            const expected = { _id: documentId, name: 'bar' };
            const schema = 'baz';
            const session = 'qux';
            const instance = collection(session, schema, collectionName);

            td.when(execute(td.callback(expected))).thenResolve();
            td.when(collectionFind(session, schema, collectionName, criteria)).thenReturn({ execute });

            return expect(instance.getOne(documentId)).to.eventually.deep.equal(expected);
        });

        it('should return `null` if the document does not exist', () => {
            const collectionName = 'foobar';
            const documentId = 'foo';
            const criteria = `_id = "${documentId}"`;
            const schema = 'baz';
            const session = 'qux';
            const instance = collection(session, schema, collectionName);

            td.when(execute(td.matchers.isA(Function))).thenResolve();
            td.when(collectionFind(session, schema, collectionName, criteria)).thenReturn({ execute });

            return expect(instance.getOne(documentId)).to.eventually.be.null;
        });
    });

    context('removeOne()', () => {
        let execute;

        beforeEach('create fakes', () => {
            execute = td.function();
        });

        it('should return the document instance if it exists', () => {
            const documentId = 'foo';
            const state = { rows_affected: 1 };
            const expected = result(state);
            const criteria = `_id = "${documentId}"`;
            const instance = collection('bar', 'baz', 'qux');

            td.when(execute()).thenResolve(expected);
            td.when(collectionRemove('bar', 'baz', 'qux', criteria)).thenReturn({ execute });

            return expect(instance.removeOne(documentId)).to.eventually.deep.equal(expected);
        });

        it('should escape the id value', () => {
            /* eslint-disable no-useless-escape */
            const documentId = 'fo\"o';
            /* eslint-enable no-useless-escape */
            const state = { rows_affected: 1 };
            const expected = result(state);
            const criteria = `_id = "fo\\"o"`;
            const instance = collection('bar', 'baz', 'qux');

            td.when(execute()).thenResolve(expected);
            td.when(collectionRemove('bar', 'baz', 'qux', criteria)).thenReturn({ execute });

            return expect(instance.removeOne(documentId)).to.eventually.deep.equal(expected);
        });

        it('should fail if an unexpected error is thrown', () => {
            const documentId = 'foo';
            const criteria = `_id = "${documentId}"`;
            const instance = collection('bar', 'baz', 'qux');
            const error = new Error('bazqux');

            td.when(execute()).thenReject(error);
            td.when(collectionRemove('bar', 'baz', 'qux', criteria)).thenReturn({ execute });

            return expect(instance.removeOne(documentId)).to.eventually.be.rejectedWith(error);
        });
    });

    context('dropIndex()', () => {
        it('should not accept invalid index name', () => {
            return expect(collection().dropIndex()).to.be.rejectedWith('Invalid index name.');
        });

        it('should accept valid index name', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = collection('bar', schema, 'qux');

            td.when(getName()).thenReturn('baz');
            td.when(execute()).thenResolve(true);
            td.when(sqlExecute('bar', 'drop_collection_index', [{ name: 'index', schema: 'baz', collection: 'qux' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.dropIndex('index')).to.eventually.be.true;
        });
    });

    context('createIndex()', () => {
        it('should not accept invalid index name', () => {
            return expect(collection().createIndex()).to.be.rejectedWith('Invalid index name.');
        });

        it('should accept a valid index name and valid index definition', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = collection('bar', schema, 'qux');

            const args = [{
                name: 'index',
                schema: 'baz',
                collection: 'qux',
                unique: false,
                type: 'INDEX',
                constraint: [ { required: false, type: 'TINYINT', member: '$.age' } ]
            }];

            const index = {
                fields: [{
                    field: '$.age',
                    type: 'TINYINT'
                }]
            };

            td.when(getName()).thenReturn('baz');
            td.when(execute()).thenResolve(true);
            td.when(sqlExecute('bar', 'create_collection_index', args, 'mysqlx')).thenReturn({ execute });

            return expect(instance.createIndex('index', index)).to.eventually.be.true;
        });

        it('should not accept index definition without valid field list', () => {
            return expect(collection().createIndex('index', {})).to.be.rejectedWith('Invalid index definition.');
        });

        it('should not accept index definition with empty field list', () => {
            return expect(collection().createIndex('index', { fields: [] })).to.be.rejectedWith('Invalid index definition.');
        });

        it('should not accept index definition with invalid field definition', () => {
            const index = {
                fields: [{
                    field: null,
                    type: null
                }]
            };

            return expect(collection().createIndex('index', index)).to.be.rejectedWith('Invalid index definition.');
        });

        it('should not accept index definition with any of the field definitions missing field', () => {
            const index = {
                fields: [{
                    type: 'TINYINT'
                }]
            };

            return expect(collection().createIndex('index', index)).to.be.rejectedWith('Invalid index definition.');
        });

        it('should not accept index definition with any of the field definitions missing type', () => {
            const index = {
                fields: [{
                    field: '$.age'
                }]
            };

            return expect(collection().createIndex('index', index)).to.be.rejectedWith('Invalid index definition.');
        });

        it('should not allow unique option to be true in the index definition', () => {
            const index = {
                fields: [{
                    field: '$.age',
                    type: 'INT'
                }],
                unique: true
            };

            return expect(collection().createIndex('index', index)).to.be.rejectedWith('Unique indexes are currently not supported.');
        });
    });
});
