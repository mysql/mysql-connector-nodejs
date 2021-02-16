/*
 * Copyright (c) 2019, 2021, Oracle and/or its affiliates.
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
const parseConnectionAttributes = require('../../../../../lib/DevAPI/Util/URIParser/parseConnectionAttributes');

describe('parseConnectionAttributes', () => {
    it('returns an empty object if no attribute element are provided', () => {
        expect(parseConnectionAttributes('?foo=bar&baz=qux')).to.deep.equal({});
    });

    it('returns an empty object if empty attribute is provided', () => {
        expect(parseConnectionAttributes('?connection-attributes=&foo=bar')).to.deep.equal({});
        expect(parseConnectionAttributes('?foo=bar&connection-attributes=')).to.deep.equal({});
    });

    it('returns an empty object if "true" is provided', () => {
        expect(parseConnectionAttributes('?connection-attributes=true')).to.deep.equal({});
    });

    it('returns `false` if "false" is provided', () => {
        return expect(parseConnectionAttributes('?connection-attributes=false')).to.be.false;
    });

    it('accepts an empty array', () => {
        expect(parseConnectionAttributes('?connection-attributes=[]')).to.deep.equal({});
    });

    it('accepts an empty value', () => {
        expect(parseConnectionAttributes('?connection-attributes=[foo=]')).to.deep.equal({ foo: '' });
        expect(parseConnectionAttributes('?connection-attributes=[foo=,bar=baz]')).to.deep.equal({ foo: '', bar: 'baz' });
    });

    it('accepts numeric value as string', () => {
        expect(parseConnectionAttributes('?connection-attributes=[foo=42]')).to.deep.equal({ foo: '42' });
    });

    it('returns an object containing the key-value mappings', () => {
        expect(parseConnectionAttributes('?connection-attributes=[foo=bar]')).to.deep.equal({ foo: 'bar' });
        expect(parseConnectionAttributes('?connection-attributes=[foo=bar,baz=qux]')).to.deep.equal({ foo: 'bar', baz: 'qux' });
    });

    it('works with pct-encoded keys and values', () => {
        const key = encodeURIComponent('@#$%^&*        %^()');
        const value = encodeURIComponent('*(&^&#$%0');
        const expected = { [decodeURIComponent(key)]: 'bar', baz: decodeURIComponent(value) };

        expect(parseConnectionAttributes(`?connection-attributes=[${key}=bar,baz=${value}]`)).to.deep.equal(expected);
    });
});
