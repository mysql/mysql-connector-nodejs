'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const tableFiltering = require('../../../lib/DevAPI/TableFiltering');

describe('TableFiltering', () => {
    context('where()', () => {
        it('sets an empty criteria expression if no arguments are provided', () => {
            return expect(tableFiltering().where().getCriteria()).to.be.empty;
        });

        it('sets the given criteria expression', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(tableFiltering().where('').getCriteria()).to.be.empty;
            return expect(tableFiltering().where('foo').getCriteria()).to.equal('foo');
        });

        it('clears the expression criteria cache', () => {
            /* eslint-disable no-unused-expressions */
            expect(tableFiltering().where().getCriteriaExpr()).to.not.exist;
            expect(tableFiltering().where('').getCriteriaExpr()).to.not.exist;
            /* eslint-enable no-unused-expressions */
            return expect(tableFiltering().where('foo').getCriteriaExpr()).to.not.exist;
        });
    });
});
