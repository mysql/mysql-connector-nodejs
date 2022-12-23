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
const MyJSON = require('../../lib/json');

describe('JSON', () => {
    const safeInt = 1234;
    const safeDecimal = 1.234;
    const signedBigInt = '-9223372036854775808';
    const unsignedBigInt = '18446744073709551615';
    const unsafeDecimal = '9.9999999999999999';

    context('parse()', () => {
        const json = `{ "a": "foo", "b": true, "c": false, "d": null, "e": ${safeInt}, "f": ${safeDecimal}, "g": ${signedBigInt}, "h": ${unsignedBigInt}, "i": ${unsafeDecimal} }`;

        it('returns the same output as the native JSON.parse() by omission', () => {
            expect(MyJSON().parse(json)).to.deep.equal(JSON.parse(json));
        });

        context('when the "unsafeNumberAsString" option is enabled', () => {
            context('and no other option is enabled', () => {
                it('returns unsafe numbers as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: safeInt, f: safeDecimal, g: signedBigInt, h: unsignedBigInt, i: unsafeDecimal };
                    const got = MyJSON({ unsafeNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "unsafeNumberAsBigInt" option is enabled', () => {
                it('returns unsafe integers as a BigInt and unsafe decimals as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: safeInt, f: safeDecimal, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: unsafeDecimal };
                    const got = MyJSON({ unsafeIntegerAsBigInt: true, unsafeNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "anyIntegerAsBigInt" option is enabled', () => {
                it('returns all integers as a BigInt and unsafe decimals as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: BigInt(safeInt), f: safeDecimal, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: unsafeDecimal };
                    const got = MyJSON({ anyIntegerAsBigInt: true, unsafeNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "anyNumberAsString" option is enabled', () => {
                it('returns all all numbers as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: `${safeInt}`, f: `${safeDecimal}`, g: signedBigInt, h: unsignedBigInt, i: unsafeDecimal };
                    const got = MyJSON({ anyNumberAsString: true, unsafeNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });
        });

        context('when the "anyNumberAsString" option is enabled', () => {
            context('and no other option is enabled', () => {
                it('returns all all numbers as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: `${safeInt}`, f: `${safeDecimal}`, g: signedBigInt, h: unsignedBigInt, i: unsafeDecimal };
                    const got = MyJSON({ anyNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "unsafeNumberAsBigInt" option is enabled', () => {
                it('returns unsafe integers as a BigInt and all other numbers as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: `${safeInt}`, f: `${safeDecimal}`, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: unsafeDecimal };
                    const got = MyJSON({ unsafeIntegerAsBigInt: true, anyNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "anyNumberAsBigInt" option is enabled', () => {
                it('returns all integers as a BigInt and all decimals as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: BigInt(safeInt), f: `${safeDecimal}`, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: unsafeDecimal };
                    const got = MyJSON({ anyIntegerAsBigInt: true, anyNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "unsafeNumberAsString" option is enabled', () => {
                it('returns all all numbers as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: `${safeInt}`, f: `${safeDecimal}`, g: signedBigInt, h: unsignedBigInt, i: unsafeDecimal };
                    const got = MyJSON({ anyNumberAsString: true, unsafeNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });
        });

        context('when the "unsafeIntegerAsBigInt" option is enabled', () => {
            context('and no other option is enabled', () => {
                it('returns unsafe integers as a BigInt', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: safeInt, f: safeDecimal, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: parseFloat(unsafeDecimal) };
                    const got = MyJSON({ unsafeIntegerAsBigInt: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "anyIntegerAsBigInt" option is enabled', () => {
                it('returns all integers as a BigInt', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: BigInt(safeInt), f: safeDecimal, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: parseFloat(unsafeDecimal) };
                    const got = MyJSON({ anyIntegerAsBigInt: true, unsafeIntegerAsBigInt: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "unsafeNumberAsString" option is enabled', () => {
                it('returns unsafe integers as a BigInt and unsafe decimals as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: safeInt, f: safeDecimal, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: unsafeDecimal };
                    const got = MyJSON({ unsafeIntegerAsBigInt: true, unsafeNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "anyNumberAsString" option is enabled', () => {
                it('returns unsafe integers as a BigInt and all other numbers as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: `${safeInt}`, f: `${safeDecimal}`, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: unsafeDecimal };
                    const got = MyJSON({ unsafeIntegerAsBigInt: true, anyNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });
        });

        context('when the "anyIntegerAsBigInt" option is enabled', () => {
            context('and no other option is enabled', () => {
                it('returns integers as a BigInt', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: BigInt(safeInt), f: safeDecimal, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: parseFloat(unsafeDecimal) };
                    const got = MyJSON({ anyIntegerAsBigInt: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "unsafeIntegerAsBigInt" option is enabled', () => {
                it('returns all integers as a BigInt', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: BigInt(safeInt), f: safeDecimal, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: parseFloat(unsafeDecimal) };
                    const got = MyJSON({ anyIntegerAsBigInt: true, unsafeIntegerAsBigInt: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "unsafeNumberAsString" option is enabled', () => {
                it('returns integers as a BigInt and unsafe decimals as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: BigInt(safeInt), f: safeDecimal, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: unsafeDecimal };
                    const got = MyJSON({ anyIntegerAsBigInt: true, unsafeNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });

            context('and the "anyNumberAsString" option is enabled', () => {
                it('returns integers as a BigInt and all other numbers as a string', () => {
                    const want = { a: 'foo', b: true, c: false, d: null, e: BigInt(safeInt), f: `${safeDecimal}`, g: BigInt(signedBigInt), h: BigInt(unsignedBigInt), i: unsafeDecimal };
                    const got = MyJSON({ anyIntegerAsBigInt: true, anyNumberAsString: true }).parse(json);

                    expect(got).to.deep.equal(want);
                });
            });
        });
    });
});
