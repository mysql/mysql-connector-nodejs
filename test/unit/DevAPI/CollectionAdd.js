'use strict';

/* eslint-env node, mocha */

const Client = require('lib/Protocol/Client');
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collectionAdd = require('lib/DevAPI/CollectionAdd');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('CollectionAdd', () => {
    let crudInsert, fakeSchema, fakeSession, getName, idGenerator;

    beforeEach('create fake session', () => {
        crudInsert = td.function();
        idGenerator = td.function();
        fakeSession = {
            _client: { crudInsert },
            idGenerator
        };
    });

    beforeEach('create fake schema', () => {
        getName = td.function();
        fakeSchema = { getName };

        td.when(getName()).thenReturn('schema');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(collectionAdd().getClassName()).to.equal('CollectionAdd');
        });
    });

    context('add()', () => {
        it('should be fluent', () => {
            const query = collectionAdd().add({ foo: 'bar' });

            expect(query.add).to.be.a('function');
        });

        it('should include the documents provided as an array', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = collectionAdd().add(expected);

            expect(query.getDocuments()).to.deep.equal(expected);
        });

        it('should include all the documents provided as multiple arguments', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = collectionAdd().add(expected[0], expected[1]);

            expect(query.getDocuments()).to.deep.equal(expected);
        });

        it('should append documents to existing ones', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = collectionAdd(fakeSession, fakeSchema, null, [{ foo: 'bar' }]).add({ foo: 'baz' });

            expect(query.getDocuments()).to.deep.equal(expected);
        });

        it('should append documents provided on multiple calls', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = collectionAdd().add({ foo: 'bar' }).add({ foo: 'baz' });

            expect(query.getDocuments()).to.deep.equal(expected);
        });
    });

    context('execute()', () => {
        it('should include all documents that were added', () => {
            const documents = [{ _id: 'foo', foo: 'bar' }, { _id: 'bar', bar: 'baz' }];
            const state = { doc_ids: ['foo', 'bar'] };
            const expected = new Result(state);
            const query = collectionAdd(fakeSession, fakeSchema, 'collection').add([documents[0]]).add(documents[1]);
            const rows = [[JSON.stringify(documents[0])], [JSON.stringify(documents[1])]];

            td.when(crudInsert('schema', 'collection', Client.dataModel.DOCUMENT, { rows }, { upsert: false })).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should generate an id for documents that do not have one', () => {
            const state = { doc_ids: ['baz'] };
            const expected = new Result(state);
            const query = collectionAdd(fakeSession, fakeSchema, 'collection', [{ foo: 'bar' }]);
            const rows = [[JSON.stringify({ foo: 'bar', _id: 'baz' })]];

            td.when(idGenerator()).thenReturn('baz');
            td.when(crudInsert('schema', 'collection', Client.dataModel.DOCUMENT, { rows }, { upsert: false })).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should append the ids of the added documents to the response state', () => {
            const state = {};
            const query = collectionAdd(fakeSession, fakeSchema, 'collection', [{ foo: 'bar' }]);
            const rows = [[JSON.stringify({ foo: 'bar', _id: 'baz' })]];

            td.when(idGenerator()).thenReturn('baz');
            td.when(crudInsert('schema', 'collection', Client.dataModel.DOCUMENT, { rows }, { upsert: false })).thenResolve(state);

            return expect(query.execute()).to.be.fulfilled
                .then(result => expect(result.getDocumentIds()).to.deep.equal(['baz']));
        });

        it('should return early if no documents were provided', () => {
            const query = collectionAdd(fakeSession, fakeSchema, 'collection', []);

            td.when(idGenerator(), { ignoreExtraArgs: true }).thenReturn();
            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve();

            return expect(query.execute()).to.be.fulfilled
                .then(() => {
                    expect(td.explain(idGenerator).callCount).to.equal(0);
                    expect(td.explain(crudInsert).callCount).to.equal(0);
                });
        });

        it('should not generate an id for documents with `_id` equal to `0`', () => {
            const expected = [0];
            const query = collectionAdd(fakeSession, fakeSchema, 'collection', [{ _id: expected[0], name: 'foo' }]);

            td.when(idGenerator(), { ignoreExtraArgs: true }).thenReturn();
            td.when(getName()).thenReturn('bar');
            td.when(crudInsert('bar', 'collection', Client.dataModel.DOCUMENT), { ignoreExtraArgs: true }).thenResolve({});

            return expect(query.execute()).to.be.fulfilled
                .then(result => {
                    expect(td.explain(idGenerator).callCount).to.equal(0);
                    expect(result._state.doc_ids).to.deep.equal(expected);
                });
        });

        it('should be able to generate an "upsert" message', () => {
            const doc = { _id: 'foo', name: 'bar' };
            const state = { doc_ids: ['foo'] };
            const expected = new Result(state);
            const rows = [[JSON.stringify(doc)]];
            const options = { upsert: true };
            const query = collectionAdd(fakeSession, fakeSchema, 'collection', null, options).add(doc);

            td.when(crudInsert('schema', 'collection', Client.dataModel.DOCUMENT, { rows }, options)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });
    });
});
