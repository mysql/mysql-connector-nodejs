'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

describe('crypto utilities', () => {
    let crypto;

    context('hashing functions', () => {
        let createHash, digest, update;

        beforeEach('setup fakes', () => {
            createHash = td.function();
            digest = td.function();
            update = td.function();

            td.replace('crypto', { createHash });

            crypto = require('../../../../lib/Authentication/Util/crypto');
        });

        context('sha1()', () => {
            it('creates an sha1 hash of the given parameters', () => {
                td.when(digest()).thenReturn('foobar');
                td.when(update('bar')).thenReturn();
                td.when(update('foo')).thenReturn();
                td.when(createHash('sha1')).thenReturn({ update, digest });

                expect(crypto.sha1('foo', 'bar')).to.equal('foobar');
                expect(td.explain(update).callCount).to.equal(2);
                expect(td.explain(update).calls[0].args).to.deep.equal(['foo']);
                expect(td.explain(update).calls[1].args).to.deep.equal(['bar']);
            });
        });

        context('sha256()', () => {
            it('creates an sha256 hash of the given parameters', () => {
                td.when(digest()).thenReturn('foobar');
                td.when(update('bar')).thenReturn();
                td.when(update('foo')).thenReturn();
                td.when(createHash('sha256')).thenReturn({ update, digest });

                expect(crypto.sha256('foo', 'bar')).to.equal('foobar');
                expect(td.explain(update).callCount).to.equal(2);
                expect(td.explain(update).calls[0].args).to.deep.equal(['foo']);
                expect(td.explain(update).calls[1].args).to.deep.equal(['bar']);
            });
        });
    });

    context('xor()', () => {
        beforeEach('load module', () => {
            crypto = require('../../../../lib/Authentication/Util/crypto');
        });

        it('throws an error if the given buffers have different sizes', () => {
            /* eslint-disable node/no-deprecated-api */
            expect(() => crypto.xor(new Buffer('x'), new Buffer('yy'))).to.throw();
            /* eslint-enable node/no-deprecated-api */
        });

        it('applies a bitwise xor to the given buffers', () => {
            /* eslint-disable node/no-deprecated-api */
            const bufferA = new Buffer(0b10101010.toString(16), 'hex');
            const bufferB = new Buffer(0b01010101.toString(16), 'hex');
            const expected = new Buffer(0b11111111.toString(16), 'hex');
            /* eslint-enable node/no-deprecated-api */

            expect(crypto.xor(bufferA, bufferB).toString('hex')).to.equal(expected.toString('hex'));
        });
    });
});
