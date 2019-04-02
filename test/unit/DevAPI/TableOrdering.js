'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const tableOrdering = require('../../../lib/DevAPI/TableOrdering');
const td = require('testdouble');

describe('TableOrdering', () => {
    context('orderBy()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('forces an associated statement to be re-prepared', () => {
            const statement = tableOrdering({ preparable: { forceRestart } });

            statement.orderBy();

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('accepts multiple values as arguments', () => {
            const statement = tableOrdering({ preparable: { forceRestart } });
            statement.setOrderings = td.function();

            statement.orderBy('foo', 'bar');

            expect(td.explain(statement.setOrderings).callCount).to.equal(1);
            return expect(td.explain(statement.setOrderings).calls[0].args[0]).to.deep.equal(['foo', 'bar']);
        });

        it('accepts a single array of values as argument', () => {
            const statement = tableOrdering({ preparable: { forceRestart } });
            statement.setOrderings = td.function();

            statement.orderBy(['foo', 'bar']);

            expect(td.explain(statement.setOrderings).callCount).to.equal(1);
            return expect(td.explain(statement.setOrderings).calls[0].args[0]).to.deep.equal(['foo', 'bar']);
        });
    });
});
