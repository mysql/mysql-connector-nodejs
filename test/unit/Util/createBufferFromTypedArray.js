'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const tools = require('../../../lib/Protocol/Util');

describe('createBufferFromTypedArray()', () => {
    it('converts a JavaScript typed array into a Node.js Buffer using the same allocated memory', () => {
        // eslint-disable-next-line node/no-deprecated-api
        const input = new Uint8Array(new Buffer('foo'));
        const output = tools.createBufferFromTypedArray(input);

        // strict equality
        expect(input.buffer).to.equal(output.buffer);
    });

    it('returns nothing if the input is not a Uint8Array instance', () => {
        return expect(tools.createBufferFromTypedArray('foo')).to.not.exist;
    });
});
