'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const expect = require('chai').expect;
const grouping = require('lib/DevAPI/Grouping');

describe('Grouping', () => {
    context('hasBaseGroupingCriteria()', () => {
        it('should return true if the expression criteria does not need to be parsed', () => {
            /* eslint-disable no-unused-expressions */
            expect(grouping({ criteria: true }).hasBaseGroupingCriteria()).to.be.true;
            expect(grouping({ criteria: '' }).hasBaseGroupingCriteria()).to.be.true;
            expect(grouping({ criteria: 'true' }).hasBaseGroupingCriteria()).to.be.true;
            expect(grouping({ criteria: 'TRUE' }).hasBaseGroupingCriteria()).to.be.true;
            /* eslint-enable no-unused-expressions */
        });

        it('should return false if the expression criteria needs to be parsed', () => {
            /* eslint-disable no-unused-expressions */
            expect(grouping({ criteria: 'foo' }).hasBaseGroupingCriteria()).to.be.false;
            expect(grouping({ criteria: 'false' }).hasBaseGroupingCriteria()).to.be.false;
            expect(grouping({ criteria: 'FALSE' }).hasBaseGroupingCriteria()).to.be.false;
            /* eslint-enable no-unused-expressions */
        });

        it('should not fail if the criteria is invalid', () => {
            /* eslint-disable no-unused-expressions */
            expect(() => grouping({ criteria: undefined }).hasBaseGroupingCriteria()).to.not.throw;
            expect(() => grouping({ criteria: false }).hasBaseGroupingCriteria()).to.not.throw;
            expect(() => grouping({ criteria: 1.23 }).hasBaseGroupingCriteria()).to.not.throw;
            expect(() => grouping({ criteria: [1, 2, 3] }).hasBaseGroupingCriteria()).to.not.throw;
            /* eslint-enable no-unused-expressions */
        });
    });
});
