'use strict';

/* eslint-env node, mocha */

const CollectionAdd = require('lib/DevAPI/CollectionAdd');
const Client = require('lib/Protocol/Client');
const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
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

    context('add()', () => {
        it('should be fluent', () => {
            const query = (new CollectionAdd()).add({ foo: 'bar' });

            expect(query).to.be.an.instanceOf(CollectionAdd);
        });

        it('should include the documents provided as an array', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = (new CollectionAdd()).add(expected);

            expect(query._document).to.deep.equal(expected);
        });

        it('should include all the documents provided as multiple arguments', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = (new CollectionAdd()).add(expected[0], expected[1]);

            expect(query._document).to.deep.equal(expected);
        });

        it('should append documents to existing ones', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = (new CollectionAdd(fakeSession, fakeSchema, null, [{ foo: 'bar' }])).add({ foo: 'baz' });

            expect(query._document).to.deep.equal(expected);
        });

        it('should append documents provided on multiple calls', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = (new CollectionAdd()).add({ foo: 'bar' }).add({ foo: 'baz' });

            expect(query._document).to.deep.equal(expected);
        });
    });

    context('execute()', () => {
        it('should include all documents that were added', () => {
            const documents = [{ _id: 'foo', foo: 'bar' }, { _id: 'bar', bar: 'baz' }];
            const state = { ok: true };
            const expected = new Result(state);
            const query = (new CollectionAdd(fakeSession, fakeSchema, 'collection')).add([documents[0]]).add(documents[1]);

            td.when(crudInsert('schema', 'collection', Client.dataModel.DOCUMENT, [[JSON.stringify(documents[0])], [JSON.stringify(documents[1])]])).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should generate an id for documents that do not have one', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = (new CollectionAdd(fakeSession, fakeSchema, 'collection', [{ foo: 'bar' }]));

            td.when(idGenerator()).thenReturn('baz');
            td.when(crudInsert('schema', 'collection', Client.dataModel.DOCUMENT, [[JSON.stringify({ foo: 'bar', _id: 'baz' })]])).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should append the ids of the added documents to the response state', () => {
            const state = { ok: true };
            const query = (new CollectionAdd(fakeSession, fakeSchema, 'collection', [{ foo: 'bar' }]));

            td.when(idGenerator()).thenReturn('baz');
            td.when(crudInsert('schema', 'collection', Client.dataModel.DOCUMENT, [[JSON.stringify({ foo: 'bar', _id: 'baz' })]])).thenResolve(state);

            return expect(query.execute()).to.be.fulfilled
                .then(result => expect(result.getDocumentIds()).to.deep.equal(['baz']));
        });

        it('should return early if no documents were provided', () => {
            const query = (new CollectionAdd(fakeSession, fakeSchema, 'collection', []));

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
            const query = (new CollectionAdd(fakeSession, fakeSchema, 'collection', [{ _id: expected[0], name: 'foo' }]));

            td.when(idGenerator(), { ignoreExtraArgs: true }).thenReturn();
            td.when(getName()).thenReturn('bar');
            td.when(crudInsert('bar', 'collection', Client.dataModel.DOCUMENT), { ignoreExtraArgs: true }).thenResolve({});

            return expect(query.execute()).to.be.fulfilled
                .then(result => {
                    expect(td.explain(idGenerator).callCount).to.equal(0);
                    expect(result._state.doc_ids).to.deep.equal(expected);
                });
        });
    });
});
