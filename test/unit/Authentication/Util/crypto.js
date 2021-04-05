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

const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let crypto = require('../../../../lib/crypto');

describe('crypto', () => {
    let coreCrypto;

    beforeEach('setup fakes', () => {
        coreCrypto = td.replace('crypto');

        crypto = require('../../../../lib/crypto');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('sha1()', () => {
        it('creates an sha1 hash of the given parameters', () => {
            const digest = td.function();
            const update = td.function();

            td.when(coreCrypto.createHash('sha1')).thenReturn({ update, digest });
            td.when(update('foo')).thenReturn();
            td.when(update('bar')).thenReturn();
            td.when(digest()).thenReturn('foobar');

            const hash = crypto.sha1('foo', 'bar');

            expect(hash).to.equal('foobar');
            expect(td.explain(update).callCount).to.equal(2);
            expect(td.explain(update).calls[0].args).to.deep.equal(['foo']);
            expect(td.explain(update).calls[1].args).to.deep.equal(['bar']);
        });
    });

    context('sha256()', () => {
        it('creates an sha256 hash of the given parameters', () => {
            const digest = td.function();
            const update = td.function();

            td.when(coreCrypto.createHash('sha256')).thenReturn({ update, digest });
            td.when(update('foo')).thenReturn();
            td.when(update('bar')).thenReturn();
            td.when(digest()).thenReturn('foobar');

            const hash = crypto.sha256('foo', 'bar');

            expect(hash).to.equal('foobar');
            expect(td.explain(update).callCount).to.equal(2);
            expect(td.explain(update).calls[0].args).to.deep.equal(['foo']);
            expect(td.explain(update).calls[1].args).to.deep.equal(['bar']);
        });
    });

    context('xor()', () => {
        it('throws an error if the given buffers have different sizes', () => {
            expect(() => crypto.xor(Buffer.from('x'), Buffer.from('yy'))).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_AUTH_SCRAMBLE_BUFFER_SIZE);
        });

        it('applies a bitwise xor to the given buffers', () => {
            const bufferA = Buffer.from(0b10101010.toString(16), 'hex');
            const bufferB = Buffer.from(0b01010101.toString(16), 'hex');
            const expected = Buffer.from(0b11111111.toString(16), 'hex');

            expect(crypto.xor(bufferA, bufferB).toString('hex')).to.equal(expected.toString('hex'));
        });
    });
});
