'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Client = require('lib/Protocol/Client');
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collection = require('lib/DevAPI/Collection');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Collection', () => {
    let sqlStmtExecute, getName;

    beforeEach('create fakes', () => {
        sqlStmtExecute = td.function();
        getName = td.function();
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
        it('should return the associated schema', () => {
            const instance = collection(null, { getName });

            td.when(getName()).thenReturn('foobar');

            expect(instance.getSchema().getName()).to.equal('foobar');
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
            const instance = collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('list_objects', ['bar', 'foo'], td.callback(['foo']), null, 'xplugin')).thenResolve();

            return expect(instance.existsInDatabase()).to.eventually.be.true;
        });

        it('should return false if it does not exist in database', () => {
            const instance = collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('list_objects', ['bar', 'foo'], td.callback([]), null, 'xplugin')).thenResolve();

            return expect(instance.existsInDatabase()).to.eventually.be.false;
        });
    });

    context('count()', () => {
        it('should return the number of documents in a collection', () => {
            const instance = collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('SELECT COUNT(*) FROM `bar`.`foo`', [], td.callback([1]))).thenResolve();

            return expect(instance.count()).to.eventually.equal(1);
        });

        it('should fail if an unexpected error is thrown', () => {
            const instance = collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');
            const error = new Error('foobar');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('SELECT COUNT(*) FROM `bar`.`foo`', [], td.callback([1]))).thenReject(error);

            return expect(instance.count()).to.eventually.be.rejectedWith(error);
        });
    });

    context('inspect()', () => {
        it('should hide internals', () => {
            const instance = collection(null, { getName }, 'foo');
            const expected = { schema: 'bar', collection: 'foo' };

            td.when(getName()).thenReturn('bar');

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

            expect(instance.getDocuments()).to.deep.equal(documents);
        });

        it('should acknowledge documents provided as multiple arguments', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            const instance = collection().add(documents[0], documents[1]);

            expect(instance.getDocuments()).to.deep.equal(documents);
        });
    });

    context('remove()', () => {
        it('should return an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const name = 'baz';
            const query = 'true';
            const instance = collection(session, schema, name).remove(query);

            expect(instance.getClassName()).to.equal('CollectionRemove');
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
        let crudFind, crudModify;

        beforeEach('create fakes', () => {
            crudFind = td.function();
            crudModify = td.function();
        });

        it('should return the result of executing a modify operation for a given document', () => {
            const collectionName = 'foo';
            const documentId = 'bar';
            const schemaName = 'baz';
            const type = Client.dataModel.DOCUMENT;
            const criteria = `$._id == "${documentId}"`;
            const state = { rows_affected: 1 };
            const expected = new Result(state);
            const session = { _client: { crudFind, crudModify } };
            const instance = collection(session, { getName }, collectionName);

            const any = td.matchers.anything();

            td.when(getName()).thenReturn(schemaName);
            td.when(crudFind(session), { ignoreExtraArgs: true }).thenResolve();
            td.when(crudModify(schemaName, collectionName, type, criteria), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(instance.replaceOne(documentId, { prop: 'qux' })).to.eventually.deep.equal(expected);
        });

        it('should escape the id value', () => {
            const collectionName = 'foo';
            const documentId = 'b\\\"ar';
            const schemaName = 'baz';
            const type = Client.dataModel.DOCUMENT;
            const criteria = `$._id == "b\\\\"ar"`;
            const state = { rows_affected: 1 };
            const expected = new Result(state);
            const session = { _client: { crudFind, crudModify } };
            const instance = collection(session, { getName }, collectionName);

            td.when(getName()).thenReturn(schemaName);
            td.when(crudFind(session), { ignoreExtraArgs: true }).thenResolve();
            td.when(crudModify(schemaName, collectionName, type, criteria), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(instance.replaceOne(documentId, { prop: 'qux' })).to.eventually.deep.equal(expected);
        });

        it('should ignore any additional `_id` property', () => {
            const collectionName = 'foo';
            const documentId = 'bar';
            const schemaName = 'baz';
            const type = Client.dataModel.DOCUMENT;
            const criteria = `$._id == "${documentId}"`;
            const state = { rows_affected: 1 };
            const expected = new Result(state);
            const session = { _client: { crudFind, crudModify } };
            const instance = collection(session, { getName }, collectionName);

            const operation = {
                source: {
                    document_path: [{
                        type: 1,
                        value: 'prop'
                    }]
                },
                operation: 3,
                value: {
                    type: 2,
                    literal: {
                        type: 8,
                        v_string: {
                            value: 'quux'
                        }
                    }
                }
            };

            td.when(getName()).thenReturn(schemaName);
            td.when(crudFind(session), { ignoreExtraArgs: true }).thenResolve();
            td.when(crudModify(schemaName, collectionName, type, criteria, [operation]), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(instance.replaceOne(documentId, { _id: 'qux', prop: 'quux' })).to.eventually.deep.equal(expected);
        });

        it('should fail if an unexpected error is thrown', () => {
            const collectionName = 'foo';
            const documentId = 'bar';
            const schemaName = 'baz';
            const error = new Error('foobar');
            const session = { _client: { crudFind, crudModify } };
            const instance = collection(session, { getName }, collectionName);

            td.when(getName()).thenReturn(schemaName);
            td.when(crudFind(session), { ignoreExtraArgs: true }).thenResolve();
            td.when(crudModify(schemaName, collectionName, Client.dataModel.DOCUMENT, `$._id == "${documentId}"`), { ignoreExtraArgs: true }).thenReject(error);

            return expect(instance.replaceOne(documentId, { prop: 'qux' })).to.eventually.be.rejectedWith(error);
        });
    });

    context('addOrReplaceOne()', () => {
        let crudInsert;

        beforeEach('create fakes', () => {
            crudInsert = td.function();
        });

        it('should return the result of executing a "upsert" operation for a given document', () => {
            const collectionName = 'foobar';
            const rows = [[JSON.stringify({ name: 'bar', _id: 'foo' })]];
            const state = { doc_ids: ['foo'] };
            const expected = new Result(state);
            const schemaName = 'baz';
            const session = { _client: { crudInsert } };
            const instance = collection(session, { getName }, collectionName);

            td.when(getName()).thenReturn(schemaName);
            td.when(crudInsert(schemaName, collectionName, Client.dataModel.DOCUMENT, { rows }, { upsert: true })).thenResolve(state);

            return expect(instance.addOrReplaceOne('foo', { name: 'bar' })).to.eventually.deep.equal(expected);
        });

        it('should escape the id value', () => {
            const collectionName = 'foobar';
            const rows = [[JSON.stringify({ name: 'bar', _id: 'fo"o' })]];
            const state = { doc_ids: ['fo"o'] };
            const expected = new Result(state);
            const schemaName = 'baz';
            const session = { _client: { crudInsert } };
            const instance = collection(session, { getName }, collectionName);

            td.when(getName()).thenReturn(schemaName);
            td.when(crudInsert(schemaName, collectionName, Client.dataModel.DOCUMENT, { rows }, { upsert: true })).thenResolve(state);

            return expect(instance.addOrReplaceOne('fo"o', { name: 'bar' })).to.eventually.deep.equal(expected);
        });

        it('should ignore any additional `_id` property', () => {
            const collectionName = 'foobar';
            const rows = [[JSON.stringify({ _id: 'foo', name: 'bar' })]];
            const state = { doc_ids: ['foo'] };
            const expected = new Result(state);
            const schemaName = 'baz';
            const session = { _client: { crudInsert } };
            const instance = collection(session, { getName }, collectionName);

            td.when(getName()).thenReturn(schemaName);
            td.when(crudInsert(schemaName, collectionName, Client.dataModel.DOCUMENT, { rows }, { upsert: true })).thenResolve(state);

            return expect(instance.addOrReplaceOne('foo', { _id: 'baz', name: 'bar' })).to.eventually.deep.equal(expected);
        });

        it('should fail if an unexpected error is thrown', () => {
            const collectionName = 'foobar';
            const rows = [[JSON.stringify({ name: 'bar', _id: 'foo' })]];
            const schemaName = 'baz';
            const session = { _client: { crudInsert } };
            const instance = collection(session, { getName }, collectionName);
            const error = new Error('bazqux');

            td.when(getName()).thenReturn(schemaName);
            td.when(crudInsert(schemaName, collectionName, Client.dataModel.DOCUMENT, { rows }, { upsert: true })).thenReject(error);

            return expect(instance.addOrReplaceOne('foo', { name: 'bar' })).to.eventually.be.rejectedWith(error);
        });
    });

    context('getOne()', () => {
        let crudFind;

        beforeEach('create fakes', () => {
            crudFind = td.function();
        });

        it('should return the document instance if it exists', () => {
            const collectionName = 'foobar';
            const documentId = 'foo';
            const expected = { _id: documentId, name: 'bar' };
            const schemaName = 'baz';
            const type = Client.dataModel.DOCUMENT;
            const criteria = `$._id == "${documentId}"`;
            const session = { _client: { crudFind } };
            const instance = collection(session, { getName }, collectionName);

            const any = td.matchers.anything();

            td.when(getName()).thenReturn(schemaName);
            td.when(crudFind(session, schemaName, collectionName, type, [], criteria, any, any, any, any, td.callback([expected])), { ignoreExtraArgs: true }).thenResolve();

            return expect(instance.getOne(documentId)).to.eventually.deep.equal(expected);
        });

        it('should escape the id value', () => {
            const collectionName = 'foobar';
            const documentId = 'fo\\"o';
            const expected = { _id: documentId, name: 'bar' };
            const schemaName = 'baz';
            const type = Client.dataModel.DOCUMENT;
            const criteria = `$._id == "fo\\\\"o"`;
            const session = { _client: { crudFind } };
            const instance = collection(session, { getName }, collectionName);

            const any = td.matchers.anything();

            td.when(getName()).thenReturn(schemaName);
            td.when(crudFind(session, schemaName, collectionName, type, [], criteria, any, any, any, any, td.callback([expected])), { ignoreExtraArgs: true }).thenResolve();

            return expect(instance.getOne(documentId)).to.eventually.deep.equal(expected);
        });

        it('should return `null` if the document does not exist', () => {
            const collectionName = 'foobar';
            const documentId = 'foo';
            const schemaName = 'baz';
            const type = Client.dataModel.DOCUMENT;
            const criteria = `$._id == "${documentId}"`;
            const session = { _client: { crudFind } };
            const instance = collection(session, { getName }, collectionName);

            const any = td.matchers.anything();

            td.when(getName()).thenReturn(schemaName);
            td.when(crudFind(session, schemaName, collectionName, type, [], criteria, any, any, any, any, td.callback([])), { ignoreExtraArgs: true }).thenResolve();

            return expect(instance.getOne(documentId)).to.eventually.be.null;
        });
    });

    context('removeOne()', () => {
        let crudRemove;

        beforeEach('create fakes', () => {
            crudRemove = td.function();
        });

        it('should return the document instance if it exists', () => {
            const collectionName = 'foobar';
            const documentId = 'foo';
            const state = { rows_affected: 1 };
            const expected = new Result(state);
            const schemaName = 'baz';
            const type = Client.dataModel.DOCUMENT;
            const criteria = `$._id == "${documentId}"`;
            const instance = collection({ _client: { crudRemove } }, { getName }, collectionName);

            const any = td.matchers.anything();

            td.when(getName()).thenReturn(schemaName);
            td.when(crudRemove(schemaName, collectionName, type, criteria, any, any)).thenResolve(state);

            return expect(instance.removeOne(documentId)).to.eventually.deep.equal(expected);
        });

        it('should escape the id value', () => {
            const collectionName = 'foobar';
            const documentId = 'fo\\"o';
            const state = { rows_affected: 1 };
            const expected = new Result(state);
            const schemaName = 'baz';
            const type = Client.dataModel.DOCUMENT;
            const criteria = `$._id == "fo\\\\"o"`;
            const instance = collection({ _client: { crudRemove } }, { getName }, collectionName);

            const any = td.matchers.anything();

            td.when(getName()).thenReturn(schemaName);
            td.when(crudRemove(schemaName, collectionName, type, criteria, any, any)).thenResolve(state);

            return expect(instance.removeOne(documentId)).to.eventually.deep.equal(expected);
        });

        it('should fail if an unexpected error is thrown', () => {
            const collectionName = 'foobar';
            const documentId = 'foo';
            const schemaName = 'baz';
            const type = Client.dataModel.DOCUMENT;
            const criteria = `$._id == "${documentId}"`;
            const instance = collection({ _client: { crudRemove } }, { getName }, collectionName);
            const error = new Error('bazqux');

            const any = td.matchers.anything();

            td.when(getName()).thenReturn(schemaName);
            td.when(crudRemove(schemaName, collectionName, type, criteria, any, any)).thenReject(error);

            return expect(instance.removeOne(documentId)).to.eventually.be.rejectedWith(error);
        });
    });
});
