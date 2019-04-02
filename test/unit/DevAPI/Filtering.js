'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const filtering = require('../../../lib/DevAPI/Filtering');

describe('Filtering', () => {
    context('hasBaseCriteria()', () => {
        it('returns true if the expression criteria does not need to be parsed', () => {
            /* eslint-disable no-unused-expressions */
            expect(filtering({ criteria: true }).hasBaseCriteria()).to.be.true;
            expect(filtering({ criteria: '' }).hasBaseCriteria()).to.be.true;
            expect(filtering({ criteria: 'true' }).hasBaseCriteria()).to.be.true;
            expect(filtering({ criteria: 'TRUE' }).hasBaseCriteria()).to.be.true;
            /* eslint-enable no-unused-expressions */
        });

        it('returns false if the expression criteria needs to be parsed', () => {
            /* eslint-disable no-unused-expressions */
            expect(filtering({ criteria: 'foo' }).hasBaseCriteria()).to.be.false;
            expect(filtering({ criteria: 'false' }).hasBaseCriteria()).to.be.false;
            expect(filtering({ criteria: 'FALSE' }).hasBaseCriteria()).to.be.false;
            /* eslint-enable no-unused-expressions */
        });

        it('does not fail if the criteria is invalid', () => {
            /* eslint-disable no-unused-expressions */
            expect(() => filtering({ criteria: undefined }).hasBaseCriteria()).to.not.throw;
            expect(() => filtering({ criteria: false }).hasBaseCriteria()).to.not.throw;
            expect(() => filtering({ criteria: 1.23 }).hasBaseCriteria()).to.not.throw;
            expect(() => filtering({ criteria: [1, 2, 3] }).hasBaseCriteria()).to.not.throw;
            /* eslint-enable no-unused-expressions */
        });
    });
});
