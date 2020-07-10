'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const optionalString = require('../../../../../lib/Protocol/Wrappers/Traits/OptionalString');

describe('OptionalString trait', () => {
    context('toJSON()', () => {
        it('returns undefined when the input value is not a string', () => {
            /* eslint-disable no-unused-expressions */
            expect(optionalString().toJSON()).to.not.exist;
            expect(optionalString(1).toJSON()).to.not.exist;
            expect(optionalString(true).toJSON()).to.not.exist;
            expect(optionalString([]).toJSON()).to.not.exist;
            expect(optionalString(['foo']).toJSON()).to.not.exist;
            expect(optionalString({}).toJSON()).to.not.exist;
            expect(optionalString({ name: 'foo' }).toJSON()).to.not.exist;
            expect(optionalString(() => {}).toJSON()).to.not.exist;
            /* eslint-enable no-unused-expressions */
        });

        it('returns undefined when the input value is an empty string', () => {
            return expect(optionalString('').toJSON()).to.not.exist;
        });

        it('behaves like an identity function when the input value is a non-empty string', () => {
            const input = 'foo';

            expect(optionalString(input).toJSON()).to.equal(input);
        });
    });
});
