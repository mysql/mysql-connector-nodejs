/*
 * Copyright (c) 2021, Oracle and/or its affiliates.
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
const validator = require('../../lib/validator');

describe('input validation functions', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('isValidArray()', () => {
        it('validates a value that is an array', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(validator.isValidArray({ value: ['foo'] })).to.be.true;
            return expect(validator.isValidArray({ value: [] })).to.be.true;
        });

        it('invalidates a value that is not an array', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidArray({ value: null })).to.be.false;
            expect(validator.isValidArray({ value: true })).to.be.false;
            expect(validator.isValidArray({ value: false })).to.be.false;
            expect(validator.isValidArray({ value: 3 })).to.be.false;
            expect(validator.isValidArray({ value: 'foo' })).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidArray({ value: { name: 'foo' } })).to.be.false;
        });

        it('invalidates a value that is required but is not defined', () => {
            return expect(validator.isValidArray({ required: true })).to.be.false;
        });

        it('validates a value that is not defined but is not required', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidArray({ required: false })).to.be.true;
            expect(validator.isValidArray({})).to.be.true;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidArray()).to.be.true;
        });

        it('validates each value in the array if an item validator is provided', () => {
            const itemValidator = td.function();

            /* eslint-disable no-unused-expressions */
            expect(validator.isValidArray({ value: [], validator: itemValidator })).to.be.false;
            /* eslint-enable no-unused-expressions */
            td.when(itemValidator({ required: true, value: undefined })).thenReturn(false);
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidArray({ value: [undefined], validator: itemValidator })).to.be.false;
            expect(validator.isValidArray({ value: ['foo', undefined], validator: itemValidator })).to.be.false;
            /* eslint-enable no-unused-expressions */

            td.when(itemValidator({ required: true, value: 'foo' })).thenReturn(true);
            td.when(itemValidator({ required: true, value: 'bar' })).thenReturn(true);

            return expect(validator.isValidArray({ value: ['foo', 'bar'], validator: itemValidator })).to.be.true;
        });
    });

    context('isValidBoolean()', () => {
        it('validates a value that is a boolean', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(validator.isValidBoolean({ value: true })).to.be.true;
            return expect(validator.isValidBoolean({ value: false })).to.be.true;
        });

        it('invalidates a value that is not a boolean', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidBoolean({ value: null })).to.be.false;
            expect(validator.isValidBoolean({ value: 1 })).to.be.false;
            expect(validator.isValidBoolean({ value: 'foo' })).to.be.false;
            expect(validator.isValidBoolean({ value: { name: 'foo' } })).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidBoolean({ value: ['foo'] })).to.be.false;
        });

        it('invalidates a value that is required but is not defined', () => {
            return expect(validator.isValidBoolean({ required: true })).to.be.false;
        });

        it('validates a value that is not defined but is not required', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidBoolean({ required: false })).to.be.true;
            expect(validator.isValidBoolean({})).to.be.true;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidBoolean()).to.be.true;
        });
    });

    context('isValidInteger()', () => {
        it('validates a value that is an integer without a range', () => {
            return expect(validator.isValidInteger({ value: 1 })).to.be.true;
        });

        it('validates if a value that is an integer within a range', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidInteger({ value: 3, min: 0 })).to.be.true;
            expect(validator.isValidInteger({ value: 3, min: 3 })).to.be.true;
            expect(validator.isValidInteger({ value: 3, max: 4 })).to.be.true;
            expect(validator.isValidInteger({ value: 3, max: 3 })).to.be.true;
            expect(validator.isValidInteger({ value: 3, min: 1, max: 4 })).to.be.true;
            expect(validator.isValidInteger({ value: 3, min: 5 })).to.be.false;
            expect(validator.isValidInteger({ value: 3, max: 2 })).to.be.false;
            expect(validator.isValidInteger({ value: 3, min: 6, max: 10 })).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidInteger({ value: 3, min: 0, max: 2 })).to.be.false;
        });

        it('invalidates a value that is not an integer', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidInteger({ value: null })).to.be.false;
            expect(validator.isValidInteger({ value: true })).to.be.false;
            expect(validator.isValidInteger({ value: false })).to.be.false;
            expect(validator.isValidInteger({ value: 2.2 })).to.be.false;
            expect(validator.isValidInteger({ value: 'foo' })).to.be.false;
            expect(validator.isValidInteger({ value: { name: 'foo' } })).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidInteger({ value: ['foo'] })).to.be.false;
        });

        it('invalidates a value that is required but is not defined', () => {
            return expect(validator.isValidInteger({ required: true })).to.be.false;
        });

        it('validates a value that is not defined but is not required', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidInteger({ required: false })).to.be.true;
            expect(validator.isValidInteger({})).to.be.true;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidInteger()).to.be.true;
        });
    });

    context('isValidPEM()', () => {
        it('validates a string that uses PEM formatting', () => {
            return expect(validator.isValidPEM({ value: '-----BEGIN X509-----\nfoo\n-----END X509-----' })).to.be.true;
        });

        it('validates a Node.js Buffer', () => {
            const isBuffer = td.replace(Buffer, 'isBuffer');
            td.when(isBuffer('foo')).thenReturn(true);

            return expect(validator.isValidPEM({ value: 'foo' })).to.be.true;
        });

        it('invalidates everything else', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(validator.isValidPEM({ required: true })).to.be.false;

            const isBuffer = td.replace(Buffer, 'isBuffer');
            td.when(isBuffer('foo')).thenReturn(false);

            return expect(validator.isValidPEM({ value: 'foo' })).to.be.false;
        });
    });

    context('isValidPlainObject()', () => {
        it('validates a value that is an plain object', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(validator.isValidPlainObject({ value: {} })).to.be.true;
            return expect(validator.isValidPlainObject({ value: { name: 'foo' } })).to.be.true;
        });

        it('invalidates a value that is not a plain object', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidPlainObject({ value: null })).to.be.false;
            expect(validator.isValidPlainObject({ value: true })).to.be.false;
            expect(validator.isValidPlainObject({ value: false })).to.be.false;
            expect(validator.isValidPlainObject({ value: 2.2 })).to.be.false;
            expect(validator.isValidPlainObject({ value: 'foo' })).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidPlainObject({ value: ['foo'] })).to.be.false;
        });

        it('invalidates a value that is required but is not defined', () => {
            return expect(validator.isValidPlainObject({ required: true })).to.be.false;
        });

        it('validates a value that is not defined but is not required', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidPlainObject({ required: false })).to.be.true;
            expect(validator.isValidPlainObject({})).to.be.true;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidPlainObject()).to.be.true;
        });
    });

    context('isValidString()', () => {
        it('validates a value that is a string', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(validator.isValidString({ value: '' })).to.be.true;
            return expect(validator.isValidString({ value: 'foo' })).to.be.true;
        });

        it('validates a value that is a string and matches a given pattern', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(validator.isValidString({ value: '12345', pattern: '[0-9]+' })).to.be.true;
            return expect(validator.isValidString({ value: 'mysql-foo', pattern: '^mysql-+' })).to.be.true;
        });

        it('invalidates a value that is a string but does not match a given pattern', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(validator.isValidString({ value: 'foo', pattern: '[0-9]+' })).to.be.false;
            return expect(validator.isValidString({ value: 'mysqlx-foo', pattern: '^mysql-+' })).to.be.false;
        });

        it('invalidates a value that is not an string', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidString({ value: null })).to.be.false;
            expect(validator.isValidString({ value: true })).to.be.false;
            expect(validator.isValidString({ value: false })).to.be.false;
            expect(validator.isValidString({ value: 2.2 })).to.be.false;
            expect(validator.isValidString({ value: { name: 'foo' } })).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidString({ value: ['foo'] })).to.be.false;
        });

        it('invalidates a value that is required but is not defined', () => {
            return expect(validator.isValidString({ required: true })).to.be.false;
        });

        it('validates a value that is not defined but is not required', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidString({ required: false })).to.be.true;
            expect(validator.isValidString({})).to.be.true;
            expect(validator.isValidString({ required: false, pattern: 'foobar' })).to.be.true;
            expect(validator.isValidString({ pattern: 'foobar' })).to.be.true;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidString()).to.be.true;
        });

        it('validates a value according to a given pattern', () => {
            /* eslint-disable no-unused-expressions */
            expect(validator.isValidString({ value: 'foo', pattern: '[0-9]+' })).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(validator.isValidString({ value: 'foo', pattern: '[a-zA-Z]+' })).to.be.true;
        });
    });
});
