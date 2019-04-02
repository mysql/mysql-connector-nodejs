'use strict';

/* eslint-env node, mocha */

const collectionAdd = require('../../../lib/DevAPI/CollectionAdd');
const expect = require('chai').expect;
const td = require('testdouble');

describe('CollectionAdd', () => {
    context('getClassName()', () => {
        it('returns the correct class name (to avoid duck typing)', () => {
            expect(collectionAdd().getClassName()).to.equal('CollectionAdd');
        });
    });

    context('add()', () => {
        it('is fluent', () => {
            const query = collectionAdd().add({ foo: 'bar' });

            expect(query.add).to.be.a('function');
        });

        it('includes the documents provided as an array', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = collectionAdd().add(expected);

            expect(query.getItems()).to.deep.equal(expected);
        });

        it('includes all the documents provided as multiple arguments', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = collectionAdd().add(expected[0], expected[1]);

            expect(query.getItems()).to.deep.equal(expected);
        });

        it('appends documents to existing ones', () => {
            const expected = [{ foo: 'bar' }, { foo: 'baz' }];
            const query = collectionAdd(null, null, null, [{ foo: 'bar' }]).add({ foo: 'baz' });

            expect(query.getItems()).to.deep.equal(expected);
        });

        it('appends documents provided on multiple calls', () => {
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

        it('returns a Result instance containing the operation details', () => {
            const expected = { done: true };
            const state = { ok: true };
            const fakeResult = td.function();

            td.replace('../../../lib/DevAPI/Result', fakeResult);
            const fakeCollectionAdd = require('../../../lib/DevAPI/CollectionAdd');

            const query = fakeCollectionAdd({ _client: { crudInsert } }, 'bar', 'baz')
                .add({ name: 'qux' })
                .add({ name: 'quux' });

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve(state);

            return query.execute()
                .then(actual => expect(actual).deep.equal(expected));
        });

        it('returns early if no documents were provided', () => {
            const query = collectionAdd({ _client: crudInsert }, 'foo', 'bar', []);

            td.when(crudInsert(), { ignoreExtraArgs: true }).thenResolve();

            return query.execute()
                .then(() => expect(td.explain(crudInsert).callCount).to.equal(0));
        });
    });
});
