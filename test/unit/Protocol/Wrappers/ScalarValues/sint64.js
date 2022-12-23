/*
 * Copyright (c) 2022, Oracle and/or its affiliates.
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

// subject under test needs to be reloaded with replacement fakes
let sint64 = require('../../../../../lib/Protocol/Wrappers/ScalarValues/sint64');

describe('Protobuf sint64 wrapper', () => {
    let int64;

    beforeEach('replace dependencies with test doubles', () => {
        int64 = td.replace('../../../../../lib/Protocol/Wrappers/ScalarValues/int64');
        sint64 = require('../../../../../lib/Protocol/Wrappers/ScalarValues/sint64');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('creates a string wrapper for an unsafe BigInt value by default', () => {
                const bigInt = -9223372036854775808n;
                const valueOf = td.function();
                const want = 'foo';

                td.when(int64('-9223372036854775808')).thenReturn({ valueOf });
                td.when(valueOf()).thenReturn(want);

                expect(sint64.create(bigInt).valueOf()).to.equal(want);
            });

            it('creates a number wrapper for a safe BigInt value by default', () => {
                const bigInt = -123n;
                const valueOf = td.function();
                const want = 'foo';

                td.when(int64(-123)).thenReturn({ valueOf });
                td.when(valueOf()).thenReturn(want);

                expect(sint64.create(bigInt).valueOf()).to.equal(want);
            });

            it('can create a string wrapper for any BigInt value', () => {
                const bigInt = -123n;
                const valueOf = td.function();
                const want = 'foo';

                td.when(int64('-123')).thenReturn({ valueOf });
                td.when(valueOf()).thenReturn(want);

                expect(sint64.create(bigInt, { type: int64.Type.STRING }).valueOf()).to.equal(want);
            });

            it('can create a BigInt wrapper for any BigInt value', () => {
                const bigInt = -123n;
                const valueOf = td.function();
                const want = 'foo';

                td.when(int64(bigInt)).thenReturn({ valueOf });
                td.when(valueOf()).thenReturn(want);

                expect(sint64.create(bigInt, { type: int64.Type.BIGINT }).valueOf()).to.equal(want);
            });

            it('can create a string wrapper for unsafe BigInt values only', () => {
                const unsafeBigInt = -9223372036854775808n;
                const safeBigInt = -123n;
                const valueOf = td.function();
                const want = ['foo', 'bar'];

                td.when(int64(unsafeBigInt.toString())).thenReturn({ valueOf });
                td.when(int64(Number(safeBigInt))).thenReturn({ valueOf });
                td.when(valueOf()).thenReturn(want[1]);
                td.when(valueOf(), { times: 1 }).thenReturn(want[0]);

                expect(sint64.create(unsafeBigInt, { type: int64.Type.UNSAFE_STRING }).valueOf()).to.equal(want[0]);
                expect(sint64.create(safeBigInt, { type: int64.Type.UNSAFE_STRING }).valueOf()).to.equal(want[1]);
            });

            it('can create a BigInt wrapper for unsafe BigInt values only', () => {
                const unsafeBigInt = -9223372036854775808n;
                const safeBigInt = -123n;
                const valueOf = td.function();
                const want = ['foo', 'bar'];

                td.when(int64(unsafeBigInt)).thenReturn({ valueOf });
                td.when(int64(Number(safeBigInt))).thenReturn({ valueOf });
                td.when(valueOf()).thenReturn(want[1]);
                td.when(valueOf(), { times: 1 }).thenReturn(want[0]);

                expect(sint64.create(unsafeBigInt, { type: int64.Type.UNSAFE_BIGINT }).valueOf()).to.equal(want[0]);
                expect(sint64.create(safeBigInt, { type: int64.Type.UNSAFE_BIGINT }).valueOf()).to.equal(want[1]);
            });
        });

        context('deserialize()', () => {
            it('does nothing for a raw string containing an unsafe integer by default', () => {
                // Both cases fallback into the default behaviour.
                expect(sint64.deserialize('-9223372036854775808')).to.equal('-9223372036854775808');
                expect(sint64.deserialize('-9223372036854775808'), { type: int64.Type.UNSAFE_STRING }).to.equal('-9223372036854775808');
            });

            it('converts a raw string containing a safe integer into a JavaScript number by default', () => {
                // Both cases fallback into the default behaviour.
                expect(sint64.deserialize('-123')).to.equal(-123);
                expect(sint64.deserialize('-123'), { type: int64.Type.UNSAFE_STRING }).to.equal(-123);
            });

            it('can convert a raw string containing an unsafe integer into a JavaScript BigInt', () => {
                expect(sint64.deserialize('-9223372036854775808', { type: int64.Type.BIGINT })).to.equal(-9223372036854775808n);
                expect(sint64.deserialize('-9223372036854775808', { type: int64.Type.UNSAFE_BIGINT })).to.equal(-9223372036854775808n);
            });

            it('can convert a raw string containing any integer into a JavaScript BigInt', () => {
                expect(sint64.deserialize('-123', { type: int64.Type.BIGINT })).to.equal(-123n);
            });

            it('can not convert a string containing a safe integer', () => {
                expect(sint64.deserialize('-123', { type: int64.Type.STRING })).to.equal('-123');
            });
        });
    });

    context('instance methods', () => {
        context('valueOf()', () => {
            it('returns the underlying typed array', () => {
                const bigInt = BigInt(3);
                const valueOf = td.function();

                td.when(valueOf()).thenReturn('foo');
                td.when(int64(bigInt)).thenReturn({ valueOf });

                expect(sint64(bigInt).valueOf()).to.equal('foo');
            });
        });
    });
});
