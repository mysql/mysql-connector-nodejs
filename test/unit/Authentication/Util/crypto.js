'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const crypto = require('lib/Authentication/Util/crypto');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const td = require('testdouble');

describe('crypto utilities', () => {
    context('hashing functions', () => {
        let createHash, digest, fakeCrypto, update;

        beforeEach('setup fakes', () => {
            createHash = td.function();
            digest = td.function();
            update = td.function();

            fakeCrypto = proxyquire('lib/Authentication/Util/crypto', { crypto: { createHash } });
        });

        context('sha1()', () => {
            it('should create an sha1 hash of the given parameters', () => {
                td.when(digest()).thenReturn('foobar');
                td.when(update('bar')).thenReturn();
                td.when(update('foo')).thenReturn();
                td.when(createHash('sha1')).thenReturn({ update, digest });

                expect(fakeCrypto.sha1('foo', 'bar')).to.equal('foobar');
                expect(td.explain(update).callCount).to.equal(2);
                expect(td.explain(update).calls[0].args).to.deep.equal(['foo']);
                expect(td.explain(update).calls[1].args).to.deep.equal(['bar']);
            });
        });

        context('sha256()', () => {
            it('should create an sha256 hash of the given parameters', () => {
                td.when(digest()).thenReturn('foobar');
                td.when(update('bar')).thenReturn();
                td.when(update('foo')).thenReturn();
                td.when(createHash('sha256')).thenReturn({ update, digest });

                expect(fakeCrypto.sha256('foo', 'bar')).to.equal('foobar');
                expect(td.explain(update).callCount).to.equal(2);
                expect(td.explain(update).calls[0].args).to.deep.equal(['foo']);
                expect(td.explain(update).calls[1].args).to.deep.equal(['bar']);
            });
        });
    });

    context('xor()', () => {
        it('should throw an error if the given buffers have different sizes', () => {
            /* eslint-disable node/no-deprecated-api */
            expect(() => crypto.xor(new Buffer('x'), new Buffer('yy'))).to.throw();
            /* eslint-enable node/no-deprecated-api */
        });

        it('should apply a bitwise xor to the given buffers', () => {
            /* eslint-disable node/no-deprecated-api */
            const bufferA = new Buffer(0b10101010.toString(16), 'hex');
            const bufferB = new Buffer(0b01010101.toString(16), 'hex');
            const expected = new Buffer(0b11111111.toString(16), 'hex');
            /* eslint-enable node/no-deprecated-api */

            expect(crypto.xor(bufferA, bufferB).toString('hex')).to.equal(expected.toString('hex'));
        });
    });
});
