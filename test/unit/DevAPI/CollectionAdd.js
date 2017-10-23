'use strict';

/* eslint-env node, mocha */

const Result = require('lib/DevAPI/Result');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collectionAdd = require('lib/DevAPI/CollectionAdd');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('CollectionAdd', () => {
    let idGenerator;

    beforeEach('create fakes', () => {
        idGenerator = td.function();
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

            expect(query.getItems()).to.deep.equal(expected);
        });

        it('should include all the documents provided as multiple arguments', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = collectionAdd().add(expected[0], expected[1]);

            expect(query.getItems()).to.deep.equal(expected);
        });

        it('should append documents to existing ones', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = collectionAdd(null, null, null, [{ foo: 'bar' }]).add({ foo: 'baz' });

            expect(query.getItems()).to.deep.equal(expected);
        });

        it('should append documents provided on multiple calls', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = collectionAdd().add({ foo: 'bar' }).add({ foo: 'baz' });

            expect(query.getItems()).to.deep.equal(expected);
        });

        it('should generate an id for documents that do not have one', () => {
            td.when(idGenerator()).thenReturn('2');
            td.when(idGenerator(), { times: 1 }).thenReturn('1');

            const query = collectionAdd({ idGenerator }).add([{ name: 'foo' }, { name: 'bar' }]);

            expect(query.getItems()).to.deep.equal([{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }]);
        });

        it('should not generate an id for documents with `_id` equal to `0`', () => {
            const query = collectionAdd({ idGenerator }).add([{ _id: '0', name: 'foo' }]);

            expect(query.getItems()).to.deep.equal([{ _id: '0', name: 'foo' }]);
            expect(td.explain(idGenerator).callCount).to.equal(0);
        });
    });

    context('execute()', () => {
        let crudInsert;

        beforeEach('create fakes', () => {
            crudInsert = td.function();
        });

        it('should pass itself to the client implementation', () => {
            const idList = ['1', '2'];
            const state = { doc_ids: idList };
            const expected = new Result(state);

            td.when(idGenerator()).thenReturn(idList[1]);
            td.when(idGenerator(), { times: 1 }).thenReturn(idList[0]);

            const query = collectionAdd({ _client: { crudInsert }, idGenerator }, 'bar', 'baz')
                .add({ name: 'qux' })
                .add({ name: 'quux' });

            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).to.eventually.eventually.deep.equal(expected);
        });

        it('should append the ids of the added documents to the response state', () => {
            const idList = ['1', '2'];
            const state = { doc_ids: idList };

            td.when(idGenerator()).thenReturn(idList[1]);
            td.when(idGenerator(), { times: 1 }).thenReturn(idList[0]);

            const query = collectionAdd({ _client: { crudInsert }, idGenerator }, 'bar', 'baz')
                .add({ name: 'qux' })
                .add({ name: 'quux' });

            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).to.be.fulfilled
                .then(result => expect(result.getDocumentIds()).to.deep.equal(idList));
        });

        it('should return early if no documents were provided', () => {
            const query = collectionAdd({ _client: crudInsert }, 'foo', 'bar', []);

            td.when(idGenerator(), { ignoreExtraArgs: true }).thenReturn();
            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve();

            return expect(query.execute()).to.be.fulfilled
                .then(() => {
                    expect(td.explain(idGenerator).callCount).to.equal(0);
                    expect(td.explain(crudInsert).callCount).to.equal(0);
                });
        });
    });
});
