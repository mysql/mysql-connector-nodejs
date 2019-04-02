'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const grouping = require('../../../lib/DevAPI/Grouping');
const td = require('testdouble');

describe('Grouping', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('groupBy()', () => {
        it('forces an associated statement to be re-prepared', () => {
            const forceRestart = td.function();
            const statement = grouping({ preparable: { forceRestart } });

            statement.groupBy('foo');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });
    });

    context('hasBaseGroupingCriteria()', () => {
        it('returns true if the expression criteria does not need to be parsed', () => {
            /* eslint-disable no-unused-expressions */
            expect(grouping({ criteria: true }).hasBaseGroupingCriteria()).to.be.true;
            expect(grouping({ criteria: '' }).hasBaseGroupingCriteria()).to.be.true;
            expect(grouping({ criteria: 'true' }).hasBaseGroupingCriteria()).to.be.true;
            /* eslint-enable no-unused-expressions */
            return expect(grouping({ criteria: 'TRUE' }).hasBaseGroupingCriteria()).to.be.true;
        });

        it('returns false if the expression criteria needs to be parsed', () => {
            /* eslint-disable no-unused-expressions */
            expect(grouping({ criteria: 'foo' }).hasBaseGroupingCriteria()).to.be.false;
            expect(grouping({ criteria: 'false' }).hasBaseGroupingCriteria()).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(grouping({ criteria: 'FALSE' }).hasBaseGroupingCriteria()).to.be.false;
        });

        it('does not fail if the criteria is invalid', () => {
            /* eslint-disable no-unused-expressions */
            expect(() => grouping({ criteria: undefined }).hasBaseGroupingCriteria()).to.not.throw;
            expect(() => grouping({ criteria: false }).hasBaseGroupingCriteria()).to.not.throw;
            expect(() => grouping({ criteria: 1.23 }).hasBaseGroupingCriteria()).to.not.throw;
            /* eslint-enable no-unused-expressions */
            return expect(() => grouping({ criteria: [1, 2, 3] }).hasBaseGroupingCriteria()).to.not.throw;
        });
    });

    context('having()', () => {
        it('forces an associated statement to be re-prepared', () => {
            const forceRestart = td.function();
            const statement = grouping({ preparable: { forceRestart } });

            statement.having('foo');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });
    });
});
