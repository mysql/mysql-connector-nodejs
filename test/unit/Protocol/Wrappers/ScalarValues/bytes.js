'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let bytes = require('../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');

describe('Protobuf bytes wrapper', () => {
    context('class methods', () => {
        context('deserialize()', () => {
            it('creates a wrapper with a typed array of raw network data using shared memory', () => {
                // eslint-disable-next-line node/no-deprecated-api
                const input = new Buffer('foo');
                const output = bytes.deserialize(input).valueOf();

                // strict equality to ensure it references the same memory
                expect(output.buffer).to.equal(input.buffer);
            });

            it('creates a wrapper with an empty typed array if the data is not valid', () => {
                const empty = new Uint8Array();

                expect(bytes.deserialize().valueOf()).to.deep.equal(empty);
                expect(bytes.deserialize(null).valueOf()).to.deep.equal(empty);
                expect(bytes.deserialize('foo').valueOf()).to.deep.equal(empty);
            });
        });
    });

    context('instance methods', () => {
        let wraps;

        beforeEach('create fakes', () => {
            wraps = td.replace('../../../../../lib/Protocol/Wrappers/Traits/Wraps');
            bytes = require('../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        context('toBuffer()', () => {
            it('converts the underlying typed array into a Node.js Buffer instance using shared memory', () => {
                // eslint-disable-next-line node/no-deprecated-api
                const input = new Uint8Array(new Buffer('foo'));
                const output = bytes(input).toBuffer();

                // strict equality to ensure it references the same memory
                expect(input.buffer).to.equal(output.buffer);
            });

            it('returns an empty Node.js Buffer instance if the underlying typed array is not valid', () => {
                // eslint-disable-next-line node/no-deprecated-api
                const empty = new Buffer(0);

                expect(bytes().toBuffer()).to.deep.equal(empty);
                expect(bytes(null).toBuffer()).to.deep.equal(empty);
                expect(bytes('foo').toBuffer()).to.deep.equal(empty);
            });
        });

        context('toJSON()', () => {
            it('returns an object that can be directly serialized to JSON', () => {
                // eslint-disable-next-line node/no-deprecated-api
                const input = new Uint8Array(new Buffer('foo'));
                const output = bytes(input).toJSON();

                expect(output).to.deep.equal({ type: 'Buffer', data: Array.from(input) });
            });
        });

        context('toString()', () => {
            it('converts the underlying typed array data into a string with a given encoding', () => {
                const input = 'foo';
                // eslint-disable-next-line node/no-deprecated-api
                const wrapper = bytes(new Uint8Array(new Buffer(input)));

                expect(wrapper.toString()).to.equal(input);
                // eslint-disable-next-line node/no-deprecated-api
                expect(wrapper.toString('base64')).to.equal((new Buffer(input)).toString('base64'));
            });
        });

        context('valueOf()', () => {
            it('returns the underlying typed array', () => {
                const typedArray = new Uint8Array();
                const valueOf = td.function();

                td.when(valueOf()).thenReturn('foo');
                td.when(wraps(typedArray)).thenReturn({ valueOf });

                expect(bytes(typedArray).valueOf()).to.equal('foo');
            });
        });
    });
});
