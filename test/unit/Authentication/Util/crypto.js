/*
 * Copyright (c) 2018, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

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
