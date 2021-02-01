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
const parsePriorityAddress = require('../../../../../lib/DevAPI/Util/URIParser/parsePriorityAddress');

describe('parsePriorityAddress', () => {
    it('parses a valid address tuple containing an explicit priority', () => {
        expect(parsePriorityAddress('(address=127.0.0.1:33060, priority=90)')).to.deep.equal({ host: '127.0.0.1', port: 33060, priority: 90, socket: undefined });
    });

    it('throws an error if the tuple does not contain a valid priority', () => {
        ['()', '(address=127.0.0.1,)', '(address=[::1]:33060, 90)', '(address=localhost, foo=90)', '(address=[::], foo)'].forEach(invalid => {
            expect(() => parsePriorityAddress(invalid)).to.throw('You must either assign no priority to any of the routers or give a priority for every router');
        });
    });

    it('throws an error if the priority is out of bounds', () => {
        ['(address=[::1]:33060, priority=-1)', '(address=[::], priority=101)'].forEach(invalid => {
            expect(() => parsePriorityAddress(invalid)).to.throw('The priorities must be between 0 and 100');
        });
    });
});
