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
const td = require('testdouble');

describe('srv', () => {
    let srv, resolveSrv;

    beforeEach('create fakes', () => {
        resolveSrv = td.function();

        td.replace('../../../../lib/Adapters/dns', { resolveSrv });
        srv = require('../../../../lib/DevAPI/Util/srv');
    });

    context('getSortedAddressList()', () => {
        it('sorts by ascending priority', () => {
            const addresses = [{
                name: 'foo',
                priority: 2
            }, {
                name: 'bar',
                priority: 0
            }, {
                name: 'baz',
                priority: 1
            }, {
                name: 'qux',
                priority: 3
            }];

            td.when(resolveSrv('foobar')).thenResolve(addresses);

            return srv.getSortedAddressList('foobar')
                .then(result => {
                    expect(result).to.have.a.lengthOf(4);
                    expect(result[0].name).to.equal('bar');
                    expect(result[1].name).to.equal('baz');
                    expect(result[2].name).to.equal('foo');
                    expect(result[3].name).to.equal('qux');
                });
        });

        it('sorts by descending weight when the priority is the same', () => {
            const addresses = [{
                name: 'foo',
                priority: 0,
                weight: 5
            }, {
                name: 'bar',
                priority: 0,
                weight: 10
            }, {
                name: 'baz',
                priority: 1,
                weight: 15
            }, {
                name: 'qux',
                priority: 1,
                weight: 12
            }, {
                name: 'quux',
                priority: 1,
                weight: 20
            }];

            td.when(resolveSrv('foobar')).thenResolve(addresses);

            return srv.getSortedAddressList('foobar')
                .then(result => {
                    expect(result).to.have.a.lengthOf(5);
                    expect(result[0].name).to.equal('bar');
                    expect(result[1].name).to.equal('foo');
                    expect(result[2].name).to.equal('quux');
                    expect(result[3].name).to.equal('baz');
                    expect(result[4].name).to.equal('qux');
                });
        });

        it('uses FIFO when both priority and weights are the same', () => {
            const addresses = [{
                name: 'foo',
                priority: 0,
                weight: 10
            }, {
                name: 'bar',
                priority: 0,
                weight: 10
            }, {
                name: 'baz',
                priority: 0,
                weight: 10
            }, {
                name: 'qux',
                priority: 0,
                weight: 10
            }];

            td.when(resolveSrv('foobar')).thenResolve(addresses);

            return srv.getSortedAddressList('foobar')
                .then(result => {
                    expect(result).to.have.a.lengthOf(4);
                    expect(result[0].name).to.equal('foo');
                    expect(result[1].name).to.equal('bar');
                    expect(result[2].name).to.equal('baz');
                    expect(result[3].name).to.equal('qux');
                });
        });
    });
});
