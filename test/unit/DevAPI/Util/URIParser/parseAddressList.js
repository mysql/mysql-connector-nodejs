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
const parseAddressList = require('../../../../../lib/DevAPI/Util/URIParser/parseAddressList');

describe('parseAddressList', () => {
    it('parses a list of addresses with explicit priority', () => {
        expect(parseAddressList('[(address=127.0.0.1, priority=98), (address=[::1], priority=100), (address=localhost, priority=99)]')).to.deep.equal([{
            host: '127.0.0.1',
            port: undefined,
            priority: 98,
            socket: undefined
        }, {
            host: '::1',
            port: undefined,
            priority: 100,
            socket: undefined
        }, {
            host: 'localhost',
            port: undefined,
            priority: 99,
            socket: undefined
        }]);
    });

    it('parses a list of addresses with random priority', () => {
        expect(parseAddressList('[[::1], localhost, 127.0.0.1]')).to.deep.equal([{
            host: '::1',
            port: undefined,
            socket: undefined
        }, {
            host: 'localhost',
            port: undefined,
            socket: undefined
        }, {
            host: '127.0.0.1',
            port: undefined,
            socket: undefined
        }]);
    });

    it('throws an error if neither one or all addresses have explicit priority', () => {
        [
            '[127.0.0.1, (address=[::1], priority=100)]',
            '[(address=127.0.0.1), (address=[::1], 100)]',
            '[(address=127.0.0.1, foo), (address=[::1], priority=100)]'
        ].forEach(invalid => {
            expect(() => parseAddressList(invalid)).to.throw('You must either assign no priority to any of the routers or give a priority for every router');
        });
    });

    it('throws an error if any address priority is out of bounds', () => {
        [
            '[(address=127.0.0.1, priority=-1), (address=[::1], priority=-2)]',
            '[(address=127.0.0.1, priority=100), (address=[::1], priority=101)]'
        ].forEach(invalid => {
            expect(() => parseAddressList(invalid)).to.throw('The priorities must be between 0 and 100');
        });
    });
});
