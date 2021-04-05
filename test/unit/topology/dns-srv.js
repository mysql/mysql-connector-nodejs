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

const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const td = require('testdouble');
const util = require('util');

// subject under test needs to be reloaded with replacement fakes
let srv = require('../../../lib/topology/dns-srv');

describe('DNS SRV utilities', () => {
    beforeEach('reset fakes', () => {
        td.reset();
    });

    context('lookup()', () => {
        let resolveSrv;

        beforeEach('create fakes', () => {
            resolveSrv = td.function();

            td.replace('dns', { promises: { resolveSrv } });

            srv = require('../../../lib/topology/dns-srv');
        });

        it('returns a list of endpoints that match the service records associated to the given service definition', () => {
            td.when(resolveSrv('foobar')).thenResolve([{ name: 'foo', port: 'bar', priority: 'baz', weight: 'qux' }]);

            return srv.lookup('foobar')
                .then(endpoints => {
                    return expect(endpoints).to.deep.equal([{ host: 'foo', port: 'bar', priority: 'baz', weight: 'qux' }]);
                });
        });

        it('fails when there are no records associated to the service definition', () => {
            const error = new Error();

            td.when(resolveSrv('foobar')).thenReject(error);

            return srv.lookup('foobar')
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_SRV_RECORDS_NOT_AVAILABLE, 'foobar'));
                });
        });
    });

    context('sort()', () => {
        it('sorts service records by ascending priority', () => {
            const serviceRecords = [{
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

            const expected = [{
                name: 'bar',
                priority: 0
            }, {
                name: 'baz',
                priority: 1
            }, {
                name: 'foo',
                priority: 2
            }, {
                name: 'qux',
                priority: 3
            }];

            return expect(srv.sort(serviceRecords)).to.deep.equal(expected);
        });

        it('sorts service records by descending weight when the priority is the same', () => {
            const serviceRecords = [{
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

            const expected = [{
                name: 'bar',
                priority: 0,
                weight: 10
            }, {
                name: 'foo',
                priority: 0,
                weight: 5
            }, {
                name: 'quux',
                priority: 1,
                weight: 20
            }, {
                name: 'baz',
                priority: 1,
                weight: 15
            }, {
                name: 'qux',
                priority: 1,
                weight: 12
            }];

            return expect(srv.sort(serviceRecords)).to.deep.equal(expected);
        });

        it('uses weighted randomness when both priority and weights are the same', () => {
            const serviceRecords = [{
                name: 'foo',
                priority: 1,
                weight: 10
            }, {
                name: 'bar',
                priority: 1,
                weight: 10
            }, {
                name: 'baz',
                priority: 1,
                weight: 10
            }, {
                name: 'qux',
                priority: 0,
                weight: 10
            }, {
                name: 'quux',
                priority: 1,
                weight: 15
            }];

            const res = srv.sort(serviceRecords);

            expect(res).to.be.an('array').and.have.lengthOf(5);
            expect(res[0]).to.deep.equal(serviceRecords[3]);
            expect(res[1]).to.deep.equal(serviceRecords[4]);
            expect(res[2]).to.be.oneOf(serviceRecords.slice(0, 3));
            expect(res[3]).to.be.oneOf(serviceRecords.slice(0, 3));
            expect(res[4]).to.be.oneOf(serviceRecords.slice(0, 3));
        });
    });

    context('validate()', () => {
        it('fails when the "resolveSRV" property is badly specified', () => {
            expect(() => srv.validate({ resolveSrv: 'foo' })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SRV_LOOKUP_OPTION);
            expect(() => srv.validate({ resolveSrv: 1 })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SRV_LOOKUP_OPTION);
            expect(() => srv.validate({ resolveSrv: {} })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SRV_LOOKUP_OPTION);
            return expect(() => srv.validate({ resolveSrv: [] })).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_SRV_LOOKUP_OPTION);
        });

        it('fails when there are multiple possible service definition references', () => {
            return expect(() => srv.validate({ endpoints: [{ host: 'foo' }, { host: 'bar' }], resolveSrv: true })).to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS);
        });

        it('fails when the service definition contains a port', () => {
            expect(() => srv.validate({ endpoints: [{ port: 'foo' }], resolveSrv: true })).to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);
            return expect(() => srv.validate({ port: 'foo', resolveSrv: true })).to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);
        });

        it('fails when the service definition is a path to a local Unix socket file', () => {
            expect(() => srv.validate({ endpoints: [{ socket: 'foo' }], resolveSrv: true })).to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);
            return expect(() => srv.validate({ resolveSrv: true, socket: 'foo' })).to.throw(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);
        });
    });
});
