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
    });

    context('execute()', () => {
        let crudInsert;

        beforeEach('create fakes', () => {
            crudInsert = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('should pass itself to the client implementation', () => {
            const state = { ok: true };
            const expected = new Result(state);

            const query = collectionAdd({ _client: { crudInsert } }, 'bar', 'baz')
                .add({ name: 'qux' })
                .add({ name: 'quux' });

            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).to.eventually.eventually.deep.equal(expected);
        });

        it('should append the ids of the added documents to the response state', () => {
            const idList = ['1', '2'];
            const state = { doc_ids: idList };

            const query = collectionAdd({ _client: { crudInsert } }, 'bar', 'baz')
                .add({ name: 'qux' })
                .add({ name: 'quux' });

            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).to.be.fulfilled
                .then(result => expect(result.getDocumentIds()).to.deep.equal(idList));
        });

        it('should return early if no documents were provided', () => {
            const query = collectionAdd({ _client: crudInsert }, 'foo', 'bar', []);

            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve();

            return expect(query.execute()).to.be.fulfilled
                .then(() => expect(td.explain(crudInsert).callCount).to.equal(0));
        });
    });
});
