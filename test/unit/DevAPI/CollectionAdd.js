'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const collectionAdd = require('lib/DevAPI/CollectionAdd');
const proxyquire = require('proxyquire');
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

        it('should return a Result instance containing the operation details', () => {
            const expected = { done: true };
            const state = { ok: true };
            const fakeResult = td.function();
            const fakeCollectionAdd = proxyquire('lib/DevAPI/CollectionAdd', { './Result': fakeResult });

            const query = fakeCollectionAdd({ _client: { crudInsert } }, 'bar', 'baz')
                .add({ name: 'qux' })
                .add({ name: 'quux' });

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should return early if no documents were provided', () => {
            const query = collectionAdd({ _client: crudInsert }, 'foo', 'bar', []);

            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve();

            return expect(query.execute()).to.be.fulfilled
                .then(() => expect(td.explain(crudInsert).callCount).to.equal(0));
        });
    });
});
