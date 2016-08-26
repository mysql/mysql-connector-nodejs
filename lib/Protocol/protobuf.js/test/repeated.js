/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

/* global describe, it */
var Protobuf = require('../index');
var Schema = require('./schema');
var Chai = require('chai');
Chai.Assertion.includeStack = true;
var expect = Chai.expect;
var client = new Protobuf(Schema);
var encoded, decoded, check;

describe('Repeated tests', function () {
    it('Can encode repeated integers', function () {
        decoded = [1, 2, 3, 4];
        encoded = client.encode('Test2', { ints: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode repeated integers', function () {
        check = client.decode('Test2', encoded);
        expect(check.ints).to.exist;
        expect(check.ints).to.deep.equal(decoded);
    });

    it('Can encode repeated strings', function () {
        decoded = ['one', 'two', 'three', 'four'];
        encoded = client.encode('Test2', { strings: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode repeated strings', function () {
        check = client.decode('Test2', encoded);
        expect(check.strings).to.exist;
        expect(check.strings).to.deep.equal(decoded);
    });
});
