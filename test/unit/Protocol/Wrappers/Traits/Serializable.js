'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let serializable = require('../../../../../lib/Protocol/Wrappers/Traits/Serializable');

describe('Serializable trait', () => {
    let bytes;

    beforeEach('create fakes', () => {
        bytes = td.replace('../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        serializable = require('../../../../../lib/Protocol/Wrappers/Traits/Serializable');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('serialize()', () => {
        it('converts the serialized typed array into a raw network buffer', () => {
            const toBuffer = td.function();
            const serializeBinary = td.function();
            const proto = { serializeBinary };

            td.when(serializeBinary()).thenReturn('foo');
            td.when(bytes('foo')).thenReturn({ toBuffer });
            td.when(toBuffer()).thenReturn('bar');

            expect(serializable(proto).serialize()).to.equal('bar');
        });
    });
});
