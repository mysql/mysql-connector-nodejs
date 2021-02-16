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
const parseConnectTimeout = require('../../../../../lib/DevAPI/Util/URIParser/parseConnectTimeout');

describe('parseConnectTimeout', () => {
    it('returns 10000 if no connection timeout value is provided', () => {
        expect(parseConnectTimeout('?foo=bar&baz=qux')).to.deep.equal(10000);
    });

    it('returns an empty string if the parameter does not contain a value', () => {
        [' ', ''].forEach(empty => {
            expect(parseConnectTimeout(`?connect-timeout=${empty}`)).to.deep.equal('');
        });
    });

    it('returns the provided raw value if it is not a positive integer', () => {
        ['foo', '""'].forEach(raw => {
            expect(parseConnectTimeout(`?connect-timeout=${raw}`)).to.deep.equal(raw.toString());
        });
    });

    it('returns a number if it is a positive integer', () => {
        expect(parseConnectTimeout('?connect-timeout=10')).to.equal(10);
    });

    it('throws an error for duplicate options', () => {
        expect(() => parseConnectTimeout('?connect-timeout=10&connect-timeout=20')).to.throw('The connection string cannot contain duplicate query parameters.');
    });
});
