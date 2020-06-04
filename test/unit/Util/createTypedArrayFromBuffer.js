'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const tools = require('../../../lib/Protocol/Util');

describe('createTypedArrayFromBuffer()', () => {
    it('converts a Node.js Buffer into a JavaScript typed array using the same allocated memory', () => {
        // eslint-disable-next-line node/no-deprecated-api
        const input = new Buffer('foo');
        const output = tools.createTypedArrayFromBuffer(input);

        // strict equality
        expect(input.buffer).to.equal(output.buffer);
    });

    it('returns nothing if the input is not a Buffer instance', () => {
        return expect(tools.createTypedArrayFromBuffer('foo')).to.not.exist;
    });
});
