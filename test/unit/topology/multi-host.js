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
const multiHost = require('../../../lib/topology/multi-host');

describe('multi-host utilities', () => {
    context('sort()', () => {
        it('sorts endpoints by descending priority', () => {
            const endpoints = [{
                host: 'foo',
                priority: 90
            }, {
                host: 'bar',
                priority: 80
            }, {
                host: 'baz',
                priority: 100
            }];

            const expected = [{
                host: 'baz',
                priority: 100
            }, {
                host: 'foo',
                priority: 90
            }, {
                host: 'bar',
                priority: 80
            }];

            expect(multiHost.sort(endpoints)).to.deep.equal(expected);
        });

        it('sorts endpoints with preference for those that specify a priority', () => {
            const endpoints = [{
                host: 'foo'
            }, {
                host: 'bar',
                priority: 90
            }, {
                host: 'baz',
                priority: 100
            }];

            const expected = [{
                host: 'baz',
                priority: 100
            }, {
                host: 'bar',
                priority: 90
            }, {
                host: 'foo'
            }];

            expect(multiHost.sort(endpoints)).to.deep.equal(expected);
        });

        it('sorts endpoints with the same priority using weighted randomness', () => {
            const endpoints = [{
                host: 'foo'
            }, {
                host: 'bar',
                priority: 100
            }, {
                host: 'baz'
            }];

            const res = multiHost.sort(endpoints);

            expect(res[0]).to.deep.equal(endpoints[1]);
            expect(res.slice(1)).to.deep.include.all.members([{ host: 'foo' }, { host: 'baz' }]);
        });
    });
});
