'use strict';

/* eslint-env node, mocha */

const collectionOrdering = require('../../../lib/DevAPI/CollectionOrdering');
const expect = require('chai').expect;
const td = require('testdouble');

describe('CollectionOrdering', () => {
    context('sort()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('forces an associated statement to be re-prepared', () => {
            const statement = collectionOrdering({ preparable: { forceRestart } });

            statement.sort();

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('accepts multiple values as arguments', () => {
            const statement = collectionOrdering({ preparable: { forceRestart } });
            statement.setOrderings = td.function();

            statement.sort('foo', 'bar');

            expect(td.explain(statement.setOrderings).callCount).to.equal(1);
            return expect(td.explain(statement.setOrderings).calls[0].args[0]).to.deep.equal(['foo', 'bar']);
        });

        it('accepts a single array of values as argument', () => {
            const statement = collectionOrdering({ preparable: { forceRestart } });
            statement.setOrderings = td.function();

            statement.sort(['foo', 'bar']);

            expect(td.explain(statement.setOrderings).callCount).to.equal(1);
            return expect(td.explain(statement.setOrderings).calls[0].args[0]).to.deep.equal(['foo', 'bar']);
        });
    });
});
