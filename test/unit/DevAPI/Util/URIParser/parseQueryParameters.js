/*
 * Copyright (c) 2017, 2021, Oracle and/or its affiliates.
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
const parseQueryParameters = require('../../../../../lib/DevAPI/Util/URIParser/parseQueryParameters');

describe('parseQueryParameters', () => {
    it('parses a valid query string', () => {
        expect(parseQueryParameters('foo=bar&baz=qux')).to.deep.equal({ foo: 'bar', baz: 'qux' });
    });

    // TODO(Rui): not sure if this looks good.
    it('parses empty parameter values', () => {
        ['foo=&bar=', 'foo&bar'].forEach(querystring => {
            expect(parseQueryParameters(querystring)).to.deep.equal({ foo: '', bar: '' });
        });
    });

    it('parses a query string with pct-encoded values', () => {
        expect(parseQueryParameters('foobar=foo%2Fbar&bazqux=baz%2Fqux')).to.deep.equal({ foobar: 'foo/bar', bazqux: 'baz/qux' });
    });

    it('parses a query string with custom encoded text', () => {
        expect(parseQueryParameters('foobar=(foo/bar)&bazqux=(baz/qux)')).to.deep.equal({ foobar: 'foo/bar', bazqux: 'baz/qux' });
    });

    it('parses an empty querystring', () => {
        expect(parseQueryParameters('')).to.deep.equal({});
    });

    it('optionally throws an error for duplicate parameters', () => {
        expect(() => parseQueryParameters('foo=bar&foo=baz', { allowDuplicates: false })).to.throw('The connection string cannot contain duplicate query parameters.');
    });

    it('supports case-insensitive option keys', () => {
        expect(parseQueryParameters('fOo=bar&BAZ=QuX')).to.deep.equal({ foo: 'bar', baz: 'QuX' });
    });

    it('supports specific case-insensitive option values', () => {
        expect(parseQueryParameters('fOo=BaR&BAZ=QuX', { ignoreCase: ['foo'] })).to.deep.equal({ foo: 'bar', baz: 'QuX' });
    });
});
